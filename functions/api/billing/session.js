const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

const encode = (value) => btoa(String.fromCharCode(...new TextEncoder().encode(value)))
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const sign = async (value, secret) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export async function onRequest(context) {
  if (context.request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const secret = context.env.STRIPE_SECRET_KEY;
  const sessionSecret = context.env.FORGE_SESSION_SECRET;
  const sessionId = new URL(context.request.url).searchParams.get("session_id");

  if (!secret || !sessionSecret) return json({ error: "Forge billing session signing is not configured" }, 503);
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json({ error: "Invalid checkout session" }, 400);

  const stripeResponse = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,
    { headers: { Authorization: `Bearer ${secret}` } }
  );
  const text = await stripeResponse.text();
  let session;
  try { session = JSON.parse(text); } catch { session = null; }

  const subscription = session?.subscription;
  if (!stripeResponse.ok || session?.status !== "complete" || !subscription?.id) {
    return json({ error: "Checkout session is not complete or does not contain an active subscription" }, 403);
  }

  const activeStates = new Set(["trialing", "active"]);
  if (!activeStates.has(subscription.status)) {
    return json({ error: "Subscription is not entitled to Forge access" }, 403);
  }

  const exp = Math.floor(Date.now() / 1000) + 900;
  const payload = encode(JSON.stringify({
    product: "forge",
    customer_id: session.customer,
    subscription_id: subscription.id,
    email: session.customer_details?.email || session.customer_email || null,
    exp
  }));
  const signature = await sign(payload, sessionSecret);

  return json({ token: `${payload}.${signature}` });
}
