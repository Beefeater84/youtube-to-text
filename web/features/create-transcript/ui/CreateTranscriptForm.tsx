"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { LanguageSelect } from "./LanguageSelect";

interface CreateTranscriptFormProps {
  preferredLanguages?: string[];
}

/**
 * Form for submitting a YouTube URL for transcription.
 * Creates a transcript record in the database with status "queued".
 * Used on the /dashboard page, available only to authenticated users.
 */
export function CreateTranscriptForm({
  preferredLanguages = ["en"],
}: CreateTranscriptFormProps) {
  const [url, setUrl] = useState("");
  const [languages, setLanguages] = useState<string[]>(preferredLanguages);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const extractVideoId = (input: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      setErrorMessage("Please enter a valid YouTube URL or video ID.");
      setStatus("error");
      return;
    }

    setStatus("submitting");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("You must be signed in.");
        setStatus("error");
        return;
      }

      const slug = `${videoId}-${Date.now()}`;

      const { error } = await supabase.from("transcripts").insert({
        youtube_video_id: videoId,
        title: `Processing: ${videoId}`,
        slug,
        status: "queued",
        language: "en",
        user_id: user.id,
        channel_id: null,
      });

      if (error) {
        setErrorMessage(error.message);
        setStatus("error");
        return;
      }

      setUrl("");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative border-3 border-ink bg-surface px-6 py-6"
    >
      <div className="mb-1 inline-block border border-ink bg-ink px-2 py-0.5 font-label text-[0.6rem] uppercase tracking-[0.15em] text-paper">
        New Transcript
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="youtube-url"
            className="mb-2 block font-label text-[0.7rem] uppercase tracking-[0.1em] text-ink-muted"
          >
            YouTube URL
          </label>
          <input
            id="youtube-url"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full border-2 border-ink bg-paper px-4 py-2.5 font-label text-[0.85rem] outline-none placeholder:text-ink-ghost focus:shadow-[2px_2px_0_#0a0a0a]"
            required
          />
        </div>

        <LanguageSelect selected={languages} onChange={setLanguages} />

        {status === "error" && errorMessage && (
          <p className="font-label text-[0.75rem] text-ink-muted">
            {errorMessage}
          </p>
        )}

        {status === "success" && (
          <p className="font-label text-[0.75rem] text-ink-muted">
            Transcript queued for processing.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="cursor-pointer border-2 border-ink bg-ink px-6 py-2.5 font-body text-[0.85rem] font-bold text-paper transition-[background-color,color] duration-150 hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" ? "Submitting…" : "Transcribe"}
        </button>
      </div>
    </form>
  );
}
