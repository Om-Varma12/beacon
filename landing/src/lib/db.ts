import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Connection pool helper using postgres package
const sql = postgres(databaseUrl, {
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;

/**
 * Ensures that either the existing "waitlist - applications" table or 
 * a new "applications" table exists, and returns the active table name.
 */
export async function ensureTableExists(): Promise<string> {
  try {
    // 1. Check if "waitlist - applications" exists (defined in db-resources.md)
    const hasWaitlistApp = await sql`
      SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'waitlist - applications'
      );
    `;
    if (hasWaitlistApp[0]?.exists) {
      return 'waitlist - applications';
    }

    // 2. Check if "applications" exists
    const hasApplications = await sql`
      SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'applications'
      );
    `;

    if (!hasApplications[0]?.exists) {
      // Create the applications table as requested
      await sql`
        CREATE TABLE IF NOT EXISTS public.applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email CHARACTER VARYING(255) NOT NULL DEFAULT '',
          feature_request TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
    }
    return 'applications';
  } catch (error) {
    console.error('Error in ensureTableExists:', error);
    // Default fallback to applications
    return 'applications';
  }
}
