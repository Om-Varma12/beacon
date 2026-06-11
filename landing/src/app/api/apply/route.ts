import { NextResponse } from 'next/server';
import sql, { ensureTableExists } from '../../../lib/db';

export const dynamic = 'force-dynamic';

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { email, featureRequest } = body;

    // 1. Validation
    if (!email) {
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


    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFeatureRequest = featureRequest.trim();

    const tableName = await ensureTableExists();

    // 2. Cooldown check (10 seconds)
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
      const cooldownPeriod = 10; // 10 seconds cooldown

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

    // 3. Save submission to the database
    await sql`
      INSERT INTO ${sql(tableName)} (email, feature_request) 
      VALUES (${sanitizedEmail}, ${sanitizedFeatureRequest})
    `;

    // 4. Removed email confirmation as requested

    // 5. Query updated stats
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
    console.error('Error handling apply POST request:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
