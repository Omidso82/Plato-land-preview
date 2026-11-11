const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_VISION_SCOPE = "https://www.googleapis.com/auth/cloud-vision";

export interface GoogleServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function pemBytes(pem: string): ArrayBuffer {
  const encoded = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function createGoogleVisionAccessToken(options: {
  credentialsJson: string;
  fetchImpl?: typeof fetch;
  nowSeconds?: number;
}): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;
  let credentials: GoogleServiceAccountCredentials;
  try {
    credentials = JSON.parse(options.credentialsJson);
  } catch {
    throw new Error("GOOGLE_CREDENTIALS_INVALID");
  }
  if (typeof credentials.client_email !== "string" || !credentials.client_email
    || typeof credentials.private_key !== "string" || !credentials.private_key) {
    throw new Error("GOOGLE_CREDENTIALS_INVALID");
  }
  if (credentials.token_uri && credentials.token_uri !== GOOGLE_TOKEN_URL) {
    throw new Error("GOOGLE_TOKEN_ENDPOINT_REJECTED");
  }

  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = base64Url(new TextEncoder().encode(JSON.stringify({
    iss: credentials.client_email,
    scope: GOOGLE_VISION_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 300,
  })));
  const unsigned = header + "." + claim;
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "pkcs8", pemBytes(credentials.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
    );
  } catch {
    throw new Error("GOOGLE_PRIVATE_KEY_INVALID");
  }
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned),
  );
  const assertion = unsigned + "." + base64Url(new Uint8Array(signature));

  let response: Response;
  try {
    response = await fetchImpl(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("GOOGLE_TOKEN_NETWORK_ERROR");
  }
  if (!response.ok) {
    throw new Error(response.status === 429 || response.status >= 500
      ? "GOOGLE_TOKEN_UPSTREAM_UNAVAILABLE" : "GOOGLE_TOKEN_AUTH_FAILED");
  }
  const result = await response.json().catch(() => null);
  if (typeof result?.access_token !== "string" || !result.access_token) {
    throw new Error("GOOGLE_TOKEN_RESPONSE_INVALID");
  }
  return result.access_token;
}
