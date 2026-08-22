// Self-contained Edge Function: avoids third-party module boot failures.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

function serviceKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys: Record<string, unknown> = JSON.parse(raw);
      for (const value of Object.values(keys)) {
        if (typeof value === "string" && value.startsWith("sb_secret_")) return value;
      }
    } catch { /* use legacy secret below */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY");
}

async function supabase(url: string, key: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${key}`);
  }
  return fetch(`${url}${path}`, { ...init, headers });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const key = serviceKey();
  const userToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!url || !key || !userToken || !razorpayKeyId || !razorpaySecret) {
    return json({ error: "Payment configuration is incomplete." }, 500);
  }

  const userResponse = await supabase(url, key, "/auth/v1/user", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const user = await userResponse.json().catch(() => null);
  if (!userResponse.ok || !user?.id) return json({ error: "Please sign in before buying access." }, 401);

  const amount = 19900;
  const receipt = `auramax_${String(user.id).replaceAll("-", "").slice(0, 18)}_${Date.now()}`;
  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpaySecret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt,
      notes: { user_id: user.id, plan_code: "personal_30_day", access_days: "30" },
    }),
  });
  const order = await razorpayResponse.json().catch(() => null);
  if (!razorpayResponse.ok || !order?.id) {
    return json({ error: "Razorpay could not create the order. Please try again." }, 502);
  }

  const insert = await supabase(url, key, "/rest/v1/auramax_payment_orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount,
      currency: "INR",
      plan_code: "personal_30_day",
      access_days: 30,
    }),
  });
  if (!insert.ok) return json({ error: "Could not prepare payment access." }, 500);

  return json({ orderId: order.id, amount, currency: "INR", keyId: razorpayKeyId, planName: "AuraMax Personal Plan" });
});
