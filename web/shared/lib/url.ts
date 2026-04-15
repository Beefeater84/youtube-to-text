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

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[getBaseUrl] NEXT_PUBLIC_SITE_URL is missing in production! Falling back to localhost."
    );
  }

  return "http://localhost:3000";
}
