declare const Deno: { test(name: string, fn: () => void | Promise<void>): void };

import {
  loadDailyScannerReport,
  loadScannerReportInputs,
  loadWeeklyScannerReport,
} from "./plato-id-scanner-review-store";

const assert = (value: unknown, message = "Assertion failed") => {
  if (!value) throw new Error(message);
};
const assertEquals = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
  }
};

function mockClient(scans: unknown[], revisions: unknown[]) {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = [];
  return {
    calls,
    from(table: string) {
      const query: any = {};
      for (const method of ["select", "gte", "lt", "in", "eq", "order"]) {
        query[method] = (...args: unknown[]) => {
          calls.push({ table, method, args });
          if (method === "order") {
            return Promise.resolve({
              data: table === "plato_id_scanner_uploads" ? scans : revisions,
              error: null,
            });
          }
          return query;
        };
      }
      return query;
    },
  };
}

Deno.test("report loader queries only the requested window then loads revisions for those scans", async () => {
  const client = mockClient(
    [{ id: "scan-1", created_at: "2026-11-07T10:00:00+03:30", status: "completed", ocr_result: { ids: ["old"] } }],
    [{ scan_id: "scan-1", revision: 1, status: "approved", canonical_ids: ["ID-1"] }],
  );
  const loaded = await loadScannerReportInputs(client, {
    fromInclusive: "2026-11-07T00:00:00+03:30",
    toExclusive: "2026-11-08T00:00:00+03:30",
  });
  assertEquals(loaded.scans.length, 1);
  assertEquals(loaded.revisions.length, 1);
  assert(client.calls.some(call => call.table === "plato_id_scanner_uploads" && call.method === "gte"));
  assert(client.calls.some(call => call.table === "plato_id_scanner_uploads" && call.method === "lt"));
  assert(client.calls.some(call => call.table === "plato_id_scanner_review_revisions" && call.method === "in"));
});

Deno.test("daily and weekly Supabase report helpers use the latest approved revision", async () => {
  const client = mockClient(
    [
      { id: "scan-1", created_at: "2026-11-07T10:00:00+03:30", status: "completed", ocr_result: { ids: ["OCR-OLD"] } },
      { id: "scan-2", created_at: "2026-11-08T10:00:00+03:30", status: "completed", ocr_result: { ids: ["OCR-UNREVIEWED"] } },
    ],
    [
      { scan_id: "scan-1", revision: 1, status: "approved", canonical_ids: ["ID-OLD"] },
      { scan_id: "scan-1", revision: 2, status: "approved", canonical_ids: ["ID-NEW"] },
    ],
  );
  const daily = await loadDailyScannerReport(client, {
    fromInclusive: "2026-11-07T00:00:00+03:30",
    toExclusive: "2026-11-08T00:00:00+03:30",
    jalaliDateKey: "1405/08/16",
  });
  assertEquals(daily.ids, ["ID-NEW"]);
  const weekly = await loadWeeklyScannerReport(client, {
    fromInclusive: "2026-11-07T00:00:00+03:30",
    toExclusive: "2026-11-14T00:00:00+03:30",
    anyDateInWeek: "2026-11-11T12:00:00+03:30",
  });
  assertEquals(weekly.rows.map(row => row.id), ["ID-NEW"]);
});

Deno.test("report loader rejects invalid or reversed time windows before querying", async () => {
  const client = mockClient([], []);
  let rejected = false;
  try {
    await loadScannerReportInputs(client, {
      fromInclusive: "2026-11-08T00:00:00Z",
      toExclusive: "2026-11-07T00:00:00Z",
    });
  } catch {
    rejected = true;
  }
  assert(rejected);
  assertEquals(client.calls.length, 0);
});
