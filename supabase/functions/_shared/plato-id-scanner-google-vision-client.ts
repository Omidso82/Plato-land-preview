import type { GoogleVisionAdapterContext } from "./plato-id-scanner-google-vision-adapter.ts";
import { adaptGoogleVisionResponse } from "./plato-id-scanner-google-vision-adapter.ts";
import type { ScannerWorkerSuccess } from "./plato-id-scanner-contract.ts";

export const GOOGLE_VISION_EU_ANNOTATE_ENDPOINT =
  "https://eu-vision.googleapis.com/v1/images:annotate";

export type GoogleVisionFeature = "TEXT_DETECTION" | "DOCUMENT_TEXT_DETECTION";

export interface GoogleVisionClientOptions {
  apiKey: string;
  imageBytes: Uint8Array;
  context: GoogleVisionAdapterContext;
  feature?: GoogleVisionFeature;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class GoogleVisionRequestError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  constructor(code: string, retryable: boolean) {
    super(code);
    this.name = "GoogleVisionRequestError";
    this.code = code;
    this.retryable = retryable;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    for (let index = 0; index < chunk.length; index++) binary += String.fromCharCode(chunk[index]);
  }
  return btoa(binary);
}

/**
 * Performs one synchronous OCR request against Google's EU endpoint.
 * Call only from a trusted backend after the operator-uploaded object has
 * passed ownership, approval, MIME, size and source-hash checks.
 *
 * The API key is supplied by the server runtime only and must never be
 * embedded in browser code or logged.
 */
export async function requestGoogleVisionOcr(
  options: GoogleVisionClientOptions,
): Promise<ScannerWorkerSuccess> {
  const {
    apiKey, imageBytes, context,
    feature = "DOCUMENT_TEXT_DETECTION",
    fetchImpl = fetch,
    timeoutMs = 20_000,
  } = options;

  if (!apiKey.trim()) throw new GoogleVisionRequestError("GOOGLE_VISION_AUTH_MISSING", false);
  if (!(imageBytes instanceof Uint8Array) || imageBytes.length === 0) {
    throw new GoogleVisionRequestError("GOOGLE_VISION_IMAGE_EMPTY", false);
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    throw new GoogleVisionRequestError("GOOGLE_VISION_TIMEOUT_INVALID", false);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      const endpoint = new URL(GOOGLE_VISION_EU_ANNOTATE_ENDPOINT);
      endpoint.searchParams.set("key", apiKey);
      response = await fetchImpl(endpoint.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{
            image: { content: bytesToBase64(imageBytes) },
            features: [{ type: feature }],
          }],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new GoogleVisionRequestError("GOOGLE_VISION_TIMEOUT", true);
      }
      if (error instanceof GoogleVisionRequestError) throw error;
      throw new GoogleVisionRequestError("GOOGLE_VISION_NETWORK_ERROR", true);
    }

    if (!response.ok) {
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      throw new GoogleVisionRequestError(
        response.status === 401 || response.status === 403
          ? "GOOGLE_VISION_AUTH_OR_PERMISSION"
          : retryable ? "GOOGLE_VISION_UPSTREAM_UNAVAILABLE" : "GOOGLE_VISION_REQUEST_REJECTED",
        retryable,
      );
    }

    let payload: { responses?: Array<Record<string, unknown>> };
    try {
      payload = await response.json() as { responses?: Array<Record<string, unknown>> };
    } catch {
      throw new GoogleVisionRequestError("GOOGLE_VISION_INVALID_JSON", true);
    }
    const first = payload.responses?.[0];
    if (!first || typeof first !== "object") {
      throw new GoogleVisionRequestError("GOOGLE_VISION_EMPTY_RESPONSE", true);
    }

    const mapped = adaptGoogleVisionResponse(first, context);
    return mapped;
  } finally {
    clearTimeout(timeout);
  }
}
