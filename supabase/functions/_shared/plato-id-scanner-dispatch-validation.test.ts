import { scannerDetectedMime, scannerSha256, validateScannerStoredObject } from "./plato-id-scanner-dispatch-validation.ts";

const operatorId = "123e4567-e89b-42d3-a456-426614174002";
const scanId = "123e4567-e89b-42d3-a456-426614174001";
const png = new Uint8Array([137,80,78,71,13,10,26,10,1,2,3,4]);

Deno.test("detects only supported image signatures", () => {
  if (scannerDetectedMime(png) !== "image/png") throw new Error("PNG signature not detected");
  if (scannerDetectedMime(new Uint8Array([255,216,255,1])) !== "image/jpeg") throw new Error("JPEG signature not detected");
  if (scannerDetectedMime(new TextEncoder().encode("RIFFxxxxWEBP")) !== "image/webp") throw new Error("WEBP signature not detected");
  if (scannerDetectedMime(new TextEncoder().encode("not an image")) !== null) throw new Error("Unknown bytes accepted");
});

Deno.test("accepts a matching private object locator, size, MIME and signature", () => {
  const result = validateScannerStoredObject({
    operatorId, scanId, storagePath: operatorId + "/" + scanId + "/image.png",
    contentType: "image/png", declaredSize: png.length, actualSize: png.length, bytes: png,
  });
  if (!result.valid || result.mime !== "image/png") throw new Error("Valid stored object rejected");
});

Deno.test("rejects path traversal, foreign ownership, nested paths and unsafe filenames", () => {
  for (const storagePath of [
    "../" + scanId + "/image.png",
    operatorId + "/" + scanId + "/nested/image.png",
    "other-user/" + scanId + "/image.png",
    operatorId + "/123e4567-e89b-42d3-a456-426614174003/image.png",
    operatorId + "/" + scanId + "/unsafe name.png",
    operatorId + "/" + scanId + "/image.jpg",
  ]) {
    const result = validateScannerStoredObject({
      operatorId, scanId, storagePath, contentType: "image/png",
      declaredSize: png.length, actualSize: png.length, bytes: png,
    });
    if (result.valid) throw new Error("Unsafe object path accepted: " + storagePath);
  }
});

Deno.test("rejects size, MIME, extension and byte-signature mismatches", () => {
  const base = {
    operatorId, scanId, storagePath: operatorId + "/" + scanId + "/image.png",
    contentType: "image/png", declaredSize: png.length, actualSize: png.length, bytes: png,
  };
  const invalid = [
    { ...base, declaredSize: png.length + 1 },
    { ...base, actualSize: png.length + 1 },
    { ...base, declaredSize: 15 * 1024 * 1024 + 1 },
    { ...base, contentType: "image/jpeg" },
    { ...base, storagePath: operatorId + "/" + scanId + "/image.webp" },
    { ...base, bytes: new TextEncoder().encode("not image") },
  ];
  for (const item of invalid) {
    if (validateScannerStoredObject(item).valid) throw new Error("Invalid object metadata accepted");
  }
});

Deno.test("computes stable SHA-256 digests", async () => {
  const digest = await scannerSha256(new TextEncoder().encode("PLATO"));
  if (digest !== "78ce5c4a503613dc2dc2f053c8bbfb1bee9b1e9af1a474efd518eab163e1822d") {
    throw new Error("Unexpected SHA-256 digest: " + digest);
  }
});
