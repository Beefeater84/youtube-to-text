import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createAdminClient } from "@/libs/supabase/admin";

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("video_id");
  if (!videoId) {
    return NextResponse.json({ error: "video_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: jobs, error } = await admin
    .from("transcripts")
    .select("id, status, youtube_video_id, created_at")
    .eq("youtube_video_id", videoId)
    .eq("user_id", user.id)
    .in("status", ["awaiting_browser_fetch", "queued", "pending"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: jobs ?? [] });
}
