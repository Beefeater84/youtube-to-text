import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createAdminClient } from "@/libs/supabase/admin";

interface RawSegment {
  text: string;
  offset: number;
  duration: number;
}

interface VideoMetadata {
  title: string;
  channel_name: string;
  channel_id: string;
  duration: number;
  thumbnail_url: string;
  description: string;
}

interface SubmitFetchBody {
  job_id?: string;
  video_id: string;
  target_language: string;
  source_language: string;
  metadata: VideoMetadata;
  segments: RawSegment[];
}

function isValidBody(b: unknown): b is SubmitFetchBody {
  if (!b || typeof b !== "object") return false;
  const obj = b as Record<string, unknown>;
  if (typeof obj.video_id !== "string" || !obj.video_id) return false;
  if (typeof obj.target_language !== "string" || !obj.target_language) return false;
  if (typeof obj.source_language !== "string" || !obj.source_language) return false;
  if (!obj.metadata || typeof obj.metadata !== "object") return false;
  if (!Array.isArray(obj.segments)) return false;
  if (obj.job_id !== undefined && typeof obj.job_id !== "string") return false;
  return true;
}

const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  let rawText: string;
  try {
    rawText = await req.text();
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    body = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { job_id, video_id, target_language, source_language, metadata, segments } = body;
  const admin = createAdminClient();

  let resolvedJobId: string;

  if (job_id) {
    const { data: row, error } = await admin
      .from("transcripts")
      .select("id, user_id, status")
      .eq("id", job_id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (row.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (row.status !== "awaiting_browser_fetch") {
      return NextResponse.json({ error: "Job is not awaiting browser fetch" }, { status: 409 });
    }
    resolvedJobId = job_id;
  } else {
    const slug = target_language === "en" ? video_id : `${video_id}-${target_language}`;
    const { data: row, error } = await admin
      .from("transcripts")
      .insert({
        youtube_video_id: video_id,
        title: video_id,
        slug,
        status: "awaiting_browser_fetch",
        language: target_language,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error || !row) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
    }
    resolvedJobId = row.id;
  }

  const payload = JSON.stringify({ video_id, target_language, source_language, metadata, segments });
  const storagePath = `${video_id}/${target_language}.json`;

  const { error: uploadError } = await admin.storage
    .from("fetch-payloads")
    .upload(storagePath, payload, {
      contentType: "application/json",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("transcripts")
    .update({ status: "queued", fetch_payload_path: storagePath })
    .eq("id", resolvedJobId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ job_id: resolvedJobId, status: "queued" });
}
