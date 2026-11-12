import type { ScannerWorkerSuccess } from "./plato-id-scanner-contract.ts";

/**
 * Maps a synchronous Google Cloud Vision annotate response into the existing
 * provider-neutral worker envelope. This is a pure adapter: it performs no
 * network requests, does not hold credentials, and never changes OCR text.
 */
type VisionVertex = { x?: number; y?: number };
type VisionWord = {
  text?: string;
  confidence?: number;
  boundingBox?: { vertices?: VisionVertex[]; normalizedVertices?: VisionVertex[] };
};
type VisionResponse = {
  error?: { code?: number; message?: string; status?: string };
  fullTextAnnotation?: {
    text?: string;
    pages?: Array<{
      blocks?: Array<{
        paragraphs?: Array<{
          words?: VisionWord[];
        }>;
      }>;
    }>;
  };
  textAnnotations?: Array<{
    description?: string;
    boundingPoly?: { vertices?: VisionVertex[] };
  }>;
};

export interface GoogleVisionAdapterContext {
  job_id: string;
  scan_id: string;
  source_sha256: string;
  started_at: string;
  finished_at: string;
  api_version: string;
  model_version?: string;
}

function wordGeometry(word: VisionWord): Record<string, unknown> | null {
  const box = word.boundingBox;
  if (!box) return null;
  const vertices = box.normalizedVertices ?? box.vertices;
  if (!vertices?.length) return null;
  return { vertices: vertices.map(({ x, y }) => ({ x: x ?? 0, y: y ?? 0 })) };
}

/** Throws a safe, stable error for provider-level failures or unusable responses. */
export function adaptGoogleVisionResponse(
  response: VisionResponse,
  context: GoogleVisionAdapterContext,
): ScannerWorkerSuccess {
  if (response.error) {
    const error = new Error("Google Vision OCR request failed") as Error & { code?: string };
    error.code = "GOOGLE_VISION_PROVIDER_ERROR";
    throw error;
  }

  const rawText = response.fullTextAnnotation?.text
    ?? response.textAnnotations?.[0]?.description;

  if (typeof rawText !== "string") {
    const error = new Error("Google Vision response contained no OCR text") as Error & { code?: string };
    error.code = "GOOGLE_VISION_EMPTY_RESULT";
    throw error;
  }

  const words: VisionWord[] = [];
  for (const page of response.fullTextAnnotation?.pages ?? []) {
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) words.push(word);
      }
    }
  }

  return {
    contract_version: "1",
    job_id: context.job_id,
    scan_id: context.scan_id,
    outcome: "succeeded",
    engine: {
      name: "google-cloud-vision",
      version: context.api_version,
      ...(context.model_version ? { model_version: context.model_version } : {}),
    },
    source_sha256: context.source_sha256,
    raw_text: rawText,
    candidates: words
      .filter((word) => typeof word.text === "string" && word.text.length > 0)
      .map((word) => ({
        raw_value: word.text as string,
        confidence: typeof word.confidence === "number" ? word.confidence : null,
        geometry: wordGeometry(word),
        flags: [],
      })),
    started_at: context.started_at,
    finished_at: context.finished_at,
  };
}
