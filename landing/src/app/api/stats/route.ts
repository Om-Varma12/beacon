import { NextResponse } from 'next/server';
import sql, { ensureTableExists } from '../../../lib/db';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Optional lightweight API-key guard.
// Set STATS_API_KEY in your .env to a long random string.
// The frontend passes it as the x-stats-key request header.
// If the env var is not set, the key check is skipped (open but rate-limited).
// ---------------------------------------------------------------------------
const STATS_API_KEY = process.env.STATS_API_KEY;

export async function GET(request: Request) {
  // 1. IP-based rate limiting — 30 requests per IP per 60 seconds
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(`stats:${ip}`, 30, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateCheck.resetIn / 1000).toString(),
        },
      }
    );
  }

  // 2. API key guard (if configured)
  if (STATS_API_KEY) {
    const providedKey = request.headers.get('x-stats-key');
    if (providedKey !== STATS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    const tableName = await ensureTableExists();

    const result = await sql`
      SELECT 
        COUNT(*)::integer AS total, 
        COUNT(DISTINCT email)::integer AS unique_count,
        COUNT(CASE WHEN feature_request IS NOT NULL AND TRIM(feature_request) != '' THEN 1 END)::integer AS suggestions_count
      FROM ${sql(tableName)}
    `;

    const total = result[0]?.total ?? 0;
    const unique = result[0]?.unique_count ?? 0;
    const suggestions = result[0]?.suggestions_count ?? 0;

    return NextResponse.json({
      totalApplications: total,
      uniqueApplicants: unique,
      totalSuggestions: suggestions,
    });
  } catch (error) {
    console.error(
      'Error fetching stats:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist statistics' },
      { status: 500 }
    );
  }
}
