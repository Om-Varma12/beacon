import type { NextConfig } from 'next';

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for its runtime scripts; unsafe-eval for dev HMR
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Tailwind & component inline styles
  "style-src 'self' 'unsafe-inline'",
  // Local fonts
  "font-src 'self'",
  // Local images, data URIs, blob (Next.js Image Optimization)
  "img-src 'self' data: blob:",
  // Only talk to same origin (API routes)
  "connect-src 'self'",
  // Block this page from being embedded in iframes anywhere
  "frame-ancestors 'none'",
  // No plugins (Flash, etc.)
  "object-src 'none'",
  // Restrict base tag
  "base-uri 'self'",
  // Only allow form submissions to same origin
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Block page from being rendered inside an iframe (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Legacy XSS filter for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Force HTTPS for 2 years, include subdomains, allow preload list
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Only send full referrer for same-origin; send only origin for cross-origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable sensitive browser features not needed by this app
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Full Content Security Policy
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Apply to every route
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
