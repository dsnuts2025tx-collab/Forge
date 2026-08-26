import type { ProviderUsageEvent } from "./mvp.js";

export function validateProviderUsageEvent(value: unknown): ProviderUsageEvent {
  if (!value || typeof value !== "object") throw new Error("Provider usage event must be an object");
  const event = value as Record<string, unknown>;
  const requiredStrings = ["id", "provider", "simId", "deviceId", "observedAt"] as const;
  for (const key of requiredStrings) {
    if (typeof event[key] !== "string" || event[key].length === 0) {
      throw new Error(`Invalid provider usage event field: ${key}`);
    }
  }

  for (const key of ["dataBytes", "smsCount"] as const) {
    if (typeof event[key] !== "number" || !Number.isFinite(event[key]) || event[key] < 0) {
      throw new Error(`Invalid provider usage event field: ${key}`);
    }
  }

  if (event.providerCostMinor !== undefined &&
      (typeof event.providerCostMinor !== "number" || !Number.isFinite(event.providerCostMinor) || event.providerCostMinor < 0)) {
    throw new Error("Invalid provider usage event field: providerCostMinor");
  }

  if (event.currency !== undefined && typeof event.currency !== "string") {
    throw new Error("Invalid provider usage event field: currency");
  }

  if (event.authoritativeBillReference !== undefined && typeof event.authoritativeBillReference !== "string") {
    throw new Error("Invalid provider usage event field: authoritativeBillReference");
  }

  const parsedObservedAt = Date.parse(event.observedAt as string);
  if (!Number.isFinite(parsedObservedAt)) throw new Error("Invalid provider usage event field: observedAt");

  return value as ProviderUsageEvent;
}
