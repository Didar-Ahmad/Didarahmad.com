// Self-contained webhook receiver: avoids third-party module boot failures.
function serviceKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) try {
    const keys: Record<string, unknown> = JSON.parse(raw);
    for (const value of Object.values(keys)) if (typeof value === "string" && value.startsWith("sb_secret_")) return value;
  } catch { /* use legacy secret */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY");
}
async function supabase(url: string, key: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers); headers.set("apikey", key); headers.set("Authorization", `Bearer ${key}`);
  return fetch(`${url}${path}`, { ...init, headers });
}
async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function sameSignature(left: string, right: string) {
  if (left.length !== right.length) return false; let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i); return mismatch === 0;
}
async function rows(url: string, key: string, path: string) {
  const response = await supabase(url, key, path); const value = await response.json().catch(() => []); return Array.isArray(value) ? value : [];
}
async function markPaid(url: string, key: string, order: Record<string, any>, paymentId: string) {
  if (order.status === "paid") return;
  const now = new Date(), current = await rows(url, key, `/rest/v1/auramax_premium_access?user_id=eq.${order.user_id}&select=ends_at&limit=1`);
  const currentEnd = current[0]?.ends_at ? new Date(current[0].ends_at) : null, beginning = currentEnd && currentEnd > now ? currentEnd : now;
  const endsAt = new Date(beginning.getTime() + Number(order.access_days || 30) * 86400000).toISOString();
  const access = await supabase(url, key, "/rest/v1/auramax_premium_access?on_conflict=user_id", {
    method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: order.user_id, plan_code: order.plan_code, starts_at: now.toISOString(), ends_at: endsAt, updated_at: now.toISOString() }),
  });
  if (!access.ok) throw new Error("access_save_failed");
  const saved = await supabase(url, key, `/rest/v1/auramax_payment_orders?id=eq.${order.id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status: "paid", razorpay_payment_id: paymentId, paid_at: now.toISOString() }),
  });
  if (!saved.ok) throw new Error("order_save_failed");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET"), url = Deno.env.get("SUPABASE_URL"), key = serviceKey();
  const signature = request.headers.get("x-razorpay-signature") || "", raw = await request.text();
  if (!secret || !url || !key || !signature) return new Response("Unauthorized", { status: 401 });
  if (!sameSignature(await hmac(raw, secret), signature)) return new Response("Invalid signature", { status: 400 });
  const event = JSON.parse(raw), payment = event?.payload?.payment?.entity;
  const orderId = payment?.order_id || event?.payload?.order?.entity?.id;
  if (!orderId) return Response.json({ received: true });
  const order = (await rows(url, key, `/rest/v1/auramax_payment_orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`))[0];
  if (!order) return Response.json({ received: true });
  if (event.event === "payment.failed") {
    await supabase(url, key, `/rest/v1/auramax_payment_orders?id=eq.${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "failed" }) });
    return Response.json({ received: true });
  }
  const captured = payment?.status === "captured" && Number(payment?.amount) === Number(order.amount) && payment?.currency === order.currency;
  if ((event.event === "payment.captured" || event.event === "order.paid") && captured) await markPaid(url, key, order, payment.id);
  return Response.json({ received: true });
});
