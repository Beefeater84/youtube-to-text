export async function fetchMarkdownContent(
  url: string | null,
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}
