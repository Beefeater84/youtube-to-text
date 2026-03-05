import OpenAI from "openai";
import { config } from "../config.js";
import type { ProcessedSection } from "../types.js";
import type { RawSegment } from "./fetch-transcript.js";

const SYSTEM_PROMPT = `You are a transcript editor. You receive raw YouTube caption segments with timestamps.

Your task:
1. Clean up the text: fix grammar, remove filler words ("um", "uh", "like", "you know"), merge broken sentences.
2. Group the segments into 4-12 logical sections based on topic shifts.
3. For each section, write a clean, descriptive heading (no timestamps or brackets in the heading).
4. The timestamp for each section is the offset (in seconds) of the first segment in that section.
5. Preserve the original meaning — do not add, invent, or editorialize content.

Return a JSON object with this exact structure:
{
  "sections": [
    {
      "title": "Section Heading",
      "timestamp": 0,
      "content": "Cleaned paragraph text for this section..."
    }
  ]
}

Rules:
- Sections must be in chronological order (timestamps ascending).
- Each section should have at least 2-3 sentences of content.
- Do not include timestamps in headings or content text.
- Output ONLY the JSON object, no markdown fences or extra text.`;

/**
 * Sends raw transcript segments to OpenAI GPT-4o-mini for cleanup and structuring.
 * Returns an array of processed sections with titles, timestamps, and clean content.
 * Uses JSON mode for reliable structured output.
 */
export async function processWithLlm(
  segments: RawSegment[],
): Promise<ProcessedSection[]> {
  const openai = new OpenAI({ apiKey: config.openaiApiKey });

  const segmentText = segments
    .map((s) => `[${Math.round(s.offset)}s] ${s.text}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: segmentText },
    ],
    temperature: 0.3,
    max_tokens: 16000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(content) as { sections: ProcessedSection[] };

  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error("LLM returned no sections");
  }

  return parsed.sections;
}
