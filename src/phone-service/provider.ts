import type { ProviderUsageEvent } from "./mvp.js";

export interface CellularProvider {
  readonly name: string;
  getSimStatus(simId: string): Promise<SimStatus>;
  resetConnectivity(simId: string): Promise<void>;
  streamUsage(onEvent: (event: ProviderUsageEvent) => Promise<void>): Promise<void>;
}

export interface SimStatus {
  simId: string;
  deviceId: string | null;
  status: "active" | "suspended" | "unknown";
  operatorId: string | null;
  radioAccessTechnology: string | null;
  observedAt: string;
}

export interface SatelliteAdapter {
  readonly name: string;
  getCapability(): Promise<SatelliteCapability>;
  getStatus(): Promise<SatelliteStatus>;
}

export interface SatelliteCapability {
  supported: boolean;
  entitled: boolean;
  agreementVerified: boolean;
  deviceModel: string;
  apiLevel: number;
}

export interface SatelliteStatus {
  connected: boolean;
  observedAt: string;
}

export interface FundingProvider {
  getPosition(currency: string): Promise<{
    availableMinor: number;
    reservedMinor: number;
  }>;
}

/**
 * Provider implementations must be injected at runtime.
 * No credentials, carrier account identifiers, or provider claims belong here.
 */
export interface PhoneServiceProviders {
  cellular: CellularProvider;
  satellite?: SatelliteAdapter;
  funding: FundingProvider;
}
