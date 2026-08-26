import type { CellularProvider, SimStatus } from "./provider.js";
import type { ProviderUsageEvent } from "./mvp.js";

export interface CellularProviderHttpConfig {
  name: string;
  baseUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  simStatusPath: (simId: string) => string;
  connectivityResetPath: (simId: string) => string;
  usageStreamUrl: string;
  fetchImpl?: typeof fetch;
}

/**
 * Provider-neutral OAuth2 client-credentials transport.
 * Provider-specific paths and event normalization are injected at runtime.
 * Secrets are runtime inputs and are never persisted by this adapter.
 */
export class HttpCellularProvider implements CellularProvider {
  readonly name: string;
  private readonly fetchImpl: typeof fetch;
  private readonly config: CellularProviderHttpConfig;
  private token: { value: string; expiresAt: number } | null = null;

  constructor(config: CellularProviderHttpConfig) {
    this.config = config;
    this.name = config.name;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async getSimStatus(simId: string): Promise<SimStatus> {
    const response = await this.request(this.config.simStatusPath(simId), { method: "GET" });
    const body = (await response.json()) as SimStatus;
    return body;
  }

  async resetConnectivity(simId: string): Promise<void> {
    await this.request(this.config.connectivityResetPath(simId), { method: "POST" });
  }

  async streamUsage(onEvent: (event: ProviderUsageEvent) => Promise<void>): Promise<void> {
    const response = await this.requestAbsolute(this.config.usageStreamUrl, { method: "GET" });
    if (!response.body) throw new Error("Usage stream response has no body");

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const payload = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
        if (!payload || payload === "[DONE]") continue;
        await onEvent(JSON.parse(payload) as ProviderUsageEvent);
      }
    }
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    return this.requestAbsolute(new URL(path, this.config.baseUrl).toString(), init);
  }

  private async requestAbsolute(url: string, init: RequestInit): Promise<Response> {
    const token = await this.accessToken();
    const response = await this.fetchImpl(url, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Cellular provider request failed: HTTP ${response.status}`);
    return response;
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;

    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString("base64");
    const response = await this.fetchImpl(this.config.tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: "grant_type=client_credentials",
    });
    if (!response.ok) throw new Error(`Cellular provider token request failed: HTTP ${response.status}`);

    const body = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) throw new Error("Cellular provider token response did not contain access_token");
    this.token = { value: body.access_token, expiresAt: Date.now() + Math.max(60, body.expires_in ?? 300) * 1000 };
    return body.access_token;
  }
}
