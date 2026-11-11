import { createGoogleVisionAccessToken } from "./plato-id-scanner-google-service-account.ts";

function pem(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary).match(/.{1,64}/g)?.join("\n") ?? "";
  return "-----BEGIN PRIVATE KEY-----\n" + encoded + "\n-----END PRIVATE KEY-----";
}

function decodePart(value: string): Record<string, unknown> {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return JSON.parse(atob(padded));
}

Deno.test("creates a short-lived RS256 service-account assertion for the fixed Vision scope", async () => {
  const pair = await crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5", modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256",
  }, true, ["sign", "verify"]);
  const privateKey = pem(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  let endpoint = "";
  let init: RequestInit | undefined;
  const token = await createGoogleVisionAccessToken({
    credentialsJson: JSON.stringify({ client_email: "scanner@example.iam.gserviceaccount.com", private_key: privateKey }),
    nowSeconds: 1_800_000_000,
    fetchImpl: async (input, requestInit) => {
      endpoint = String(input); init = requestInit;
      return Response.json({ access_token: "short-lived-test-token", expires_in: 3600 });
    },
  });
  if (token !== "short-lived-test-token") throw new Error("Access token was not returned");
  if (endpoint !== "https://oauth2.googleapis.com/token") throw new Error("Unexpected token endpoint");
  if (init?.method !== "POST") throw new Error("Expected POST token exchange");
  const form = new URLSearchParams(String(init.body));
  if (form.get("grant_type") !== "urn:ietf:params:oauth:grant-type:jwt-bearer") throw new Error("JWT bearer grant missing");
  const assertion = form.get("assertion");
  if (!assertion) throw new Error("JWT assertion missing");
  const parts = assertion.split(".");
  if (parts.length !== 3) throw new Error("JWT structure invalid");
  const header = decodePart(parts[0]);
  const claims = decodePart(parts[1]);
  if (header.alg !== "RS256") throw new Error("Unexpected JWT algorithm");
  if (claims.iss !== "scanner@example.iam.gserviceaccount.com") throw new Error("Issuer mismatch");
  if (claims.scope !== "https://www.googleapis.com/auth/cloud-vision") throw new Error("Vision scope mismatch");
  if (claims.aud !== "https://oauth2.googleapis.com/token") throw new Error("Audience mismatch");
  if (claims.iat !== 1_800_000_000 || claims.exp !== 1_800_000_300) throw new Error("JWT lifetime is not bounded to five minutes");
});

Deno.test("rejects malformed credentials and token endpoint overrides before network access", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return Response.json({ access_token: "unexpected" }); };
  for (const credentialsJson of [
    "{",
    JSON.stringify({ client_email: "scanner@example.com" }),
    JSON.stringify({ client_email: "scanner@example.com", private_key: "not a key" }),
    JSON.stringify({ client_email: "scanner@example.com", private_key: "x", token_uri: "https://attacker.example/token" }),
  ]) {
    try {
      await createGoogleVisionAccessToken({ credentialsJson, fetchImpl });
      throw new Error("Invalid service-account credentials accepted");
    } catch (error) {
      if (!(error instanceof Error) || !/^GOOGLE_/.test(error.message)) throw error;
    }
  }
  if (calls !== 0) throw new Error("Invalid credentials triggered a network request");
});

Deno.test("classifies token endpoint failures without returning provider response details", async () => {
  const pair = await crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5", modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256",
  }, true, ["sign", "verify"]);
  const privateKey = pem(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  try {
    await createGoogleVisionAccessToken({
      credentialsJson: JSON.stringify({ client_email: "scanner@example.com", private_key: privateKey }),
      fetchImpl: async () => new Response("private provider detail", { status: 503 }),
    });
    throw new Error("Upstream failure accepted");
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "GOOGLE_TOKEN_UPSTREAM_UNAVAILABLE") throw error;
    if (error.message.includes("private provider detail")) throw new Error("Provider body leaked");
  }
});
