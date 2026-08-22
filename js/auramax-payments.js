import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.AURAMAX_CONFIG || {};
const apiBase = `${config.supabaseUrl}/functions/v1`;
let client = null;
let premium = false;

function getClient() {
  if (!client && config.supabaseUrl && config.supabasePublishableKey) {
    client = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  }
  return client;
}

async function refreshAccess() {
  const supabase = getClient();
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return (premium = false);
  const { data } = await supabase.from('auramax_premium_access').select('ends_at').eq('user_id', user.id).maybeSingle();
  premium = Boolean(data?.ends_at && new Date(data.ends_at) > new Date());
  return premium;
}

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true; script.onload = resolve; script.onerror = () => reject(new Error('Could not load secure checkout.'));
    document.head.append(script);
  });
}

async function invoke(name, body = {}) {
  const supabase = getClient();
  if (!supabase) throw new Error('Payments are not configured yet.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = 'account.html?mode=signin&next=personal-plan'; throw new Error('Please sign in first.'); }
  const response = await fetch(`${apiBase}/${name}`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: config.supabasePublishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

async function buyPersonalPlan(trigger) {
  if (trigger) { trigger.disabled = true; trigger.dataset.originalText = trigger.textContent; trigger.textContent = 'Preparing secure checkout…'; }
  try {
    const order = await invoke('auramax-create-order');
    await loadCheckout();
    const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: 'AuraMax', description: 'Personal Plan — 30 days', order_id: order.orderId, theme: { color: '#c69a52' }, handler: async result => {
      try {
        await invoke('auramax-verify-payment', result);
        await refreshAccess();
        alert('Payment confirmed. Your 30-day AuraMax Personal Plan is active.');
        window.AuraMax?.show?.('style-plan');
      } catch (error) {
        await refreshAccess().catch(() => false);
        alert(premium ? 'Payment confirmed. Your 30-day AuraMax Personal Plan is active.' : (error.message || 'Payment was received, but access is still being confirmed. Please refresh in a moment.'));
      } finally {
        if (trigger) { trigger.disabled = false; trigger.textContent = trigger.dataset.originalText || 'Unlock personal plan'; }
      }
    }, modal: { ondismiss: () => { if (trigger) { trigger.disabled = false; trigger.textContent = trigger.dataset.originalText || 'Unlock personal plan'; } } } });
    checkout.open();
  } catch (error) {
    if (trigger) { trigger.disabled = false; trigger.textContent = trigger.dataset.originalText || 'Unlock personal plan'; }
    alert(error.message || 'Could not start payment. Please try again.');
  }
}

// Register in the capture phase so the checkout handoff cannot be swallowed by
// the app's delegated navigation handlers.  This is deliberately scoped to
// payment buttons only; every other navigation control keeps its normal flow.
document.addEventListener('click', event => {
  const button = event.target.closest('[data-aura-purchase]');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  void buyPersonalPlan(button);
}, true);

window.AuraMaxPayments = { refreshAccess, isPremium: () => premium, buyPersonalPlan };
refreshAccess();
