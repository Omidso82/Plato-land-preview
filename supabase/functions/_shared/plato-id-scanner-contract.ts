// Provider-neutral PLATO ID Scanner worker contract validators.
// Deliberately does not parse or normalize Plato IDs: canonical syntax is not yet confirmed.
export type ScannerContentType = "image/jpeg" | "image/png" | "image/webp";

export interface ScannerWorkerJob {
  contract_version: "1";
  job_id: string;
  scan_id: string;
  attempt: number;
  source: {
    bucket: "plato-id-scans";
    object_key: string;
    content_type: ScannerContentType;
    sha256: string;
  };
  requested_at: string;
}

export interface ScannerOcrCandidate {
  raw_value: string;
  confidence: number | null;
  geometry: Record<string, unknown> | null;
  flags: string[];
}

export interface ScannerWorkerSuccess {
  contract_version: "1";
  job_id: string;
  scan_id: string;
  outcome: "succeeded";
  engine: { name: string; version: string; model_version?: string };
  source_sha256: string;
  raw_text: string;
  candidates: ScannerOcrCandidate[];
  started_at: string;
  finished_at: string;
}

export interface ScannerWorkerFailure {
  contract_version: "1";
  job_id: string;
  scan_id: string;
  outcome: "failed";
  error_code: string;
  safe_message: string;
  retryable: boolean;
  attempt: number;
  started_at: string;
  finished_at: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const MIME_TYPES = new Set<ScannerContentType>(["image/jpeg", "image/png", "image/webp"]);

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function uuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function commonIdentity(value: Record<string, unknown>): boolean {
  return value.contract_version === "1" && uuid(value.job_id) && uuid(value.scan_id);
}

function safeObjectKey(value: unknown, scanId: string): value is string {
  if (!nonEmpty(value) || value.startsWith("/") || value.includes("\\")) return false;
  const segments = value.split("/");
  return segments.length === 3
    && uuid(segments[0])
    && segments[1] === scanId
    && nonEmpty(segments[2])
    && segments[2] !== "."
    && segments[2] !== ".."
    && !segments[2].includes("..");
}

export function validateScannerWorkerJob(value: unknown): value is ScannerWorkerJob {
  if (!record(value) || !commonIdentity(value)) return false;
  const source = value.source;
  if (!record(source)) return false;
  return Number.isInteger(value.attempt) && (value.attempt as number) >= 1
    && source.bucket === "plato-id-scans"
    && safeObjectKey(source.object_key, value.scan_id as string)
    && MIME_TYPES.has(source.content_type as ScannerContentType)
    && typeof source.sha256 === "string" && SHA256.test(source.sha256)
    && timestamp(value.requested_at);
}

export function validateScannerWorkerSuccess(value: unknown): value is ScannerWorkerSuccess {
  if (!record(value) || !commonIdentity(value) || value.outcome !== "succeeded") return false;
  const engine = value.engine;
  if (!record(engine) || !nonEmpty(engine.name) || !nonEmpty(engine.version)) return false;
  if (engine.model_version !== undefined && typeof engine.model_version !== "string") return false;
  if (typeof value.source_sha256 !== "string" || !SHA256.test(value.source_sha256)) return false;
  if (typeof value.raw_text !== "string" || !Array.isArray(value.candidates)) return false;
  if (!timestamp(value.started_at) || !timestamp(value.finished_at)) return false;
  if (Date.parse(value.finished_at) < Date.parse(value.started_at)) return false;
  return value.candidates.every((candidate: unknown) => {
    if (!record(candidate) || !nonEmpty(candidate.raw_value)) return false;
    const confidence = candidate.confidence;
    if (confidence !== null && (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1)) return false;
    if (candidate.geometry !== null && !record(candidate.geometry)) return false;
    return Array.isArray(candidate.flags) && candidate.flags.every((flag: unknown) => nonEmpty(flag));
  });
}

export function validateScannerWorkerFailure(value: unknown): value is ScannerWorkerFailure {
  if (!record(value) || !commonIdentity(value) || value.outcome !== "failed") return false;
  return nonEmpty(value.error_code)
    && nonEmpty(value.safe_message)
    && typeof value.retryable === "boolean"
    && Number.isInteger(value.attempt) && (value.attempt as number) >= 1
    && timestamp(value.started_at) && timestamp(value.finished_at)
    && Date.parse(value.finished_at) >= Date.parse(value.started_at);
}
