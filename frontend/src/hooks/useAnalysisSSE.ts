import { useEffect, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient } from '@tanstack/react-query';

import { API_BASE_URL } from '../config';

interface SSEEvent {
  status: string;
  status_message: string;
  timestamp?: number;
}

interface UseAnalysisSSEOptions {
  jobId: string | number;
  hackathonId: string | number;
  token: string | null;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useAnalysisSSE({
  jobId,
  hackathonId,
  token,
  enabled = true,
  onError
}: UseAnalysisSSEOptions) {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep latest values in refs so the fetchEventSource callbacks
  // never close over stale props. This is the key fix that prevents
  // the hook from reconnecting every time analysisStatus changes.
  const hackathonIdRef = useRef(hackathonId);
  const tokenRef = useRef(token);
  const onErrorRef = useRef(onError);

  hackathonIdRef.current = hackathonId;
  tokenRef.current = token;
  onErrorRef.current = onError;

  useEffect(() => {
    // Gate: only connect when we have all required values
    if (!enabled || !token || !jobId || jobId === 'null' || jobId === '') {
      return;
    }

    // Abort any pre-existing connection before creating a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const url = `${API_BASE_URL}/hackathons/analysis/stream/${jobId}?token=${encodeURIComponent(token)}`;

    console.log('SSE connection opened for job:', jobId);

    fetchEventSource(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
      },
      signal: controller.signal,
      // Keep the SSE connection alive even when the user switches tabs.
      // Without this, fetchEventSource closes the connection whenever the
      // page becomes "hidden" (Page Visibility API), which drops the stream
      // mid-analysis every time the user looks away.
      openWhenHidden: true,

      onopen: async (response) => {
        if (!response.ok) {
          // Non-2xx: throw so fetchEventSource stops retrying
          throw new Error(`SSE open failed with status ${response.status}`);
        }
        console.log('SSE handshake OK for job:', jobId);
      },

      onmessage: (event) => {
        if (!event.data || event.data.trim() === '') return;

        try {
          const data: SSEEvent = JSON.parse(event.data);

          // Normalize status to uppercase and align with database status strings
          let normalizedStatus = (data.status || '').toUpperCase();
          if (normalizedStatus === 'PROCESSING') {
            normalizedStatus = 'RUNNING';
          } else if (normalizedStatus === 'QUEUED') {
            normalizedStatus = 'PENDING';
          }

          // Update React Query cache with the new status from the stream
          queryClient.setQueryData(
            ['hackathon-analysis', hackathonIdRef.current, tokenRef.current],
            (oldData: any) => {
              if (!oldData) {
                return {
                  success: true,
                  data: {
                    status: normalizedStatus,
                    status_message: data.status_message,
                  }
                };
              }
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  status: normalizedStatus,
                  status_message: data.status_message,
                }
              };
            }
          );

          // When the job finishes, close the stream and fetch full results
          if (data.status === 'completed' || data.status === 'failed' ||
              data.status === 'COMPLETED' || data.status === 'FAILED') {
            console.log('SSE job finished with status:', data.status, '— closing stream.');
            controller.abort();
            queryClient.invalidateQueries({
              queryKey: ['hackathon-analysis', hackathonIdRef.current, tokenRef.current]
            });
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      },

      onerror: (error) => {
        // If the error is an intentional abort, just stop — do NOT reconnect.
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error; // Throw stops fetchEventSource from auto-retrying
        }

        console.error('SSE connection error for job:', jobId, error);
        // For all other errors: throw immediately.
        // We do NOT do manual reconnects here because fetchEventSource's
        // built-in retry logic (based on SSE "retry:" field) handles it
        // cleanly without the stale-closure bug of setTimeout + connect().
        onErrorRef.current?.(error instanceof Error ? error : new Error('SSE connection failed'));
        throw error; // Stop fetchEventSource from retrying
      },

      onclose: () => {
        console.log('SSE connection closed for job:', jobId);
      },
    });

    // Cleanup: abort the stream when jobId/token/enabled changes or component unmounts
    return () => {
      console.log('SSE cleanup for job:', jobId);
      controller.abort();
      abortControllerRef.current = null;
    };

  // CRITICAL: Do NOT include analysisStatus or any derived state here.
  // This effect must only re-run when the connection parameters change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, jobId, token]);

  return {};
}
