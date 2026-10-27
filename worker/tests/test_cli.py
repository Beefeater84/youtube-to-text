"""Worker CLI (#33): create a transcript without the frontend."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, call, patch

import pytest

from src import cli, db
from src.models import DependencyPending, PipelineResult

VID = "dQw4w9WgXcQ"
MD_URL = "http://localhost:56121/storage/v1/object/public/transcripts/dQ/dQw4w9WgXcQ/en.md"


def _row(**overrides: object) -> dict:
    """A transcripts row as returned by select('*')."""
    row = {
        "id": "job-en",
        "channel_id": None,
        "youtube_video_id": VID,
        "title": VID,
        "description": None,
        "thumbnail_url": None,
        "slug": VID,
        "language": "en",
        "duration_seconds": None,
        "markdown_url": None,
        "status": "pending",
        "user_id": None,
        "published_at": None,
        "retry_count": 0,
        "error_message": None,
        "started_at": None,
        "created_at": "2026-10-27T10:00:00Z",
        "updated_at": "2026-10-27T10:00:00Z",
    }
    row.update(overrides)
    return row


# ---------------------------------------------------------------- URL parsing


@pytest.mark.parametrize(
    "raw",
    [
        f"https://www.youtube.com/watch?v={VID}",
        f"https://youtube.com/watch?v={VID}&t=42s",
        f"https://youtu.be/{VID}",
        f"https://youtu.be/{VID}?si=abc",
        f"https://www.youtube.com/embed/{VID}",
        f"https://www.youtube.com/shorts/{VID}",
        VID,
        f"  {VID}\n",
    ],
)
def test_extract_video_id_accepts_supported_forms(raw: str) -> None:
    assert cli.extract_video_id(raw) == VID


@pytest.mark.parametrize(
    "raw",
    ["", "not a url", "dQw4w9WgXc", "dQw4w9WgXcQQ", "https://vimeo.com/123456789", "https://youtube.com/watch?v=short"],
)
def test_extract_video_id_rejects_invalid(raw: str) -> None:
    assert cli.extract_video_id(raw) is None


def test_invalid_input_exits_2_without_db_calls() -> None:
    with patch("src.cli.find_transcript") as find:
        assert cli.run(["https://vimeo.com/1"]) == 2
        assert cli.run([VID, "--lang", "english"]) == 2
    find.assert_not_called()


# ---------------------------------------------------------------- db.submit_jobs


@pytest.fixture
def sb() -> MagicMock:
    """Mocked Supabase client returned by db.get_supabase."""
    client = MagicMock()
    with patch("src.db.get_supabase", return_value=client):
        yield client


def _select_returns(sb: MagicMock, rows: list[dict]) -> None:
    table = sb.table.return_value
    table.select.return_value.eq.return_value.in_.return_value.execute.return_value.data = rows


def test_submit_jobs_inserts_missing_languages(sb: MagicMock) -> None:
    _select_returns(sb, [])

    db.submit_jobs(VID, ["en", "ru"])

    table = sb.table.return_value
    table.update.assert_not_called()
    table.insert.assert_called_once_with([
        {"youtube_video_id": VID, "title": VID, "slug": VID, "status": "pending",
         "language": "en", "user_id": None},
        {"youtube_video_id": VID, "title": VID, "slug": f"{VID}-ru", "status": "pending",
         "language": "ru", "user_id": None},
    ])


def test_submit_jobs_requeues_failed_and_pending_only(sb: MagicMock) -> None:
    _select_returns(sb, [
        {"id": "job-en", "language": "en", "status": "failed"},
        {"id": "job-ru", "language": "ru", "status": "waiting_dependency"},
        {"id": "job-de", "language": "de", "status": "pending"},
        {"id": "job-fr", "language": "fr", "status": "processing"},
    ])

    db.submit_jobs(VID, ["en", "ru", "de", "fr"])

    table = sb.table.return_value
    table.update.assert_called_once_with({"status": "pending"})
    table.update.return_value.eq.return_value.in_.assert_called_once_with("id", ["job-en", "job-de"])
    table.insert.assert_not_called()


def test_submit_jobs_reuses_existing_and_inserts_rest(sb: MagicMock) -> None:
    _select_returns(sb, [{"id": "job-en", "language": "en", "status": "done"}])

    db.submit_jobs(VID, ["en", "es"])

    table = sb.table.return_value
    table.update.assert_not_called()
    inserted = table.insert.call_args.args[0]
    assert [r["language"] for r in inserted] == ["es"]


def test_claim_job_returns_job_when_pending(sb: MagicMock) -> None:
    query = sb.table.return_value.update.return_value.eq.return_value.eq.return_value
    query.execute.return_value.data = [_row(status="processing")]

    job = db.claim_job("job-en")

    assert job is not None and job.id == "job-en" and job.status == "processing"
    update_payload = sb.table.return_value.update.call_args.args[0]
    assert update_payload["status"] == "processing" and update_payload["started_at"]
    sb.table.return_value.update.return_value.eq.assert_called_once_with("id", "job-en")
    sb.table.return_value.update.return_value.eq.return_value.eq.assert_called_once_with(
        "status", "pending"
    )


def test_claim_job_returns_none_when_not_claimed(sb: MagicMock) -> None:
    query = sb.table.return_value.update.return_value.eq.return_value.eq.return_value
    query.execute.return_value.data = []

    assert db.claim_job("job-en") is None


# ---------------------------------------------------------------- ensure_jobs


def test_ensure_jobs_done_shortcut_makes_no_writes() -> None:
    done = _row(status="done", markdown_url=MD_URL)
    with (
        patch("src.cli.find_transcript", return_value=done),
        patch("src.cli.submit_jobs") as submit,
    ):
        assert cli.ensure_jobs(VID, "en") is done
    submit.assert_not_called()


def test_ensure_jobs_submits_en_with_target_language() -> None:
    target = _row(id="job-ru", language="ru")
    with (
        patch("src.cli.find_transcript", side_effect=[None, target]),
        patch("src.cli.submit_jobs") as submit,
    ):
        assert cli.ensure_jobs(VID, "ru") is target
    submit.assert_called_once_with(VID, ["en", "ru"])


def test_ensure_jobs_en_only_submits_en() -> None:
    target = _row()
    with (
        patch("src.cli.find_transcript", side_effect=[_row(status="failed"), target]),
        patch("src.cli.submit_jobs") as submit,
    ):
        cli.ensure_jobs(VID, "en")
    submit.assert_called_once_with(VID, ["en"])


def test_done_shortcut_prints_url_and_exits_0(capsys: pytest.CaptureFixture[str]) -> None:
    with (
        patch("src.cli.find_transcript", return_value=_row(status="done", markdown_url=MD_URL)),
        patch("src.cli.submit_jobs") as submit,
        patch("src.cli.get_transcript") as get,
    ):
        assert cli.run([VID]) == 0
    submit.assert_not_called()
    get.assert_not_called()
    assert capsys.readouterr().out.strip() == MD_URL


# ---------------------------------------------------------------- wait mode


class _FakeClock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now

    def sleep(self, seconds: float) -> None:
        self.now += seconds


def test_wait_logs_transitions_until_done(caplog: pytest.LogCaptureFixture) -> None:
    rows = [
        _row(status="pending"),
        _row(status="pending"),
        _row(status="processing"),
        _row(status="done", markdown_url=MD_URL),
    ]
    clock = _FakeClock()
    with patch("src.cli.get_transcript", side_effect=rows), caplog.at_level("INFO", "src.cli"):
        row = cli.wait_for_job("job-en", 60, 5, clock=clock, sleep=clock.sleep)

    assert row["status"] == "done"
    statuses = [r.getMessage().split(": ")[-1] for r in caplog.records]
    assert statuses == ["pending", "processing", "done"]
    assert clock.now == 15


def test_wait_times_out_with_exit_2() -> None:
    clock = _FakeClock()
    with patch("src.cli.get_transcript", return_value=_row(status="pending")):
        with pytest.raises(cli.CliError) as exc_info:
            cli.wait_for_job("job-en", 12, 5, clock=clock, sleep=clock.sleep)
    assert exc_info.value.exit_code == 2
    assert clock.now == 12


def test_wait_mode_timeout_exits_2() -> None:
    with (
        patch("src.cli.find_transcript", return_value=_row()),
        patch("src.cli.submit_jobs"),
        patch("src.cli.get_transcript", return_value=_row(status="processing")),
        patch("src.cli.time.sleep"),
    ):
        assert cli.run([VID, "--timeout", "0"]) == 2


def test_wait_mode_failed_exits_1_with_error_text(caplog: pytest.LogCaptureFixture) -> None:
    failed = _row(status="failed", error_message="No subtitles found")
    with (
        patch("src.cli.find_transcript", return_value=_row()),
        patch("src.cli.submit_jobs"),
        patch("src.cli.get_transcript", return_value=failed),
    ):
        assert cli.run([VID]) == 1
    assert "No subtitles found" in caplog.text


def test_wait_mode_done_writes_out_file(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    out = tmp_path / "t.md"
    with (
        patch("src.cli.find_transcript", return_value=_row()),
        patch("src.cli.submit_jobs"),
        patch("src.cli.get_transcript", return_value=_row(status="done", markdown_url=MD_URL)),
        patch("src.cli.download_markdown_from_storage", return_value="# hi\n") as download,
    ):
        assert cli.run([VID, "--out", str(out)]) == 0
    download.assert_called_once_with(MD_URL)
    assert out.read_text(encoding="utf-8") == "# hi\n"
    assert capsys.readouterr().out == ""


def test_relative_markdown_url_is_prefixed() -> None:
    assert cli.absolute_markdown_url("/storage/v1/x.md") == "http://localhost:56121/storage/v1/x.md"
    assert cli.absolute_markdown_url(MD_URL) == MD_URL


# ---------------------------------------------------------------- inline mode


def test_inline_en_claims_runs_and_marks_done(make_job, capsys: pytest.CaptureFixture[str]) -> None:
    job = make_job(id="job-en", youtube_video_id=VID, user_id=None)
    with (
        patch("src.cli.find_transcript", return_value=_row()),
        patch("src.cli.submit_jobs"),
        patch("src.cli.claim_job", return_value=job) as claim,
        patch("src.cli.run_pipeline", return_value=PipelineResult(MD_URL, 300)) as run_p,
        patch("src.cli.mark_job_done") as done,
        patch("src.cli.mark_job_failed") as failed,
    ):
        assert cli.run([VID, "--inline"]) == 0

    claim.assert_called_once_with("job-en")
    run_p.assert_called_once_with(job)
    done.assert_called_once_with("job-en", MD_URL, 300, video_id=VID)
    failed.assert_not_called()
    assert capsys.readouterr().out.strip() == MD_URL


def test_inline_non_en_runs_en_first_then_target(make_job) -> None:
    target = _row(id="job-ru", language="ru", slug=f"{VID}-ru")
    en_job = make_job(id="job-en", youtube_video_id=VID, language="en")
    ru_job = make_job(id="job-ru", youtube_video_id=VID, language="ru")
    ru_url = MD_URL.replace("en.md", "ru.md")
    with (
        patch("src.cli.find_transcript", side_effect=[None, target, _row()]),
        patch("src.cli.submit_jobs") as submit,
        patch("src.cli.claim_job", side_effect=[en_job, ru_job]) as claim,
        patch(
            "src.cli.run_pipeline",
            side_effect=[PipelineResult(MD_URL, 300), PipelineResult(ru_url, 300)],
        ) as run_p,
        patch("src.cli.mark_job_done") as done,
    ):
        assert cli.run([VID, "--lang", "ru", "--inline"]) == 0

    submit.assert_called_once_with(VID, ["en", "ru"])
    assert claim.call_args_list == [call("job-en"), call("job-ru")]
    assert run_p.call_args_list == [call(en_job), call(ru_job)]
    assert done.call_args_list == [
        call("job-en", MD_URL, 300, video_id=VID),
        call("job-ru", ru_url, 300, video_id=VID),
    ]


def test_inline_non_en_skips_en_when_done(make_job) -> None:
    target = _row(id="job-ru", language="ru")
    ru_job = make_job(id="job-ru", youtube_video_id=VID, language="ru")
    with (
        patch(
            "src.cli.find_transcript",
            side_effect=[target, target, _row(status="done", markdown_url=MD_URL)],
        ),
        patch("src.cli.submit_jobs"),
        patch("src.cli.claim_job", return_value=ru_job) as claim,
        patch("src.cli.run_pipeline", return_value=PipelineResult(MD_URL, 1)),
        patch("src.cli.mark_job_done"),
    ):
        assert cli.run([VID, "--lang", "ru", "--inline"]) == 0
    claim.assert_called_once_with("job-ru")


def test_inline_failure_marks_failed_and_exits_1(make_job, caplog: pytest.LogCaptureFixture) -> None:
    job = make_job(id="job-en", youtube_video_id=VID)
    with (
        patch("src.cli.find_transcript", return_value=_row()),
        patch("src.cli.submit_jobs"),
        patch("src.cli.claim_job", return_value=job),
        patch("src.cli.run_pipeline", side_effect=RuntimeError("No subtitles found")),
        patch("src.cli.mark_job_done") as done,
        patch("src.cli.mark_job_failed") as failed,
    ):
        assert cli.run([VID, "--inline"]) == 1
    failed.assert_called_once_with("job-en", "No subtitles found")
    done.assert_not_called()
    assert "No subtitles found" in caplog.text


def test_inline_empty_error_uses_fallback_message(make_job) -> None:
    job = make_job(id="job-en", youtube_video_id=VID)
    with (
        patch("src.cli.find_transcript", return_value=_row()),
        patch("src.cli.submit_jobs"),
        patch("src.cli.claim_job", return_value=job),
        patch("src.cli.run_pipeline", side_effect=RuntimeError()),
        patch("src.cli.mark_job_failed") as failed,
    ):
        assert cli.run([VID, "--inline"]) == 1
    failed.assert_called_once_with("job-en", "Unknown pipeline error")


def test_inline_en_failure_stops_before_target(make_job) -> None:
    target = _row(id="job-ru", language="ru")
    en_job = make_job(id="job-en", youtube_video_id=VID)
    with (
        patch("src.cli.find_transcript", side_effect=[None, target, _row()]),
        patch("src.cli.submit_jobs"),
        patch("src.cli.claim_job", return_value=en_job) as claim,
        patch("src.cli.run_pipeline", side_effect=RuntimeError("No subtitles found")),
        patch("src.cli.mark_job_failed") as failed,
    ):
        assert cli.run([VID, "--lang", "ru", "--inline"]) == 1
    claim.assert_called_once_with("job-en")
    failed.assert_called_once_with("job-en", "No subtitles found")


def test_inline_not_claimed_exits_1() -> None:
    with (
        patch("src.cli.find_transcript", return_value=_row(status="processing")),
        patch("src.cli.submit_jobs"),
        patch("src.cli.claim_job", return_value=None),
        patch("src.cli.get_transcript", return_value=_row(status="processing")),
        patch("src.cli.run_pipeline") as run_p,
    ):
        assert cli.run([VID, "--inline"]) == 1
    run_p.assert_not_called()


def test_inline_dependency_pending_exits_1_without_marking(make_job, caplog: pytest.LogCaptureFixture) -> None:
    target = _row(id="job-ru", language="ru")
    ru_job = make_job(id="job-ru", youtube_video_id=VID, language="ru")
    with (
        patch("src.cli.find_transcript", side_effect=[target, target, _row(status="done")]),
        patch("src.cli.submit_jobs"),
        patch("src.cli.claim_job", return_value=ru_job),
        patch("src.cli.run_pipeline", side_effect=DependencyPending("EN not ready")),
        patch("src.cli.mark_job_done") as done,
        patch("src.cli.mark_job_failed") as failed,
    ):
        assert cli.run([VID, "--lang", "ru", "--inline"]) == 1
    done.assert_not_called()
    failed.assert_not_called()
    assert "waiting_dependency" in caplog.text
