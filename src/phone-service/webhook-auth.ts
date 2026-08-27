import { createHmac, timingSafeEqual } from "node:crypto";

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
export function verifyWebhookSignature({
  rawBody,
  signature,
  secret,
  prefix = "sha256=",
}: WebhookVerificationInput): boolean {
  if (!rawBody || !signature || !secret) return false;
  const supplied = signature.startsWith(prefix) ? signature.slice(prefix.length) : signature;
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const suppliedBytes = Buffer.from(supplied, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}
