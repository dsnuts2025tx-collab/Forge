import type { ProviderUsageEvent } from "./mvp.js";

export interface ProviderEventValidator {
  validate(event: ProviderUsageEvent): ProviderUsageEvent;
}

export class StrictProviderEventValidator implements ProviderEventValidator {
  validate(event: ProviderUsageEvent): ProviderUsageEvent {
    if (!event || typeof event !== "object") throw new Error("Invalid provider event");
    const required = ["eventId", "occurredAt", "simId"] as const;
    for (const key of required) {
      const value = event[key];
      if (typeof value !== "string" || value.length === 0) throw new Error(`Provider event missing ${key}`);
    }
    if (Number.isNaN(Date.parse(event.occurredAt))) throw new Error("Provider event occurredAt is invalid");
    return event;
  }
}

export function dedupeProviderEventIds(seen: Set<string>, event: ProviderUsageEvent): boolean {
  if (seen.has(event.eventId)) return false;
  seen.add(event.eventId);
  return true;
}
