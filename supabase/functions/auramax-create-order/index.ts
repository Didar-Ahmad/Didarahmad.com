import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "https://www.didarahmad.com", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

function getServiceKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw);
      return keys.service_role ?? keys.service_role_key ?? keys.secret;
    } catch { /* fall through to legacy runtime key */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authorization = request.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = getServiceKey();
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!authorization || !url || !serviceKey || !razorpayKeyId || !razorpaySecret) return json({ error: "Payment configuration is incomplete." }, 500);

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const token = authorization.replace(/^Bearer\s+/i, "");
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return json({ error: "Please sign in before buying access." }, 401);

  const amount = 19900; // ₹199.00, one-time 30-day access
  const receipt = `auramax_${user.id.replaceAll("-", "").slice(0, 18)}_${Date.now()}`;
  const basic = btoa(`${razorpayKeyId}:${razorpaySecret}`);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt, notes: { user_id: user.id, plan_code: "personal_30_day", access_days: "30" } })
  });
  const order = await response.json();
  if (!response.ok || !order.id) return json({ error: "Razorpay could not create the order. Please try again." }, 502);

  const { error: insertError } = await admin.from("auramax_payment_orders").insert({ user_id: user.id, razorpay_order_id: order.id, amount, currency: "INR", plan_code: "personal_30_day", access_days: 30 });
  if (insertError) return json({ error: "Could not prepare payment access." }, 500);
  return json({ orderId: order.id, amount, currency: "INR", keyId: razorpayKeyId, planName: "AuraMax Personal Plan" });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/auramax-create-order' \
    --header 'apiKey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH' \
    --header 'Authorization: Bearer <UserToken>'
*/
