import { adaptScannerWorkerSuccessToReviewPayload } from "./plato-id-scanner-result-adapter.ts";

const result = {
  contract_version: "1" as const,
  job_id: "123e4567-e89b-42d3-a456-426614174000",
  scan_id: "123e4567-e89b-42d3-a456-426614174001",
  outcome: "succeeded" as const,
  engine: { name: "fixture-ocr", version: "1.0" },
  source_sha256: "a".repeat(64),
  raw_text: "group title\n@PlayerOne @Player_Two\n@PlayerThree@PlayerFour\nplain-text-without-at",
  candidates: [
    { raw_value: "PlayerOne", confidence: 0.9, geometry: null, flags: [] },
  ],
  started_at: "2026-11-11T12:00:00.000Z",
  finished_at: "2026-11-11T12:00:01.000Z",
};

Deno.test("adapts provider-neutral raw OCR text using the approved @ rule", () => {
  const adapted = adaptScannerWorkerSuccessToReviewPayload(result);
  const expected = ["@PlayerOne", "@Player_Two", "@PlayerThree", "@PlayerFour"];
  if (JSON.stringify(adapted.ids) !== JSON.stringify(expected)) {
    throw new Error("Unexpected provisional IDs: " + JSON.stringify(adapted.ids));
  }
  if (!adapted.review_required || adapted.extraction_rule !== "at_sign_v0.2") {
    throw new Error("OCR candidates must remain provisional under the approved rule");
  }
  if (adapted.provider_candidates.length !== 1 || adapted.raw_text !== result.raw_text) {
    throw new Error("Provider evidence/raw text was not preserved");
  }
});

Deno.test("does not autocorrect, trim punctuation or infer IDs without @", () => {
  const adapted = adaptScannerWorkerSuccessToReviewPayload({
    ...result,
    raw_text: "ID-plain @O0_I1 @Case, @Case",
  });
  if (JSON.stringify(adapted.ids) !== JSON.stringify(["@O0_I1", "@Case,", "@Case"])) {
    throw new Error("Raw candidate spelling/punctuation changed");
  }
});


Deno.test("retains exact duplicate occurrences and their source positions for audit", () => {
  const adapted = adaptScannerWorkerSuccessToReviewPayload({
    ...result,
    raw_text: "@Repeat @Other\\n@Repeat @repeat",
  });
  if (JSON.stringify(adapted.ids) !== JSON.stringify(["@Repeat", "@Other", "@repeat"])) {
    throw new Error("Unique preview IDs are incorrect: " + JSON.stringify(adapted.ids));
  }
  if (adapted.duplicate_audit.duplicate_count !== 1 ||
      adapted.duplicate_audit.duplicates[0]?.raw_value !== "@Repeat" ||
      adapted.duplicate_audit.duplicates[0]?.scan_id !== result.scan_id ||
      adapted.duplicate_audit.duplicates[0]?.start !== 14) {
    throw new Error("Duplicate occurrence provenance was not retained");
  }
  if (adapted.extraction_candidates.length !== 4) {
    throw new Error("All raw occurrences must remain available to the manager");
  }
});
