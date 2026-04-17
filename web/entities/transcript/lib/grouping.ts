import type { VideoGroup, LanguageVersion } from "../model/types";

/**
 * Shared logic to group raw transcript rows into VideoGroup objects.
 * Prioritizes English versions for the primary title and slug.
 */
export function groupTranscriptsToVideos(rows: any[]): VideoGroup[] {
  const groupMap = new Map<string, VideoGroup>();

  for (const row of rows) {
    const langVersion: LanguageVersion = {
      language: row.language,
      slug: row.slug,
      markdown_url: row.markdown_url,
    };
    const existing = groupMap.get(row.youtube_video_id);
    if (existing) {
      if (!existing.languages.some((l) => l.language === row.language)) {
        existing.languages.push(langVersion);
      }
      // If we found an English version, prioritize its title and slug for the group
      if (row.language === "en") {
        existing.title = row.title;
        existing.slug = row.slug;
      }
    } else {
      const raw = row.channels;
      const ch = (Array.isArray(raw) ? raw[0] : raw) as
        | { title: string; slug: string }
        | null
        | undefined;
      groupMap.set(row.youtube_video_id, {
        youtube_video_id: row.youtube_video_id,
        title: row.title,
        slug: row.slug,
        thumbnail_url: row.thumbnail_url,
        channel_title: ch?.title ?? null,
        channel_slug: ch?.slug ?? null,
        languages: [langVersion],
        duration_seconds: row.duration_seconds,
        created_at: row.created_at,
      });
    }
  }

  return Array.from(groupMap.values()).map((g) => ({
    ...g,
    languages: g.languages.sort((a, b) =>
      a.language === "en" ? -1 : b.language === "en" ? 1 : 0
    ),
  }));
}
