import type { ProviderUsageEvent } from "./mvp.js";
import { validateProviderUsageEvent } from "./provider-validation.js";

export interface ProviderEventValidator {
  validate(event: unknown): ProviderUsageEvent;
}

/**
 * Normalize provider ingress onto the canonical Phone Service usage-event shape.
 * Provider-specific field mapping must happen before this boundary.
 */
export class StrictProviderEventValidator implements ProviderEventValidator {
  validate(event: unknown): ProviderUsageEvent {
    return validateProviderUsageEvent(event);
  }
}

/**
 * Deduplicate within a provider namespace so two providers may legitimately use
 * the same event identifier without colliding in the shared ledger.
 */
export function dedupeProviderEventIds(seen: Set<string>, event: ProviderUsageEvent): boolean {
  const key = `${event.provider}:${event.id}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}
