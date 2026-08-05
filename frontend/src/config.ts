/**
 * Central API configuration.
 *
 * All backend calls MUST import API_BASE_URL from this file.
 * To change the backend target, set VITE_API_BASE_URL in your .env file:
 *
 *   VITE_API_BASE_URL=https://api.yourapp.com
 *
 * Do NOT hard-code any backend URLs anywhere in the codebase.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
