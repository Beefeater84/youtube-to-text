import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/libs/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/libs/supabase/server";
import { submitTranscriptJob } from "./submit-job";

interface ExistingRecord {
  id: string;
  language: string;
  status: string;
}

/**
 * Creates a mock Supabase client with chainable query builders.
 * Used by every test to control auth state, existing DB records,
 * and capture insert/update calls for assertions.
 */
function setupMock({
  user = { id: "user-1" },
  existingRecords = [],
  insertError = null,
  updateError = null,
}: {
  user?: { id: string } | null;
  existingRecords?: ExistingRecord[];
  insertError?: { message: string } | null;
  updateError?: { message: string } | null;
} = {}) {
  const mockInsert = vi.fn().mockResolvedValue({ error: insertError });

  const mockUpdateIn = vi.fn().mockResolvedValue({ error: updateError });
  const mockUpdateEq = vi.fn().mockReturnValue({ in: mockUpdateIn });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

  const mockSelectIn = vi.fn().mockResolvedValue({ data: existingRecords });
  const mockSelectEq = vi.fn().mockReturnValue({ in: mockSelectIn });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  });

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: mockFrom,
  };

  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  );

  return {
    client,
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockUpdateEq,
    mockUpdateIn,
  };
}

describe("submitTranscriptJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when user is not authenticated (UC1)", async () => {
    setupMock({ user: null });

    const result = await submitTranscriptJob("abc123", ["en"]);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in.",
    });
  });

  it("inserts records for all languages when video is new (UC2)", async () => {
    const { mockInsert } = setupMock({ existingRecords: [] });

    const result = await submitTranscriptJob("abc123", ["en", "ru"]);

    expect(result).toEqual({ success: true });
    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        youtube_video_id: "abc123",
        language: "en",
        status: "pending",
      }),
      expect.objectContaining({
        youtube_video_id: "abc123",
        language: "ru",
        status: "pending",
      }),
    ]);
  });

  it("updates stale records to pending and inserts missing languages (UC3)", async () => {
    const { mockInsert, mockUpdate, mockUpdateEq, mockUpdateIn } = setupMock({
      existingRecords: [{ id: "rec-1", language: "en", status: "failed" }],
    });

    const result = await submitTranscriptJob("abc123", ["en", "ru"]);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({ status: "pending" });
    expect(mockUpdateEq).toHaveBeenCalledWith("youtube_video_id", "abc123");
    expect(mockUpdateIn).toHaveBeenCalledWith("id", ["rec-1"]);
    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        youtube_video_id: "abc123",
        language: "ru",
        status: "pending",
      }),
    ]);
  });

  it("does not update records with active status (UC3 — done)", async () => {
    const { mockInsert, mockUpdate } = setupMock({
      existingRecords: [{ id: "rec-1", language: "en", status: "done" }],
    });

    const result = await submitTranscriptJob("abc123", ["en", "ru"]);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        youtube_video_id: "abc123",
        language: "ru",
        status: "pending",
      }),
    ]);
  });

  it("returns success when all languages already exist (UC4)", async () => {
    const { mockInsert, mockUpdate } = setupMock({
      existingRecords: [
        { id: "rec-1", language: "en", status: "done" },
        { id: "rec-2", language: "ru", status: "processing" },
      ],
    });

    const result = await submitTranscriptJob("abc123", ["en", "ru"]);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("does not update records with processing or queued status", async () => {
    const { mockUpdate, mockInsert } = setupMock({
      existingRecords: [
        { id: "rec-1", language: "en", status: "processing" },
        { id: "rec-2", language: "ru", status: "queued" },
      ],
    });

    const result = await submitTranscriptJob("abc123", ["en", "ru"]);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when insert fails", async () => {
    setupMock({
      existingRecords: [],
      insertError: { message: "DB write failed" },
    });

    const result = await submitTranscriptJob("abc123", ["en"]);

    expect(result).toEqual({ success: false, error: "DB write failed" });
  });
});
