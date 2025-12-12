export type JwtRole = "super_admin" | "branch_admin" | "member";

export interface JwtSessionPayload {
  sub: string;
  role: JwtRole;
  name?: string | null;
  email?: string;
  phone?: string;
  avatar?: string;
  branchId?: string;
  iat: number;
  exp: number;
}

function encodeBase64(binary: string): string {
  if (typeof btoa === "function") return btoa(binary);
  return Buffer.from(binary, "binary").toString("base64");
}

function decodeBase64(base64: string): string {
  if (typeof atob === "function") return atob(base64);
  return Buffer.from(base64, "base64").toString("binary");
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const base64 = encodeBase64(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeJson(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  return base64UrlEncodeBytes(bytes);
}

function base64UrlDecodeToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLength);
  const binary = decodeBase64(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeJson<T>(input: string): T {
  const bytes = base64UrlDecodeToBytes(input);
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as T;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

export async function signSessionJwt(
  payload: Omit<JwtSessionPayload, "iat" | "exp">,
  secret: string,
  expiresInSeconds: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtSessionPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncodeJson(header);
  const encodedPayload = base64UrlEncodeJson(fullPayload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSha256(secret, signingInput);
  const encodedSig = base64UrlEncodeBytes(signature);
  return `${signingInput}.${encodedSig}`;
}

export async function verifySessionJwt(token: string, secret: string): Promise<JwtSessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSig] = parts as [string, string, string];
    const header = base64UrlDecodeJson<{ alg?: string; typ?: string }>(encodedHeader);
    if (header.alg !== "HS256") return null;

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = await hmacSha256(secret, signingInput);
    const providedSig = base64UrlDecodeToBytes(encodedSig);

    if (providedSig.length !== expectedSig.length) return null;
    let diff = 0;
    for (let i = 0; i < providedSig.length; i++) diff |= providedSig[i]! ^ expectedSig[i]!;
    if (diff !== 0) return null;

    const payload = base64UrlDecodeJson<JwtSessionPayload>(encodedPayload);
    if (!payload?.sub || !payload?.role || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
