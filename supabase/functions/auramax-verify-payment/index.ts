// Self-contained Edge Function: avoids third-party module boot failures.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

function serviceKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) try {
    const keys: Record<string, unknown> = JSON.parse(raw);
    for (const value of Object.values(keys)) if (typeof value === "string" && value.startsWith("sb_secret_")) return value;
  } catch { /* use legacy secret */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY");
}

async function supabase(url: string, key: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers); headers.set("apikey", key);
  if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${key}`);
  return fetch(`${url}${path}`, { ...init, headers });
}
async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function sameSignature(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0; for (let i = 0; i < left.length; i += 1) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}
async function readRows(url: string, key: string, path: string) {
  const response = await supabase(url, key, path); const value = await response.json().catch(() => []);
  return { response, rows: Array.isArray(value) ? value : [] };
}
async function grantAccess(url: string, key: string, order: Record<string, any>, paymentId: string) {
  const now = new Date();
  const access = await readRows(url, key, `/rest/v1/auramax_premium_access?user_id=eq.${order.user_id}&select=ends_at&limit=1`);
  const currentEnd = access.rows[0]?.ends_at ? new Date(access.rows[0].ends_at) : null;
  const beginning = currentEnd && currentEnd > now ? currentEnd : now;
  const endsAt = new Date(beginning.getTime() + Number(order.access_days || 30) * 86400000).toISOString();
  const savedAccess = await supabase(url, key, "/rest/v1/auramax_premium_access?on_conflict=user_id", {
    method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: order.user_id, plan_code: order.plan_code, starts_at: now.toISOString(), ends_at: endsAt, updated_at: now.toISOString() }),
  });
  if (!savedAccess.ok) throw new Error("access_save_failed");
  const savedOrder = await supabase(url, key, `/rest/v1/auramax_payment_orders?id=eq.${order.id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status: "paid", razorpay_payment_id: paymentId, paid_at: now.toISOString() }),
  });
  if (!savedOrder.ok) throw new Error("order_save_failed");
  return endsAt;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL"), key = serviceKey();
  const userToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const keyId = Deno.env.get("RAZORPAY_KEY_ID"), secret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!url || !key || !userToken || !keyId || !secret) return json({ error: "Payment configuration is incomplete." }, 500);
  const userResponse = await supabase(url, key, "/auth/v1/user", { headers: { Authorization: `Bearer ${userToken}` } });
  const user = await userResponse.json().catch(() => null);
  if (!userResponse.ok || !user?.id) return json({ error: "Please sign in before verifying payment." }, 401);
  const result = await request.json().catch(() => ({}));
  const orderId = String(result.razorpay_order_id || ""), paymentId = String(result.razorpay_payment_id || ""), signature = String(result.razorpay_signature || "");
  if (!orderId || !paymentId || !signature) return json({ error: "Incomplete payment result." }, 400);
  if (!sameSignature(await hmac(`${orderId}|${paymentId}`, secret), signature)) return json({ error: "Payment signature could not be verified." }, 400);
  const found = await readRows(url, key, `/rest/v1/auramax_payment_orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&user_id=eq.${user.id}&select=*&limit=1`);
  const order = found.rows[0];
  if (!found.response.ok || !order) return json({ error: "We could not find this payment order." }, 404);
  if (order.status === "paid") {
    const access = await readRows(url, key, `/rest/v1/auramax_premium_access?user_id=eq.${user.id}&select=ends_at&limit=1`);
    return json({ success: true, endsAt: access.rows[0]?.ends_at });
  }
  const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Basic ${btoa(`${keyId}:${secret}`)}` } });
  const payment = await paymentResponse.json().catch(() => null);
  if (!paymentResponse.ok || payment?.status !== "captured" || payment?.order_id !== orderId || Number(payment?.amount) !== Number(order.amount) || payment?.currency !== order.currency) {
    return json({ error: "Payment is not captured yet. Please wait a moment and try again." }, 409);
  }
  try { return json({ success: true, endsAt: await grantAccess(url, key, order, paymentId) }); }
  catch { return json({ error: "Payment was confirmed but access could not be saved. Please contact support." }, 500); }
});
