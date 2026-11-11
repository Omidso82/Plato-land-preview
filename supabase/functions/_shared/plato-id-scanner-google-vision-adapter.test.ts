import { adaptGoogleVisionResponse } from "./plato-id-scanner-google-vision-adapter.ts";
import { validateScannerWorkerSuccess } from "./plato-id-scanner-contract.ts";

const context = {
  job_id: "123e4567-e89b-42d3-a456-426614174000",
  scan_id: "123e4567-e89b-42d3-a456-426614174001",
  source_sha256: "a".repeat(64),
  started_at: "2026-11-11T12:00:01.000Z",
  finished_at: "2026-11-11T12:00:02.000Z",
  api_version: "v1",
};

Deno.test("maps Google Vision full text and word evidence without rewriting", () => {
  const result = adaptGoogleVisionResponse({
    fullTextAnnotation: {
      text: "@Alpha_01 @beta-2",
      pages: [{ blocks: [{ paragraphs: [{ words: [
        { text: "@Alpha_01", confidence: 0.97, boundingBox: { vertices: [{ x: 1, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 4 }, { x: 1, y: 4 }] } },
        { text: "@beta-2", confidence: 0.81 },
      ] }] }] }],
    },
  }, context);

  if (result.raw_text !== "@Alpha_01 @beta-2") throw new Error("Raw OCR text changed");
  if (result.candidates[0].raw_value !== "@Alpha_01") throw new Error("Candidate text changed");
  if (result.candidates[0].confidence !== 0.97) throw new Error("Confidence not preserved");
  if (!result.candidates[0].geometry) throw new Error("Word geometry missing");
  if (result.candidates[1].confidence !== 0.81) throw new Error("Second confidence not preserved");
  if (!validateScannerWorkerSuccess(result)) throw new Error("Mapped result violates worker contract");
});

Deno.test("falls back to textAnnotations when fullTextAnnotation is absent", () => {
  const result = adaptGoogleVisionResponse({
    textAnnotations: [{ description: "@Only_One" }],
  }, context);
  if (result.raw_text !== "@Only_One") throw new Error("Fallback text not preserved");
});

Deno.test("rejects provider errors without exposing provider message", () => {
  try {
    adaptGoogleVisionResponse({ error: { code: 403, message: "private provider detail", status: "PERMISSION_DENIED" } }, context);
    throw new Error("Provider error was accepted");
  } catch (error) {
    if ((error as { code?: string }).code !== "GOOGLE_VISION_PROVIDER_ERROR") throw error;
    if ((error as Error).message.includes("private provider detail")) throw new Error("Provider detail leaked");
  }
});

Deno.test("rejects empty provider responses with a stable code", () => {
  try {
    adaptGoogleVisionResponse({}, context);
    throw new Error("Empty response was accepted");
  } catch (error) {
    if ((error as { code?: string }).code !== "GOOGLE_VISION_EMPTY_RESULT") throw error;
  }
});
