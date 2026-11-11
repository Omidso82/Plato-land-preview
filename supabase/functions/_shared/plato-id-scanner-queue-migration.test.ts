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
