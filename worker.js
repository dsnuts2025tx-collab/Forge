export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "forge",
        engine: "6.0.0-PLATINUM",
        mode: "production",
        architecture: "native-no-d1-no-r2-durable-state-ready"
      });
    }

    if (url.pathname === "/api/status") {
      return Response.json({
        ok: true,
        forge: "Forge Engine 6.0.0-PLATINUM",
        production: true,
        build: true,
        preview: true,
        projects: true,
        export: true,
        deployment: true
      });
    }

    const asset = await env.ASSETS?.fetch(request);
    if (asset) return asset;

    return new Response("Forge Engine 6.0.0-PLATINUM", {
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
