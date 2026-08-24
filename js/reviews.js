import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.AURAMAX_CONFIG || {};
const grid = document.querySelector('#reviews-grid');
const form = document.querySelector('#review-form');
const authMessage = document.querySelector('#review-auth-message');
const status = document.querySelector('#review-form-status');
const nameInput = document.querySelector('#review-name');
let client = null;
let signedInUser = null;

const safeText = (value = '') => String(value).replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);
const displayDate = value => new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(value));

function renderReviews(reviews) {
  if (!reviews.length) {
    grid.innerHTML = '<p class="reviews-empty">Be the first signed-in member to share an honest AuraMax review.</p>';
    return;
  }
  grid.innerHTML = reviews.map(review => `<article class="review-card"><span class="review-card-stars" aria-label="${review.rating} out of 5 stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span><p class="review-card-body">“${safeText(review.body)}”</p><footer class="review-card-footer"><strong class="review-card-name">${safeText(review.display_name)}</strong><span>${displayDate(review.created_at)}</span></footer></article>`).join('');
}

async function loadReviews() {
  if (!client) return;
  const { data, error } = await client.from('auramax_reviews').select('display_name,rating,body,created_at').eq('is_published', true).order('created_at', { ascending: false }).limit(6);
  if (error) {
    grid.innerHTML = '<p class="reviews-empty">Reviews will appear here once the review feature is enabled.</p>';
    return;
  }
  renderReviews(data || []);
}

function renderAuthState(user) {
  signedInUser = user || null;
  if (!user) {
    authMessage.hidden = false;
    form.hidden = true;
    authMessage.innerHTML = 'Please <a href="account.html">sign in or create an account</a> to publish a review.';
    return;
  }
  authMessage.hidden = true;
  form.hidden = false;
  const suggestedName = (user.user_metadata?.display_name || user.email?.split('@')[0] || '').replace(/[._-]+/g, ' ');
  if (!nameInput.value) nameInput.value = suggestedName.replace(/\b\w/g, letter => letter.toUpperCase());
}

async function submitReview(event) {
  event.preventDefault();
  if (!signedInUser || !client) return;
  const payload = {
    user_id: signedInUser.id,
    display_name: nameInput.value.trim(),
    rating: Number(document.querySelector('#review-rating').value),
    body: document.querySelector('#review-body').value.trim(),
  };
  status.className = 'review-form-status';
  status.textContent = 'Publishing your review…';
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  const { error } = await client.from('auramax_reviews').insert(payload);
  button.disabled = false;
  if (error) {
    status.className = 'review-form-status is-error';
    status.textContent = error.code === '23505' ? 'You have already shared a review. Thank you for your feedback.' : 'Your review could not be published. Please try again.';
    return;
  }
  status.className = 'review-form-status is-success';
  status.textContent = 'Thank you—your review is now public.';
  form.reset();
  renderAuthState(signedInUser);
  loadReviews();
}

async function init() {
  document.querySelectorAll('[data-review-scroll]').forEach(button => button.addEventListener('click', () => document.querySelector('#reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    grid.innerHTML = '<p class="reviews-empty">Reviews will be available shortly.</p>';
    return;
  }
  client = createClient(config.supabaseUrl, config.supabasePublishableKey);
  const { data } = await client.auth.getUser();
  renderAuthState(data.user);
  client.auth.onAuthStateChange((_event, session) => renderAuthState(session?.user));
  form?.addEventListener('submit', submitReview);
  loadReviews();
}

init();
