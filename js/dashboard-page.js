const config = window.AURAMAX_CONFIG || {};
const status = document.querySelector('#portal-status');
const setStatus = (message = '', kind = '') => { status.textContent = message; status.dataset.kind = kind; };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function renderStylePlan(profile) {
  const target = document.querySelector('#personal-style-plan');
  if (!target) return;
  if (!profile) return void (target.innerHTML = '<p>Complete your face, body and skin selections to generate your plan.</p>');
  if (!profile.skinTone) return void (target.innerHTML = '<p>Add your skin-depth guide to finish your personal recommendations.</p>');
  const plan = window.AuraMaxStylePlan?.createAndSave(profile);
  if (!plan) return;
  target.innerHTML = `<p><strong>${escapeHtml(plan.profile.skinTone)}</strong> colour guide</p><p>${plan.recommendedColours.slice(0, 3).map(escapeHtml).join(' · ')}</p><p><small>${escapeHtml(plan.outfitFormulas[0])}</small></p>`;
}

async function start() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const client = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    const { data: { session } } = await client.auth.getSession();
    if (!session) return location.replace('/account');
    document.querySelector('#welcome').textContent = `Signed in as ${session.user.email}`;
    document.querySelector('#sign-out').onclick = async () => { await client.auth.signOut(); location.replace('/account'); };

    const profile = JSON.parse(localStorage.getItem('auramax-web-profile') || 'null');
    document.querySelector('#guide-profile').textContent = profile ? `${profile.face} face · ${profile.body} body${profile.skinTone ? ` · ${profile.skinTone} skin guide` : ''}. Your guide is personalised on this device.` : 'No guide profile selected yet.';
    renderStylePlan(profile);
    const plan = window.AuraMaxStylePlan?.load();
    if (plan && profile) {
      const { error } = await client.from('auramax_personal_style_plans').upsert({ user_id: session.user.id, face_shape: profile.face || 'Not selected', body_type: profile.body || 'Not selected', skin_tone: profile.skinTone || 'Medium / wheatish', plan, updated_at: new Date().toISOString() });
      if (error) console.warn('Personal style plan sync is waiting for the database update.', error.message);
    }

    const localLessons = JSON.parse(localStorage.getItem('auramax-web-saved-lessons') || '[]');
    const { data: remoteLessons } = await client.from('auramax_saved_lessons').select('lesson_id,lesson_title').eq('user_id', session.user.id).order('created_at', { ascending: false });
    const lessonNames = [...(remoteLessons || []).map(item => item.lesson_title), ...localLessons].filter((item, index, values) => values.indexOf(item) === index);
    document.querySelector('#saved-lessons').innerHTML = lessonNames.length ? lessonNames.map(item => `<div class="saved-item">${escapeHtml(item)}</div>`).join('') : '<p>No saved lessons yet.</p>';

    const { data: savedGallery } = await client.from('auramax_saved_gallery_items').select('gallery_item_id,auramax_gallery_items(title,category)').eq('user_id', session.user.id);
    document.querySelector('#saved-gallery').innerHTML = savedGallery?.length ? savedGallery.map(item => `<div class="saved-item"><b>${escapeHtml(item.auramax_gallery_items?.title || 'Saved outfit')}</b><br><small>${escapeHtml(item.auramax_gallery_items?.category || 'LookBook')}</small></div>`).join('') : '<p>No saved LookBook ideas yet.</p>';
  } catch (error) {
    setStatus(error?.message || 'Unable to load your dashboard.', 'error');
  }
}

start();
