import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "https://www.didarahmad.com", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
function getServiceKey() { const raw = Deno.env.get("SUPABASE_SECRET_KEYS"); try { const keys = raw ? JSON.parse(raw) : {}; return keys.service_role ?? keys.service_role_key ?? keys.secret ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY"); } catch { return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY"); } }
async function hmac(value: string, secret: string) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, "0")).join(""); }

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authorization = request.headers.get("Authorization"); const url = Deno.env.get("SUPABASE_URL"); const serviceKey = getServiceKey(); const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!authorization || !url || !serviceKey || !secret) return json({ error: "Payment configuration is incomplete." }, 500);
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user } } = await admin.auth.getUser(authorization.replace(/^Bearer\s+/i, ""));
  if (!user) return json({ error: "Please sign in before verifying payment." }, 401);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return json({ error: "Incomplete payment result." }, 400);
  if (await hmac(`${razorpay_order_id}|${razorpay_payment_id}`, secret) !== razorpay_signature) return json({ error: "Payment signature could not be verified." }, 400);
  const { data: order, error: orderError } = await admin.from("auramax_payment_orders").select("*").eq("razorpay_order_id", razorpay_order_id).eq("user_id", user.id).maybeSingle();
  if (orderError || !order) return json({ error: "We could not find this payment order." }, 404);
  if (order.status === "paid") {
    const { data: access } = await admin.from("auramax_premium_access").select("ends_at").eq("user_id", user.id).maybeSingle();
    return json({ success: true, endsAt: access?.ends_at });
  }
  const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, { headers: { Authorization: `Basic ${btoa(`${Deno.env.get("RAZORPAY_KEY_ID")}:${secret}`)}` } });
  const payment = await paymentResponse.json();
  if (!paymentResponse.ok || payment.status !== "captured" || payment.order_id !== razorpay_order_id || payment.amount !== order.amount) return json({ error: "Payment is not captured yet. Please wait a moment and try again." }, 409);
  const now = new Date(); const { data: current } = await admin.from("auramax_premium_access").select("ends_at").eq("user_id", user.id).maybeSingle();
  const startingAt = current?.ends_at && new Date(current.ends_at) > now ? new Date(current.ends_at) : now;
  const endsAt = new Date(startingAt.getTime() + order.access_days * 86400000).toISOString();
  await admin.from("auramax_payment_orders").update({ status: "paid", razorpay_payment_id, paid_at: now.toISOString() }).eq("id", order.id);
  const { error: accessError } = await admin.from("auramax_premium_access").upsert({ user_id: user.id, plan_code: order.plan_code, starts_at: now.toISOString(), ends_at: endsAt, updated_at: now.toISOString() });
  if (accessError) return json({ error: "Payment was confirmed but access could not be saved. Please contact support." }, 500);
  return json({ success: true, endsAt });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/auramax-verify-payment' \
    --header 'apiKey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH' \
    --header 'Authorization: Bearer <UserToken>'
*/
