import {
  GOOGLE_VISION_EU_ANNOTATE_ENDPOINT,
  GoogleVisionRequestError,
  requestGoogleVisionOcr,
} from "./plato-id-scanner-google-vision-client.ts";

const context = {
  job_id: "123e4567-e89b-42d3-a456-426614174000",
  scan_id: "123e4567-e89b-42d3-a456-426614174001",
  source_sha256: "a".repeat(64),
  started_at: "2026-11-11T12:00:01.000Z",
  finished_at: "2026-11-11T12:00:02.000Z",
  api_version: "v1",
};

Deno.test("sends bytes only to the fixed EU endpoint and maps the response", async () => {
  let calledUrl = "";
  let requestInit: RequestInit | undefined;
  const result = await requestGoogleVisionOcr({
    accessToken: "test-token",
    imageBytes: new Uint8Array([80, 76, 65, 84, 79]),
    context,
    fetchImpl: async (input, init) => {
      calledUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({
        responses: [{
          fullTextAnnotation: {
            text: "@Operator_01",
            pages: [{ blocks: [{ paragraphs: [{ words: [{ text: "@Operator_01", confidence: 0.99 }] }] }] }],
          },
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });

  if (calledUrl !== GOOGLE_VISION_EU_ANNOTATE_ENDPOINT) throw new Error("Request did not use fixed EU endpoint");
  if (requestInit?.method !== "POST") throw new Error("Expected POST");
  if ((requestInit?.headers as Record<string, string>).Authorization !== "Bearer test-token") throw new Error("Bearer token missing");
  const body = JSON.parse(String(requestInit?.body));
  if (body.requests[0].image.content !== "UExBVE8=") throw new Error("Image bytes not encoded as expected");
  if (body.requests[0].features[0].type !== "DOCUMENT_TEXT_DETECTION") throw new Error("Document OCR feature not selected");
  if (result.raw_text !== "@Operator_01") throw new Error("OCR text not mapped");
});

Deno.test("rejects missing credentials and empty images before making a request", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return new Response("{}"); };
  for (const options of [
    { accessToken: " ", imageBytes: new Uint8Array([1]), context, fetchImpl },
    { accessToken: "token", imageBytes: new Uint8Array(), context, fetchImpl },
  ]) {
    try {
      await requestGoogleVisionOcr(options);
      throw new Error("Invalid input accepted");
    } catch (error) {
      if (!(error instanceof GoogleVisionRequestError)) throw error;
    }
  }
  if (calls !== 0) throw new Error("Invalid input made a network call");
});

Deno.test("classifies upstream failures without exposing response body", async () => {
  try {
    await requestGoogleVisionOcr({
      accessToken: "token", imageBytes: new Uint8Array([1]), context,
      fetchImpl: async () => new Response("private provider detail", { status: 503 }),
    });
    throw new Error("Upstream failure accepted");
  } catch (error) {
    if (!(error instanceof GoogleVisionRequestError)) throw error;
    if (error.code !== "GOOGLE_VISION_UPSTREAM_UNAVAILABLE" || !error.retryable) throw error;
    if (error.message.includes("private provider detail")) throw new Error("Provider body leaked");
  }
});

Deno.test("uses bounded timeout configuration", async () => {
  try {
    await requestGoogleVisionOcr({
      accessToken: "token", imageBytes: new Uint8Array([1]), context,
      timeoutMs: 0, fetchImpl: async () => new Response("{}"),
    });
    throw new Error("Invalid timeout accepted");
  } catch (error) {
    if (!(error instanceof GoogleVisionRequestError) || error.code !== "GOOGLE_VISION_TIMEOUT_INVALID") throw error;
  }
});

Deno.test("maps provider response errors through the stable adapter error", async () => {
  try {
    await requestGoogleVisionOcr({
      accessToken: "token", imageBytes: new Uint8Array([1]), context,
      fetchImpl: async () => new Response(JSON.stringify({
        responses: [{ error: { code: 403, message: "secret detail" } }],
      }), { status: 200 }),
    });
    throw new Error("Provider error accepted");
  } catch (error) {
    if ((error as { code?: string }).code !== "GOOGLE_VISION_PROVIDER_ERROR") throw error;
    if ((error as Error).message.includes("secret detail")) throw new Error("Provider detail leaked");
  }
});
