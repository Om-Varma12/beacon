import { NextResponse } from 'next/server';
import sql, { ensureTableExists } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tableName = await ensureTableExists();

    // Query stats dynamically from the verified table
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
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist statistics' },
      { status: 500 }
    );
  }
}
