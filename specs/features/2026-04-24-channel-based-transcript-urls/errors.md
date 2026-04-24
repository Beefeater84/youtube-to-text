# TypeScript Errors — Channel-Based Transcript URLs

## Error 1 — `app/dashboard/page.tsx:70`

```
Type 'Transcript[]' is not assignable to type 'TranscriptDashboardItem[]'.
Property 'channel_slug' is missing in type 'Transcript' but required in type 'TranscriptDashboardItem'.
```

**Причина:** `DashboardJobList` ожидает `TranscriptDashboardItem[]` (с полем `channel_slug`), но `getUserTranscripts` возвращает `Transcript[]`, где этого поля нет. Приведение через `as Transcript[]` проблему не решает — типы несовместимы.

**Файл:** `web/app/dashboard/page.tsx`, строка 70:
```ts
<DashboardJobList transcripts={(transcripts as Transcript[]) ?? []} />
```

---

## Error 2 — `entities/transcript/api/get-transcript.ts:48,50`

```
Conversion of type '{ slug: any; }[]' to type '{ slug: string; }' may be a mistake
because neither type sufficiently overlaps with the other.
Property 'slug' is missing in type '{ slug: any; }[]' but required in type '{ slug: string; }'.
```

**Причина:** `supabase.select("slug, channels(slug)")` возвращает `row.channels` как массив `{ slug: any }[]` (join возвращает массив), а код приводит его к одному объекту `{ slug: string }`. Нужно обращаться к первому элементу массива или использовать `.single()` / скорректировать тип.

**Файл:** `web/entities/transcript/api/get-transcript.ts`, строки 48–50:
```ts
.filter((row) => row.channels && (row.channels as { slug: string }).slug)
.map((row) => ({
  channelSlug: (row.channels as { slug: string }).slug,
```
