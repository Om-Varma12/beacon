import { useEffect, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

interface SSEEvent {
  status: string;
  status_message: string;
  timestamp?: number;
}

interface UseAnalysisSSEOptions {
  hackathonId: string | number;
  token: string | null;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useAnalysisSSE({
  hackathonId,
  token,
  enabled = true,
  onError
}: UseAnalysisSSEOptions) {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!enabled || !token || !hackathonId) {
      return;
    }

    // Abort any existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const url = `${API_BASE_URL}/hackathons/${hackathonId}/analysis/stream?token=${encodeURIComponent(token)}`;

    fetchEventSource(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
      },
      signal: abortControllerRef.current.signal,

      onopen: async () => {
        reconnectAttemptsRef.current = 0;
        console.log('SSE connection opened for hackathon:', hackathonId);
      },

      onmessage: (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          
          // Update React Query cache with new status
          queryClient.setQueryData(
            ['hackathon-analysis', hackathonId, token],
            (oldData: any) => {
              if (!oldData) {
                return {
                  success: true,
                  data: {
                    status: data.status,
                    status_message: data.status_message,
                  }
                };
              }
              
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  status: data.status,
                  status_message: data.status_message,
                }
              };
            }
          );

          // If analysis is completed or failed, close the connection
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            abortControllerRef.current?.abort();
            // Invalidate to fetch full results
            queryClient.invalidateQueries({ 
              queryKey: ['hackathon-analysis', hackathonId, token] 
            });
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      },

      onerror: (error) => {
        console.error('SSE connection error:', error);
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          setTimeout(() => {
            connect();
          }, delay);
          
          // Return to keep connection alive for retry
          return;
        }
        
        // Max retries reached, fall back to polling
        console.error('Max reconnection attempts reached, falling back to polling');
        onError?.(error instanceof Error ? error : new Error('SSE connection failed'));
        
        // Throw to close connection
        throw error;
      },

      onclose: () => {
        console.log('SSE connection closed for hackathon:', hackathonId);
      },
    });
  }, [enabled, token, hackathonId, queryClient, onError]);

  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled && token && hackathonId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, token, hackathonId, connect, disconnect]);

  return { connect, disconnect };
}
