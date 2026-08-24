const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

const decode = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return new TextDecoder().decode(Uint8Array.from(atob(normalized), (c) => c.charCodeAt(0)));
};

const sign = async (value, secret) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const bytes = Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)), (c) => c.charCodeAt(0));
  return { key, bytes };
};

export async function onRequest(context) {
  if (context.request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const secret = context.env.STRIPE_SECRET_KEY;
  const sessionSecret = context.env.FORGE_SESSION_SECRET;
  const auth = context.request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!secret || !sessionSecret) return json({ error: "Forge entitlement verification is not configured" }, 503);
  if (!token) return json({ entitlement: { active: false, reason: "missing_token" } }, 401);

  const parts = token.split(".");
  if (parts.length !== 2) return json({ entitlement: { active: false, reason: "invalid_token" } }, 401);

  let payload;
  try { payload = JSON.parse(decode(parts[0])); } catch { return json({ entitlement: { active: false, reason: "invalid_token" } }, 401); }
  if (payload.product !== "forge" || !payload.subscription_id || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    return json({ entitlement: { active: false, reason: "expired_or_invalid" } }, 401);
  }

  const { key, bytes } = await sign(parts[1], sessionSecret);
  const valid = await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(parts[0]));
  if (!valid) return json({ entitlement: { active: false, reason: "invalid_signature" } }, 401);

  const stripeResponse = await fetch(
    `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(payload.subscription_id)}`,
    { headers: { Authorization: `Bearer ${secret}` } }
  );
  const text = await stripeResponse.text();
  let subscription;
  try { subscription = JSON.parse(text); } catch { subscription = null; }

  if (!stripeResponse.ok || !subscription?.id) {
    return json({ error: "Unable to verify Forge subscription" }, 502);
  }

  const active = subscription.status === "active" || subscription.status === "trialing";
  return json({
    entitlement: {
      active,
      status: subscription.status,
      customer_id: payload.customer_id || null,
      subscription_id: subscription.id,
      email: payload.email || null,
      current_period_end: subscription.current_period_end || null
    }
  });
}
