const migrationUrl = new URL("../../migrations/20261111000300_plato_id_scanner_ocr_queue_DRAFT.sql", import.meta.url);
const sql = await Deno.readTextFile(migrationUrl);

Deno.test("OCR queue migration keeps browser roles out of queue tables", () => {
  if (!/revoke all on public\.plato_id_scanner_ocr_jobs from anon, authenticated/i.test(sql)) throw new Error("Jobs table is not denied to browser roles");
  if (!/revoke all on public\.plato_id_scanner_ocr_attempts from anon, authenticated/i.test(sql)) throw new Error("Attempt table is not denied to browser roles");
  if (!/grant execute on function public\.claim_plato_id_scanner_ocr_jobs[\s\S]*?to service_role/i.test(sql)) throw new Error("Claim RPC is not service-role-only");
  if (!/grant execute on function public\.complete_plato_id_scanner_ocr_job[\s\S]*?to service_role/i.test(sql)) throw new Error("Completion RPC is not service-role-only");
});

Deno.test("queue claims are atomic and fenced by lease attempt and worker identity", () => {
  if (!/for update skip locked/i.test(sql)) throw new Error("Atomic skip-locked claim missing");
  if (!/lease_expires_at <= now\(\)/i.test(sql)) throw new Error("Expired lease callback rejection missing");
  if (!/current_job\.attempt <> p_attempt/i.test(sql)) throw new Error("Attempt fencing missing");
  if (!/current_job\.worker_id is distinct from p_worker_id/i.test(sql)) throw new Error("Worker identity fencing missing");
  if (!/current_job\.source_sha256 <> lower\(p_source_sha256\)/i.test(sql)) throw new Error("Source hash validation missing");
});

Deno.test("queue creates append-only attempt records and leaves enqueue under dispatcher control", () => {
  if (!/insert into public\.plato_id_scanner_ocr_attempts[\s\S]*?from reclaimed/i.test(sql)) throw new Error("Attempt start audit missing");
  if (!/unique\(job_id, attempt\)/i.test(sql)) throw new Error("Attempt idempotency key missing");
  if (!/deliberately no automatic enqueue trigger/i.test(sql)) throw new Error("Dispatcher boundary not documented");
});

Deno.test("enqueue RPC is service-role-only and binds the immutable source digest", () => {
  if (!/create or replace function public\.enqueue_plato_id_scanner_ocr_job/i.test(sql)) throw new Error("Trusted enqueue RPC missing");
  if (!/revoke all on function public\.enqueue_plato_id_scanner_ocr_job\(uuid,text\) from public, anon, authenticated/i.test(sql)) throw new Error("Enqueue RPC is not denied to browser roles");
  if (!/grant execute on function public\.enqueue_plato_id_scanner_ocr_job\(uuid,text\) to service_role/i.test(sql)) throw new Error("Enqueue RPC is not service-role-only");
  if (!/source_upload\.status not in \('uploaded','queued','failed'\)/i.test(sql)) throw new Error("Enqueue eligibility guard missing");
  if (!/queued_job\.source_sha256 <> lower\(p_source_sha256\)/i.test(sql)) throw new Error("Enqueue digest mismatch guard missing");
});

Deno.test("dispatcher retries only failed jobs below the configured attempt limit", () => {
  if (!/if queued_job\.status = 'failed' then[\s\S]*?queued_job\.attempt >= queued_job\.max_attempts/i.test(sql)) throw new Error("Bounded retry guard missing");
  if (!/set status = 'queued', available_at = now\(\), last_error_code = null/i.test(sql)) throw new Error("Explicit failed-job retry transition missing");
});

Deno.test("expired leases close the prior attempt audit before a new attempt is reclaimed", () => {
  if (!/expired_attempts as \([\s\S]*?outcome = 'lease_expired'[\s\S]*?a\.attempt = c\.prior_attempt[\s\S]*?from expired_attempts/i.test(sql)) throw new Error("Expired attempt audit transition missing");
});
