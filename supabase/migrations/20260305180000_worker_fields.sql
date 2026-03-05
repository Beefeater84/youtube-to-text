-- v0.3: worker fields for Postgres-as-queue pipeline

------------------------------------------------------------
-- Make channel_id nullable (form creates records before
-- channel is resolved; worker or server action fills it in)
------------------------------------------------------------
alter table public.transcripts
  alter column channel_id drop not null;

------------------------------------------------------------
-- Add worker-related columns
------------------------------------------------------------
alter table public.transcripts
  add column retry_count   integer      not null default 0,
  add column error_message text,
  add column started_at    timestamptz;

------------------------------------------------------------
-- RPC: grab next pending transcript for processing
-- Uses FOR UPDATE SKIP LOCKED to safely support concurrent workers.
-- Returns the grabbed row or empty set if queue is empty.
------------------------------------------------------------
create or replace function public.grab_pending_transcript()
returns setof public.transcripts
language sql
volatile
security definer
as $$
  update public.transcripts
  set status     = 'processing',
      started_at = now()
  where id = (
    select id
    from public.transcripts
    where status = 'pending'
    order by created_at
    for update skip locked
    limit 1
  )
  returning *;
$$;

------------------------------------------------------------
-- RPC: mark a job as failed and increment retry_count atomically
------------------------------------------------------------
create or replace function public.increment_retry_and_fail(
  job_id uuid,
  err_message text
)
returns void
language sql
volatile
security definer
as $$
  update public.transcripts
  set status        = 'failed',
      error_message = err_message,
      retry_count   = retry_count + 1
  where id = job_id;
$$;

------------------------------------------------------------
-- RPC: reset stale processing jobs (stuck > 15 min)
-- Jobs under max retries go back to pending;
-- jobs at max retries are marked failed.
------------------------------------------------------------
create or replace function public.recover_stale_jobs(
  stale_minutes integer default 15,
  max_retries   integer default 3
)
returns integer
language plpgsql
volatile
security definer
as $$
declare
  recovered integer;
begin
  -- Reset retriable jobs
  update public.transcripts
  set status      = 'pending',
      started_at  = null,
      retry_count = retry_count + 1
  where status = 'processing'
    and started_at < now() - (stale_minutes || ' minutes')::interval
    and retry_count < max_retries;

  get diagnostics recovered = row_count;

  -- Fail non-retriable jobs
  update public.transcripts
  set status        = 'failed',
      error_message = 'max retries exceeded (stale job recovery)'
  where status = 'processing'
    and started_at < now() - (stale_minutes || ' minutes')::interval
    and retry_count >= max_retries;

  return recovered;
end;
$$;
