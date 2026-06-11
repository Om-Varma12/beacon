import { NextResponse } from 'next/server';
import sql, { ensureTableExists } from '../../../lib/db';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Allowed origins for CSRF protection.
// In production, set ALLOWED_ORIGIN to your deployment URL (e.g. https://beacon.dev).
// Multiple origins can be comma-separated: "https://beacon.dev,https://www.beacon.dev"
// In development, localhost variants are allowed automatically.
// ---------------------------------------------------------------------------
const rawAllowedOrigins = process.env.ALLOWED_ORIGIN ?? '';
const ALLOWED_ORIGINS: string[] = rawAllowedOrigins
  ? rawAllowedOrigins.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001'];

/** RFC 5321 compliant email length + basic format check */
const validateEmail = (email: string): boolean => {
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export async function POST(request: Request) {
  // 1. CSRF — Origin header check
  //    Browsers always send Origin on cross-site POST requests.
  //    Legitimate same-origin requests will match; malicious cross-site
  //    requests will have a different Origin or none at all.
  const origin = request.headers.get('origin') ?? '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { success: false, message: 'Forbidden' },
      { status: 403 }
    );
  }

  // 2. IP-based rate limiting — max 5 submissions per IP per 60 seconds
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(`apply:${ip}`, 5, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateCheck.resetIn / 1000).toString(),
        },
      }
    );
  }

  try {
    // 3. Parse JSON body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { email, featureRequest } = body;

    // 4. Input validation — email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // 4b. Input validation — featureRequest (optional field, safe default)
    //     This fixes the crash when featureRequest is undefined.
    const rawFeatureRequest =
      featureRequest !== undefined && featureRequest !== null
        ? featureRequest
        : '';

    if (typeof rawFeatureRequest !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Feature request must be a string' },
        { status: 400 }
      );
    }

    if (rawFeatureRequest.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Feature request is too long (max 2000 characters)',
        },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFeatureRequest = rawFeatureRequest.trim();

    const tableName = await ensureTableExists();

    // 5. Per-email cooldown check (10 seconds — server-enforced)
    const lastSubmission = await sql`
      SELECT created_at 
      FROM ${sql(tableName)} 
      WHERE LOWER(email) = ${sanitizedEmail} 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (lastSubmission.length > 0) {
      const lastCreatedAt = new Date(lastSubmission[0].created_at).getTime();
      const now = Date.now();
      const elapsedSeconds = (now - lastCreatedAt) / 1000;
      const cooldownPeriod = 10;

      if (elapsedSeconds < cooldownPeriod) {
        const remainingSeconds = Math.ceil(cooldownPeriod - elapsedSeconds);
        return NextResponse.json(
          {
            success: false,
            message: 'Please wait before submitting again',
            remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    // 6. Persist to database
    await sql`
      INSERT INTO ${sql(tableName)} (email, feature_request) 
      VALUES (${sanitizedEmail}, ${sanitizedFeatureRequest})
    `;

    // 7. Return updated aggregate stats
    const statsResult = await sql`
      SELECT 
        COUNT(*)::integer AS total, 
        COUNT(DISTINCT email)::integer AS unique_count,
        COUNT(CASE WHEN feature_request IS NOT NULL AND TRIM(feature_request) != '' THEN 1 END)::integer AS suggestions_count
      FROM ${sql(tableName)}
    `;

    const total = statsResult[0]?.total ?? 0;
    const unique = statsResult[0]?.unique_count ?? 0;
    const suggestions = statsResult[0]?.suggestions_count ?? 0;

    return NextResponse.json({
      success: true,
      totalApplications: total,
      uniqueApplicants: unique,
      totalSuggestions: suggestions,
    });
  } catch (error) {
    // Log only the message — never log the full error object which may contain
    // DB connection strings or stack traces with internal file paths.
    console.error(
      'Error handling apply POST request:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
