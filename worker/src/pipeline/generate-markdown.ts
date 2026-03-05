import type { ProcessedSection } from "../types.js";

interface MarkdownInput {
  videoId: string;
  title: string;
  channelName: string;
  duration: number;
  language: string;
  sections: ProcessedSection[];
}

/**
 * Generates a markdown file string from processed sections and metadata.
 * Output follows the spec in docs/transcript-format.md:
 * YAML frontmatter + body with <!-- t:SECONDS --> comments before ## headings.
 * Called after LLM processing, before uploading to storage.
 */
export function generateMarkdown(input: MarkdownInput): string {
  const { videoId, title, channelName, duration, language, sections } = input;

  const frontmatterSections = sections.map((s) => ({
    title: s.title,
    timestamp: s.timestamp,
  }));

  const frontmatter = [
    "---",
    `video_id: "${videoId}"`,
    `title: "${escapeYaml(title)}"`,
    `channel: "${escapeYaml(channelName)}"`,
    `duration: ${duration}`,
    `language: "${language}"`,
    `sections:`,
    ...frontmatterSections.map(
      (s) => `  - title: "${escapeYaml(s.title)}"\n    timestamp: ${s.timestamp}`,
    ),
    "---",
  ].join("\n");

  const body = sections
    .map((s) => `<!-- t:${s.timestamp} -->\n## ${s.title}\n\n${s.content}`)
    .join("\n\n");

  return `${frontmatter}\n\n${body}\n`;
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"');
}
