import {
  createScannerReviewRevision,
  uniqueExactScannerIds,
} from "./plato-id-scanner-review";

type SupabaseLike = any;

export interface StoredScannerReviewRevision {
  id: string;
  scan_id: string;
  revision: number;
  previous_revision: number | null;
  status: "approved";
  canonical_ids: string[];
  reviewer_id: string;
  reviewed_at: string;
  note: string | null;
}

export interface StoredScannerReportVersion {
  id: string;
  report_kind: "daily" | "weekly" | "per_scan";
  period_key: string;
  version: number;
  previous_version: number | null;
  payload: Record<string, unknown>;
  created_by: string;
  created_at: string;
  note: string | null;
}

export async function loadScannerReviewRevisions(
  client: SupabaseLike,
  scanId: string,
): Promise<StoredScannerReviewRevision[]> {
  const { data, error } = await client
    .from("plato_id_scanner_review_revisions")
    .select("*")
    .eq("scan_id", scanId)
    .order("revision", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StoredScannerReviewRevision[];
}

/**
 * Append a new approved review revision. Database triggers are the final
 * authority for sequencing and uniqueness; this client-side lookup is UX only.
 */
export async function appendScannerReviewRevision(
  client: SupabaseLike,
  input: {
    scanId: string;
    ids: readonly string[];
    reviewerId: string;
    note?: string | null;
  },
): Promise<StoredScannerReviewRevision> {
  const history = await loadScannerReviewRevisions(client, input.scanId);
  const previous = history.at(-1) ?? null;
  const revision = createScannerReviewRevision({
    revision: (previous?.revision ?? 0) + 1,
    previousRevision: previous?.revision ?? null,
    ids: input.ids,
    createdAt: new Date().toISOString(),
    createdBy: input.reviewerId,
    note: input.note,
  });

  const { data, error } = await client
    .from("plato_id_scanner_review_revisions")
    .insert({
      scan_id: input.scanId,
      revision: revision.revision,
      previous_revision: revision.previousRevision,
      status: revision.status,
      canonical_ids: revision.ids,
      reviewer_id: input.reviewerId,
      note: revision.note,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as StoredScannerReviewRevision;
}

export async function loadScannerReportVersions(
  client: SupabaseLike,
  reportKind: StoredScannerReportVersion["report_kind"],
  periodKey: string,
): Promise<StoredScannerReportVersion[]> {
  const { data, error } = await client
    .from("plato_id_scanner_report_versions")
    .select("*")
    .eq("report_kind", reportKind)
    .eq("period_key", periodKey)
    .order("version", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StoredScannerReportVersion[];
}

export async function appendScannerReportVersion(
  client: SupabaseLike,
  input: {
    reportKind: StoredScannerReportVersion["report_kind"];
    periodKey: string;
    payload: Record<string, unknown>;
    creatorId: string;
    note?: string | null;
  },
): Promise<StoredScannerReportVersion> {
  const history = await loadScannerReportVersions(client, input.reportKind, input.periodKey);
  const previous = history.at(-1) ?? null;
  const { data, error } = await client
    .from("plato_id_scanner_report_versions")
    .insert({
      report_kind: input.reportKind,
      period_key: input.periodKey,
      version: (previous?.version ?? 0) + 1,
      previous_version: previous?.version ?? null,
      payload: input.payload,
      created_by: input.creatorId,
      note: input.note?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as StoredScannerReportVersion;
}

/** Canonical ID preview for editors; exact duplicate removal only. */
export function scannerReviewText(ids: readonly unknown[]): string {
  return uniqueExactScannerIds(ids).join("\n");
}


import {
  buildDailyScannerReportFromRevisions,
  buildWeeklyScannerReportFromRevisions,
  type ScannerApprovedRevisionSource,
  type ScannerReportSource,
  type DailyScannerReport,
  type WeeklyScannerReport,
} from "./plato-id-scanner-reports";

export interface ScannerReportInputWindow {
  /** Inclusive lower bound in ISO-8601; calculate in Asia/Tehran at the caller. */
  fromInclusive: string;
  /** Exclusive upper bound in ISO-8601; calculate in Asia/Tehran at the caller. */
  toExclusive: string;
}

export interface LoadedScannerReportInputs {
  scans: ScannerReportSource[];
  revisions: ScannerApprovedRevisionSource[];
}

/**
 * Load only the requested time window and its immutable review history.
 * Supabase RLS remains the authorization boundary: owners see all scans,
 * approved operators see only their own scans/revisions.
 */
export async function loadScannerReportInputs(
  client: SupabaseLike,
  window: ScannerReportInputWindow,
): Promise<LoadedScannerReportInputs> {
  if (!Number.isFinite(Date.parse(window.fromInclusive)) ||
      !Number.isFinite(Date.parse(window.toExclusive)) ||
      Date.parse(window.fromInclusive) >= Date.parse(window.toExclusive)) {
    throw new Error("Invalid Scanner report time window");
  }

  const { data: scansData, error: scansError } = await client
    .from("plato_id_scanner_uploads")
    .select("id,created_at,status,ocr_result")
    .gte("created_at", window.fromInclusive)
    .lt("created_at", window.toExclusive)
    .order("created_at", { ascending: true });
  if (scansError) throw scansError;

  const scans = (scansData ?? []) as ScannerReportSource[];
  if (!scans.length) return { scans: [], revisions: [] };

  const scanIds = scans.map(scan => scan.id);
  const { data: revisionsData, error: revisionsError } = await client
    .from("plato_id_scanner_review_revisions")
    .select("scan_id,revision,status,canonical_ids")
    .in("scan_id", scanIds)
    .order("revision", { ascending: true });
  if (revisionsError) throw revisionsError;

  return {
    scans,
    revisions: (revisionsData ?? []) as ScannerApprovedRevisionSource[],
  };
}

/** Build a daily report from live Supabase rows and the latest approved revisions. */
export async function loadDailyScannerReport(
  client: SupabaseLike,
  input: ScannerReportInputWindow & { jalaliDateKey: string },
): Promise<DailyScannerReport> {
  const loaded = await loadScannerReportInputs(client, input);
  return buildDailyScannerReportFromRevisions(
    loaded.scans,
    loaded.revisions,
    input.jalaliDateKey,
  );
}

/** Build a Saturday–Friday report from live Supabase rows and approved revisions. */
export async function loadWeeklyScannerReport(
  client: SupabaseLike,
  input: ScannerReportInputWindow & { anyDateInWeek: string },
): Promise<WeeklyScannerReport> {
  const loaded = await loadScannerReportInputs(client, input);
  return buildWeeklyScannerReportFromRevisions(
    loaded.scans,
    loaded.revisions,
    input.anyDateInWeek,
  );
}
