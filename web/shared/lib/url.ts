/**
 * Returns the base URL of the site.
 * Prefers NEXT_PUBLIC_SITE_URL environment variable, falls back to localhost in development.
 */
export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  return "http://localhost:3000";
}
