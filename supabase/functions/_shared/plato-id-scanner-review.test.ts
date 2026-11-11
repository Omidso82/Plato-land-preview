import {
  createScannerReviewRevision,
  diffScannerReviewRevisions,
  parseScannerReviewDraft,
  uniqueExactScannerIds,
} from "../../../src/plato-id-scanner-review.ts";

const assertEquals = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
  }
};

Deno.test("exact duplicate removal preserves spelling, case, and order", () => {
  assertEquals(uniqueExactScannerIds(["ID-1", "ID-1", "id-1", "ID-１", " ", null, 3]),
    ["ID-1", "id-1", "ID-１"]);
});

Deno.test("review snapshot is approved, immutable, and version-linked", () => {
  const revision = createScannerReviewRevision({
    revision: 2,
    previousRevision: 1,
    ids: ["A", "B", "A"],
    createdAt: "2026-11-11T12:00:00.000Z",
    createdBy: "owner-user-id",
    note: "Corrected after visual comparison",
  });
  assertEquals(revision.status, "approved");
  assertEquals(revision.ids, ["A", "B"]);
  assertEquals(revision.previousRevision, 1);
  assertEquals(revision.note, "Corrected after visual comparison");
  let blocked = false;
  try { (revision as any).ids.push("C"); } catch { blocked = true; }
  if (!blocked) throw new Error("Review snapshot IDs should be immutable");
});

Deno.test("review revision rejects invalid sequence and missing reviewer", () => {
  for (const input of [
    { revision: 0, createdAt: "2026-11-11T12:00:00Z", createdBy: "owner", ids: [] },
    { revision: 1, previousRevision: 1, createdAt: "2026-11-11T12:00:00Z", createdBy: "owner", ids: [] },
    { revision: 1, createdAt: "2026-11-11T12:00:00Z", createdBy: " ", ids: [] },
  ]) {
    let threw = false;
    try { createScannerReviewRevision(input); } catch { threw = true; }
    if (!threw) throw new Error("Invalid review input was accepted");
  }
});

Deno.test("revision diff reports exact additions and removals only", () => {
  assertEquals(diffScannerReviewRevisions(["A", "B", "O0"], ["A", "C", "O0", "00"]),
    { added: ["C", "00"], removed: ["B"], unchanged: ["A", "O0"] });
});


Deno.test("manual review editor parses one ID per line for LF and CRLF", () => {
  assertEquals(parseScannerReviewDraft("  ID_A  \nID_B\nID_A\n\nID_C "), ["ID_A", "ID_B", "ID_C"]);
  assertEquals(parseScannerReviewDraft("ID_A\r\nID_B\r\nID_C"), ["ID_A", "ID_B", "ID_C"]);
});
