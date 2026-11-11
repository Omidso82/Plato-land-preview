import {
  createScannerReviewRevision,
  uniqueExactScannerIds,
  type ScannerReviewRevision,
} from "./plato-id-scanner-review";

type SupabaseLike = any;

export interface StoredScannerReviewRevision extends ScannerReviewRevision {
  id: string;
  scan_id: string;
  reviewer_id: string;
  reviewed_at: string;
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
