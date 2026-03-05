import type { TranscriptJob, PipelineResult } from "../types.js";
import { getSupabase } from "../db.js";
import { fetchRawTranscript } from "./fetch-transcript.js";
import { processWithLlm } from "./process-with-llm.js";
import { generateMarkdown } from "./generate-markdown.js";
import { uploadToStorage } from "./upload-to-storage.js";

/**
 * Resolves the channel name for the transcript job.
 * Falls back to "Unknown" if the channel is not linked.
 */
async function resolveChannelName(channelId: string | null): Promise<string> {
  if (!channelId) return "Unknown";
  const { data } = await getSupabase()
    .from("channels")
    .select("title")
    .eq("id", channelId)
    .single();
  return data?.title ?? "Unknown";
}

/**
 * Orchestrates the full transcript processing pipeline:
 * fetch captions -> LLM cleanup/structuring -> markdown generation -> upload.
 * Called by the main polling loop for each pending job.
 */
export async function runPipeline(job: TranscriptJob): Promise<PipelineResult> {
  console.log(`[pipeline] step 1/4: fetching transcript for ${job.youtube_video_id}`);
  const rawSegments = await fetchRawTranscript(job.youtube_video_id);

  console.log(`[pipeline] step 2/4: processing with LLM (${rawSegments.length} segments)`);
  const sections = await processWithLlm(rawSegments);

  const lastSegment = rawSegments[rawSegments.length - 1];
  const durationSeconds = Math.ceil(lastSegment.offset + lastSegment.duration);

  const channelName = await resolveChannelName(job.channel_id);

  console.log(`[pipeline] step 3/4: generating markdown (${sections.length} sections)`);
  const markdown = generateMarkdown({
    videoId: job.youtube_video_id,
    title: job.title,
    channelName,
    duration: durationSeconds,
    language: job.language,
    sections,
  });

  console.log(`[pipeline] step 4/4: uploading to storage`);
  const markdownUrl = await uploadToStorage(
    job.youtube_video_id,
    job.language,
    markdown,
  );

  return { markdownUrl, durationSeconds };
}
