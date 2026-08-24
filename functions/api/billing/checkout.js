const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (context.request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = context.env.STRIPE_SECRET_KEY;
  const priceId = context.env.FORGE_STRIPE_PRICE_ID;
  const origin = context.env.FORGE_APP_ORIGIN || new URL(context.request.url).origin;

  if (!secret || !priceId) {
    return json({
      error: "Forge billing is not configured: authoritative Forge recurring price and Stripe secret are required."
    }, 503);
  }

  let input;
  try {
    input = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const email = typeof input?.email === "string" ? input.email.trim() : "";
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return json({ error: "A valid email address is required" }, 400);
  }

  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    customer_email: email,
    success_url: `${origin}/billing.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing.html?cancelled=1`,
    "subscription_data[metadata][product]": "forge",
    "subscription_data[metadata][customer_email]": email
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = null; }

  if (!response.ok || !data?.url || !data?.id) {
    return json({ error: data?.error?.message || "Stripe Checkout could not be created" }, 502);
  }

  return json({ url: data.url, session_id: data.id });
}
