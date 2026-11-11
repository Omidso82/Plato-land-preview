export const SCANNER_BUCKET = "plato-id-scans";
export const SCANNER_MAX_BYTES = 15 * 1024 * 1024;
export const SCANNER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function scannerDetectedMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 12
    && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export function validateScannerStoredObject(input: {
  operatorId: string;
  scanId: string;
  storagePath: string;
  contentType: string;
  declaredSize: number;
  actualSize: number;
  bytes: Uint8Array;
}): { valid: true; mime: string } | { valid: false; code: string } {
  const segments = input.storagePath.split("/");
  if (segments.length !== 3 || segments[0] !== input.operatorId || segments[1] !== input.scanId
    || !/^[A-Za-z0-9_-]{1,100}\.(jpg|png|webp)$/.test(segments[2])) {
    return { valid: false, code: "SCANNER_OBJECT_PATH_INVALID" };
  }
  if (!(SCANNER_MIME_TYPES as readonly string[]).includes(input.contentType)
    || !Number.isInteger(input.declaredSize) || input.declaredSize <= 0
    || input.declaredSize > SCANNER_MAX_BYTES || input.actualSize !== input.declaredSize
    || input.bytes.length !== input.actualSize) {
    return { valid: false, code: "SCANNER_OBJECT_SIZE_OR_METADATA_INVALID" };
  }
  const mime = scannerDetectedMime(input.bytes);
  if (!mime || mime !== input.contentType) return { valid: false, code: "SCANNER_OBJECT_MIME_MISMATCH" };
  const extension = segments[2].split(".").pop();
  const expected = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  if (extension !== expected) return { valid: false, code: "SCANNER_OBJECT_EXTENSION_MISMATCH" };
  return { valid: true, mime };
}

export async function scannerSha256(bytes: Uint8Array): Promise<string> {
  const stableBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(stableBuffer).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", stableBuffer);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}
