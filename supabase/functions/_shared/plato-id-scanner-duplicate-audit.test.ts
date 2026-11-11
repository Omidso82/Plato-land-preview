import { auditExactScannerDuplicates } from "./plato-id-scanner-duplicate-audit.ts";

const assertEquals = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
  }
};

Deno.test("keeps first exact occurrence and audits every later duplicate with source", () => {
  const result = auditExactScannerDuplicates([
    { raw_value: "@A", scan_id: "scan-1", candidate_index: 0 },
    { raw_value: "@B", scan_id: "scan-1", candidate_index: 1 },
    { raw_value: "@A", scan_id: "scan-2", candidate_index: 0 },
    { raw_value: "@A", scan_id: "scan-3", candidate_index: 4 },
  ]);
  assertEquals(result.accepted_ids, ["@A", "@B"]);
  assertEquals(result.total_occurrences, 4);
  assertEquals(result.unique_count, 2);
  assertEquals(result.duplicate_count, 2);
  assertEquals(result.duplicates.map(item => ({
    raw_value: item.raw_value,
    scan_id: item.scan_id,
    duplicate_of_scan_id: item.duplicate_of_scan_id,
    duplicate_of_candidate_index: item.duplicate_of_candidate_index,
    duplicate_number: item.duplicate_number,
  })), [
    { raw_value: "@A", scan_id: "scan-2", duplicate_of_scan_id: "scan-1", duplicate_of_candidate_index: 0, duplicate_number: 1 },
    { raw_value: "@A", scan_id: "scan-3", duplicate_of_scan_id: "scan-1", duplicate_of_candidate_index: 0, duplicate_number: 2 },
  ]);
});

Deno.test("does not merge case, punctuation, underscore or confusable-looking strings", () => {
  const result = auditExactScannerDuplicates([
    { raw_value: "@Ali_1", scan_id: "s", candidate_index: 0 },
    { raw_value: "@ali_1", scan_id: "s", candidate_index: 1 },
    { raw_value: "@Ali_1,", scan_id: "s", candidate_index: 2 },
    { raw_value: "@AII_1", scan_id: "s", candidate_index: 3 },
    { raw_value: "@Ali_1", scan_id: "s", candidate_index: 4 },
  ]);
  assertEquals(result.accepted_ids, ["@Ali_1", "@ali_1", "@Ali_1,", "@AII_1"]);
  assertEquals(result.duplicate_count, 1);
});

Deno.test("preserves candidate order and returns empty audit for no candidates", () => {
  assertEquals(auditExactScannerDuplicates([]), {
    accepted_ids: [], first_occurrences: [], duplicates: [], occurrence_counts: [],
    total_occurrences: 0, unique_count: 0, duplicate_count: 0,
  });
});

Deno.test("rejects occurrences without source identity", () => {
  let threw = false;
  try {
    auditExactScannerDuplicates([{ raw_value: "@A", scan_id: "", candidate_index: 0 }]);
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("Expected invalid source identity to be rejected");
});
