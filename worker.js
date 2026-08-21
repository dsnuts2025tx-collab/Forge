const json = (data, status = 200, extra = {}) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extra
    }
  });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export class ForgeState {
  constructor(state) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "GET" && url.pathname === "/state") {
      const snapshot = (await this.storage.get("snapshot")) || {
        version: 1,
        projects: [],
        updatedAt: null
      };
      return json({ ok: true, snapshot }, 200, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/state") {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return json({ ok: false, error: "Invalid state payload" }, 400, corsHeaders);
      }

      const snapshot = {
        version: 1,
        projects: Array.isArray(body.projects) ? body.projects : [],
        updatedAt: new Date().toISOString()
      };

      await this.storage.put("snapshot", snapshot);
      return json({ ok: true, snapshot }, 200, corsHeaders);
    }

    return json({ ok: false, error: "Not found" }, 404, corsHeaders);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "forge",
        engine: "6.0.0-PLATINUM",
        mode: "production",
        architecture: "native-no-d1-no-r2-durable-state"
      });
    }

    if (url.pathname === "/api/status") {
      return json({
        ok: true,
        forge: "Forge Engine 6.0.0-PLATINUM",
        production: true,
        build: true,
        preview: true,
        projects: true,
        export: true,
        deployment: true,
        durableState: !!env.FORGE_STATE
      });
    }

    if (url.pathname === "/api") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405, corsHeaders);
      }

      const body = await request.json().catch(() => null);
      const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
      const provider = body?.provider || "openrouter";

      if (!prompt) {
        return json({ ok: false, error: "Missing prompt" }, 400, corsHeaders);
      }

      if (provider !== "openrouter") {
        return json({ ok: false, error: "Unsupported provider" }, 400, corsHeaders);
      }

      if (!env.OPENROUTER_API_KEY) {
        return json({
          ok: false,
          error: "Forge AI is not configured yet. Set OPENROUTER_API_KEY as a Worker secret."
        }, 503, corsHeaders);
      }

      const ai = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://forgeii.pages.dev",
          "X-Title": "Forge AI"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          temperature: 0.7,
          max_tokens: 2000,
          messages: [
            {
              role: "system",
              content: `You are Forge AI.
Return ONLY valid JSON.
{
  "projectName":"",
  "description":"",
  "files":[
    {"path":"","content":""}
  ]
}`
            },
            { role: "user", content: prompt }
          ]
        })
      });

      const text = await ai.text();
      return new Response(text, {
        status: ai.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    if (url.pathname.startsWith("/api/state/")) {
      if (!env.FORGE_STATE) {
        return json({ ok: false, error: "Durable state binding is unavailable" }, 503);
      }

      const key = url.pathname.slice("/api/state/".length) || "default";
      const id = env.FORGE_STATE.idFromName(key);
      const stub = env.FORGE_STATE.get(id);
      const forwarded = new URL(request.url);
      forwarded.pathname = url.pathname.replace("/api/state/", "/state");
      return stub.fetch(new Request(forwarded, request));
    }

    const asset = await env.ASSETS?.fetch(request);
    if (asset) return asset;

    return new Response("Forge Engine 6.0.0-PLATINUM", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
