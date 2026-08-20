const config = window.AURAMAX_CONFIG || {};
const form = document.querySelector('#account-form');
const title = document.querySelector('#account-title');
const intro = document.querySelector('.intro');
const emailField = document.querySelector('#email-field');
const passwordField = document.querySelector('#password-field');
const confirmField = document.querySelector('#confirm-field');
const status = document.querySelector('#account-status');
const submit = document.querySelector('#submit-button');
const back = document.querySelector('#back-to-signin');
let mode = new URLSearchParams(location.search).get('mode') === 'recovery' ? 'update' : 'signin';
let client;

const setStatus = (message = '', kind = '') => { status.textContent = message; status.dataset.kind = kind; };
const dashboardUrl = () => `${location.origin}${location.pathname.replace(/account\.html$/, '')}?account=1`;
const recoveryUrl = () => `${location.origin}${location.pathname}?mode=recovery`;

function render() {
  const signup = mode === 'signup'; const recovery = mode === 'recovery'; const update = mode === 'update';
  title.textContent = signup ? 'Create your AuraMax account' : recovery ? 'Reset your password' : update ? 'Choose a new password' : 'Sign in to AuraMax';
  intro.textContent = signup ? 'Use your email and a secure password. We will email a confirmation link.' : recovery ? 'We will email you a secure link to choose a new password.' : update ? 'Enter and confirm a new password to finish recovery.' : 'Save your lessons and LookBook ideas, then continue where you left off.';
  emailField.hidden = update; passwordField.hidden = recovery; confirmField.hidden = !(signup || update);
  submit.textContent = signup ? 'Create account' : recovery ? 'Send reset link' : update ? 'Update password' : 'Sign in'; back.hidden = mode === 'signin'; setStatus();
}

async function init() {
  if (!config.supabaseUrl || !config.supabasePublishableKey) { setStatus('Account service configuration is missing. Please contact AuraMax support.', 'error'); submit.disabled = true; return; }
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    client = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    client.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') { mode = 'update'; render(); } });
    const { data: { session } } = await client.auth.getSession();
    if (session && mode === 'signin') location.replace(dashboardUrl());
  } catch { setStatus('Unable to start the account service. Check your connection and reload.', 'error'); submit.disabled = true; }
}

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; render(); }));
back.addEventListener('click', () => { mode = 'signin'; render(); });
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!client) return setStatus('The account service is still loading. Please try again in a moment.', 'error');
  const data = new FormData(form); const email = String(data.get('email') || '').trim(); const password = String(data.get('password') || ''); const confirmation = String(data.get('confirmPassword') || '');
  if (mode !== 'update' && !/^\S+@\S+\.\S+$/.test(email)) return setStatus('Enter a valid email address.', 'error');
  if (mode !== 'recovery' && password.length < 8) return setStatus('Use a password with at least 8 characters.', 'error');
  if ((mode === 'signup' || mode === 'update') && password !== confirmation) return setStatus('The passwords do not match.', 'error');
  submit.disabled = true; setStatus('Connecting securely…');
  try {
    let error;
    if (mode === 'signup') ({ error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: dashboardUrl() } }));
    else if (mode === 'recovery') ({ error } = await client.auth.resetPasswordForEmail(email, { redirectTo: recoveryUrl() }));
    else if (mode === 'update') ({ error } = await client.auth.updateUser({ password }));
    else ({ error } = await client.auth.signInWithPassword({ email, password }));
    if (error) throw error;
    if (mode === 'signup') { mode = 'signin'; render(); setStatus('Check your email to confirm your account, then return here to sign in.', 'success'); }
    else if (mode === 'recovery') setStatus('Reset link sent. Open it from your email to choose a new password.', 'success');
    else if (mode === 'update') { setStatus('Password updated. Opening your dashboard…', 'success'); setTimeout(() => location.replace(dashboardUrl()), 700); }
    else location.replace(dashboardUrl());
  } catch (error) { setStatus(error?.message || 'We could not complete that request. Please try again.', 'error'); }
  finally { submit.disabled = false; }
});

render();
init();
