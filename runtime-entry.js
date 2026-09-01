import app, { ForgeState } from "./worker.js";

export { ForgeState };

const noStore = { "Cache-Control": "no-store" };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return app.fetch(request, env, ctx);

    if (url.pathname === "/ready") {
      const durableState = !!env.FORGE_STATE;
      const ready = durableState;
      return Response.json(
        {
          ok: ready,
          service: "forge",
          engine: "6.0.0-PLATINUM",
          ready,
          dependencies: { durableState },
        },
        { status: ready ? 200 : 503, headers: noStore },
      );
    }

    if (url.pathname === "/release") {
      try {
        const asset = await env.ASSETS?.fetch(new Request(new URL("/RELEASE.json", url)));
        if (!asset?.ok) {
          return Response.json(
            { ok: false, error: "Release manifest unavailable" },
            { status: 503, headers: noStore },
          );
        }
        const release = await asset.json();
        return Response.json({ ok: true, ...release }, { status: 200, headers: noStore });
      } catch (error) {
        return Response.json(
          { ok: false, error: `Release manifest failed: ${error?.message || "unknown error"}` },
          { status: 503, headers: noStore },
        );
      }
    }

    return app.fetch(request, env, ctx);
  },
};
