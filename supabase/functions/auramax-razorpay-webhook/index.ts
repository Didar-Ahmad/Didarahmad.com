import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getServiceKey() { const raw = Deno.env.get("SUPABASE_SECRET_KEYS"); try { const keys = raw ? JSON.parse(raw) : {}; return keys.service_role ?? keys.service_role_key ?? keys.secret ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY"); } catch { return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY"); } }
async function hmac(value: string, secret: string) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, "0")).join(""); }

Deno.serve(async request => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET"); const url = Deno.env.get("SUPABASE_URL"); const serviceKey = getServiceKey();
  const raw = await request.text();
  if (!secret || !url || !serviceKey || !request.headers.get("x-razorpay-signature")) return new Response("Unauthorized", { status: 401 });
  if (await hmac(raw, secret) !== request.headers.get("x-razorpay-signature")) return new Response("Invalid signature", { status: 400 });
  const event = JSON.parse(raw); const payment = event?.payload?.payment?.entity;
  if (!payment?.order_id) return Response.json({ received: true });
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: order } = await admin.from("auramax_payment_orders").select("*").eq("razorpay_order_id", payment.order_id).maybeSingle();
  if (!order) return Response.json({ received: true });
  if (order.status === "paid") return Response.json({ received: true });
  if (event.event === "payment.failed") { await admin.from("auramax_payment_orders").update({ status: "failed" }).eq("id", order.id); return Response.json({ received: true }); }
  if (event.event !== "payment.captured" || payment.status !== "captured" || payment.amount !== order.amount) return Response.json({ received: true });
  const now = new Date(); const { data: current } = await admin.from("auramax_premium_access").select("ends_at").eq("user_id", order.user_id).maybeSingle();
  const beginning = current?.ends_at && new Date(current.ends_at) > now ? new Date(current.ends_at) : now;
  const endsAt = new Date(beginning.getTime() + order.access_days * 86400000).toISOString();
  await admin.from("auramax_payment_orders").update({ status: "paid", razorpay_payment_id: payment.id, paid_at: now.toISOString() }).eq("id", order.id);
  await admin.from("auramax_premium_access").upsert({ user_id: order.user_id, plan_code: order.plan_code, starts_at: now.toISOString(), ends_at: endsAt, updated_at: now.toISOString() });
  return Response.json({ received: true });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/auramax-razorpay-webhook' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
