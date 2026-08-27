export interface WebhookVerificationInput {
  rawBody: string;
  signature: string;
  secret: string;
  prefix?: string;
}

/**
 * Verify a provider webhook against the exact raw request body.
 * The provider must define the signature scheme and header prefix at integration time.
 * Secrets are supplied at runtime and are never persisted by this module.
 */
export async function verifyWebhookSignature({
  rawBody,
  signature,
  secret,
  prefix = "sha256=",
}: WebhookVerificationInput): Promise<boolean> {
  if (!rawBody || !signature || !secret) return false;
  const supplied = signature.startsWith(prefix) ? signature.slice(prefix.length) : signature;
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  ));
  const suppliedBytes = new Uint8Array(supplied.match(/../g)!.map((byte) => Number.parseInt(byte, 16)));
  if (suppliedBytes.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= suppliedBytes[index] ^ expected[index];
  }
  return difference === 0;
}
