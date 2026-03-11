import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { CreateTranscriptForm } from "./CreateTranscriptForm";

vi.mock("../api/submit-job", () => ({
  submitTranscriptJob: vi.fn().mockResolvedValue({ success: true }),
}));

import { submitTranscriptJob } from "../api/submit-job";

const VALID_VIDEO_URL = "https://youtube.com/watch?v=dQw4w9WgXcQ";

describe("CreateTranscriptForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  /**
   * Use case 1:
   * Client selects a video, selects English.
   * Expected: submitTranscriptJob called with languages ["en"].
   */
  it("submits with language en when only English is selected", async () => {
    const user = userEvent.setup();
    render(<CreateTranscriptForm />);

    const input = screen.getByPlaceholderText(/youtube\.com/i);
    await user.type(input, VALID_VIDEO_URL);

    const submitBtn = screen.getByRole("button", { name: /transcribe/i });
    await user.click(submitBtn);

    expect(submitTranscriptJob).toHaveBeenCalledWith(
      "dQw4w9WgXcQ",
      expect.arrayContaining(["en"]),
    );
    expect(
      (submitTranscriptJob as Mock).mock.calls[0][1],
    ).toHaveLength(1);
  });

  /**
   * Use case 2:
   * Client selects a video, selects Russian.
   * Expected: submitTranscriptJob called with languages containing both "ru" AND "en".
   */
  it("submits with both en and ru when Russian is selected", async () => {
    const user = userEvent.setup();
    render(<CreateTranscriptForm />);

    const input = screen.getByPlaceholderText(/youtube\.com/i);
    await user.type(input, VALID_VIDEO_URL);

    const ruButton = screen.getByRole("button", { name: "Русский" });
    await user.click(ruButton);

    const submitBtn = screen.getByRole("button", { name: /transcribe/i });
    await user.click(submitBtn);

    const calledLanguages = (submitTranscriptJob as Mock).mock.calls[0][1] as string[];
    expect(calledLanguages).toContain("en");
    expect(calledLanguages).toContain("ru");
    expect(calledLanguages).toHaveLength(2);
  });
});
