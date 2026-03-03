"use client";

import { TimestampBadge } from "@/features/video-player";
import { buildTimestampMap, generateHeadingId } from "@/shared/lib";
import { useMemo, type ComponentPropsWithoutRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  body: string;
  videoId: string;
}

export function MarkdownContent({ body, videoId }: MarkdownContentProps) {
  const timestampMap = useMemo(() => buildTimestampMap(body), [body]);

  const cleanBody = useMemo(
    () => body.replace(/<!--\s*t:\d+\s*-->\n?/g, ""),
    [body],
  );

  return (
    <div id="transcript-content" className="prose-newspaper">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: (props) => (
            <HeadingWithTimestamp
              {...props}
              level={2}
              videoId={videoId}
              timestampMap={timestampMap}
            />
          ),
          h3: (props) => (
            <HeadingWithTimestamp
              {...props}
              level={3}
              videoId={videoId}
              timestampMap={timestampMap}
            />
          ),
        }}
      >
        {cleanBody}
      </Markdown>
    </div>
  );
}

interface HeadingWithTimestampProps extends ComponentPropsWithoutRef<"h2"> {
  level: 2 | 3;
  videoId: string;
  timestampMap: Map<string, number>;
  node?: unknown;
}

function HeadingWithTimestamp({
  level,
  videoId,
  timestampMap,
  children,
  node: _node,
  ...rest
}: HeadingWithTimestampProps) {
  const text = getTextContent(children);
  const id = generateHeadingId(text);
  const timestamp = timestampMap.get(text);
  const Tag = level === 2 ? "h2" : "h3";

  return (
    <Tag id={id} {...rest}>
      {timestamp !== undefined && (
        <TimestampBadge seconds={timestamp} videoId={videoId} />
      )}{" "}
      {children}
    </Tag>
  );
}

function getTextContent(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join("");
  if (
    node !== null &&
    node !== undefined &&
    typeof node === "object" &&
    "props" in node
  ) {
    const el = node as { props: { children?: React.ReactNode } };
    return getTextContent(el.props.children);
  }
  return "";
}
