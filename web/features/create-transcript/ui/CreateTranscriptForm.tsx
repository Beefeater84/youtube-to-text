"use client";

import { useState } from "react";
import { submitTranscriptJob } from "../api/submit-job";
import { LanguageSelect } from "./LanguageSelect";

interface CreateTranscriptFormProps {
  preferredLanguages?: string[];
}

/**
 * Form for submitting a YouTube URL for transcription.
 * Calls the submitTranscriptJob server action to validate the URL,
 * fetch metadata, and create a transcript record.
 * Used on the /dashboard page, available only to authenticated users.
 */
export function CreateTranscriptForm({
  preferredLanguages = ["en"],
}: CreateTranscriptFormProps) {
  const [url, setUrl] = useState("");
  const [languages, setLanguages] = useState<string[]>(preferredLanguages);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
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

    const submittedLanguages = languages.includes("en")
      ? languages
      : ["en", ...languages];

    const result = await submitTranscriptJob(videoId, submittedLanguages);

    if (!result.success) {
      setErrorMessage(result.error ?? "Something went wrong.");
      setStatus("error");
      return;
    }

    setUrl("");
    setStatus("success");
    setTimeout(() => setStatus("idle"), 3000);
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
