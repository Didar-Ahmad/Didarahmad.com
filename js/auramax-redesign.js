import { supabaseClient } from './supabase-client.js';

const appRoot = document.querySelector('#view-root');
const config = window.AURAMAX_CONFIG || {};
const profileStore = 'auramax-web-profile';
const galleryStore = 'auramax-lookbook-gallery';
const galleryFallback = [
  { id: 'summer-fits', category: 'Summer Fits', title: 'Light layers for warm days', description: 'Build around breathable fabrics, relaxed proportions and clean footwear that works in the heat.', image_url: '' },
  { id: 'formal', category: 'Formal', title: 'Formal, without feeling overdone', description: 'Use a sharp fit, quiet colour contrast and polished shoes to keep the outfit intentional.', image_url: '' },
  { id: 'denims', category: 'Denims', title: 'A dependable denim formula', description: 'Pair well-fitting denim with a controlled silhouette, simple layers and one clear focal point.', image_url: '' },
  { id: 'tee', category: 'Tee', title: 'Make a simple tee look considered', description: 'Use fit, fabric weight and better trousers or footwear to elevate an everyday base layer.', image_url: '' },
  { id: 'luxury-casual', category: 'Luxury Casual', title: 'Luxury casual, made practical', description: 'Focus on clean layers, soft neutrals and pieces that fit well rather than visible labels.', image_url: '' },
  { id: 'old-money', category: 'Old Money', title: 'Classic style with a modern fit', description: 'Choose restrained colours, texture and timeless proportions without turning the look into a costume.', image_url: '' },
  { id: 'top-picks', category: 'Top Picks', title: 'A versatile outfit worth repeating', description: 'A balanced, adaptable look selected as a strong starting point for everyday style.', image_url: '' },
];
let galleryItems = [];
let galleryClient = null;
let activeLookbookCategory = 'All';
let activeLookbookArticleId = null;
let activeGuideChapterId = null;
let activeGuideLessonIndex = null;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const displayCategory = value => String(value || '').replace(/^Color Combination$/i, 'Colour Combination');
const currentProfile = () => JSON.parse(localStorage.getItem(profileStore) || 'null');
const activeGallery = () => galleryItems.length ? galleryItems : JSON.parse(localStorage.getItem(galleryStore) || 'null') || galleryFallback;
const imageMarkup = item => item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : `<div class="lookbook-image-placeholder"><span>${escapeHtml(item.category)}</span><strong>Image coming soon</strong></div>`;
const categoryItems = category => activeGallery().filter(item => item.category === category);
const learnGalleryMarkup = category => {
  const items = categoryItems(category);
  if (!items.length) return '';
  return `<section class="learn-gallery"><div class="learn-gallery-head"><div><p class="eyebrow">VIEW &amp; LEARN GALLERY</p><h3>Visual guides for ${escapeHtml(displayCategory(category))}</h3></div><span>${items.length} guide${items.length === 1 ? '' : 's'}</span></div><div class="learn-gallery-grid">${items.map(item => `<article class="learn-card">${imageMarkup(item)}<div class="learn-card-copy"><small>${escapeHtml(displayCategory(item.category))}</small><h3>${escapeHtml(item.title)}</h3><button type="button" class="learn-open" data-learn-item="${escapeHtml(item.id)}">View &amp; learn <span>→</span></button></div></article>`).join('')}</div></section>`;
};
const appendCategoryGallery = category => appRoot.insertAdjacentHTML('beforeend', learnGalleryMarkup(category));

function openLearnViewer(itemId) {
  const item = activeGallery().find(entry => String(entry.id) === String(itemId));
  if (!item) return;
  closeLearnViewer();
  const viewer = document.createElement('div');
  viewer.className = 'learn-viewer';
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', item.title || 'Visual guide');
  viewer.innerHTML = `<button type="button" class="learn-viewer-backdrop" data-close-learn aria-label="Close visual guide"></button><article class="learn-viewer-article"><button type="button" class="learn-viewer-close" data-close-learn aria-label="Close visual guide">×</button><div class="learn-viewer-media">${imageMarkup(item)}</div><div class="learn-viewer-copy"><p class="eyebrow">${escapeHtml(item.category)}</p><h2>${escapeHtml(item.title)}</h2><div class="learn-viewer-rule"></div><p class="learn-viewer-description">${escapeHtml(item.description)}</p></div></article>`;
  document.body.appendChild(viewer);
  document.body.classList.add('learn-viewer-open');
  viewer.querySelector('.learn-viewer-close')?.focus();
}

function closeLearnViewer() {
  document.querySelector('.learn-viewer')?.remove();
  document.body.classList.remove('learn-viewer-open');
}

async function connectGallery() {
  if (!config.supabaseUrl || !config.supabasePublishableKey) return;
  try {
    galleryClient = supabaseClient;
    if (!galleryClient) return;
    const { data, error } = await galleryClient.from('auramax_gallery_items').select('*').eq('is_published', true).order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      galleryItems = data;
      // Do not replace the account/sign-in screen when this background request finishes.
      if (appRoot.dataset.auraView !== 'account') renderCurrentView();
    }
  } catch (error) { console.warn('Gallery data is using local preview mode.', error); }
}
function backButton() { return '<button class="text-link back" data-aura-view="hub"><span aria-hidden="true">←</span> Back to all categories</button>'; }
function renderHub() {
  const visuals = {
    colours: '<div class="aura-card-visual visual-colours" aria-hidden="true"><i></i><i></i><i></i><i></i><b>Palette</b></div>',
    lookbook: '<div class="aura-card-visual visual-lookbook" aria-hidden="true"><img src="assets/lookbook-category-card.png" alt=""><span></span><b>LookBook</b></div>',
    quick: '<div class="aura-card-visual visual-quick" aria-hidden="true"><i>✦</i><i>↗</i><i>+</i><b>Daily details</b></div>',
    qa: '<div class="aura-card-visual visual-qa" aria-hidden="true"><i>?</i><i>!</i><i>✓</i><b>Clear answers</b></div>',
    guide: '<div class="aura-card-visual visual-guide" aria-hidden="true"><img src="assets/complete-guide-category-card.png" alt=""><span></span><b>Complete Guide</b></div>'
  };
  const hasProfile = Boolean(currentProfile());
  const hasPlan = Boolean(window.AuraMaxStylePlan?.load());
  const transformation = window.AuraMaxTransformationPlan?.load() || { completedDays: [] };
  const completed = transformation.completedDays?.length || 0;
  const percent = window.AuraMaxTransformationPlan?.percentage(transformation) || 0;
  appRoot.innerHTML = `<section class="auramax-intro"><p class="eyebrow">YOUR PERSONALISED LOOKBOOK</p><h2>Build your style, one practical choice at a time.</h2><p>${hasProfile ? 'Your saved profile can now power a clear style plan and every guide below.' : 'Start with a category, then personalise your guide whenever you want.'}</p></section><section class="transformation-banner"><div><p class="eyebrow">PREMIUM 30-DAY TRANSFORMATION PLAN</p><h3>One clear action every day. A routine you can keep.</h3><p>A healthy, practical month of grooming, style, movement, posture and wardrobe resets—built to create confidence through consistency.</p><div class="transformation-banner-progress"><span>${completed}/30 days complete</span><div><i style="width:${percent}%"></i></div><strong>${percent}%</strong></div></div><button type="button" data-aura-view="transformation">${completed ? 'Continue my 30-day plan →' : 'Start the 30-day plan →'}</button></section><section class="style-plan-banner"><div><p class="eyebrow">PERSONAL STYLE PLAN</p><h3>${hasPlan ? 'Your personalised recommendations are ready.' : 'Turn your selections into a practical personal plan.'}</h3><p>Get recommended colours, easy outfit formulas, grooming priorities and a short avoid list based on your face, body and skin selections.</p></div><button type="button" data-aura-view="style-plan">${hasPlan ? 'Open my plan →' : 'Build my plan →'}</button></section><section class="auramax-category-grid" aria-label="AuraMax categories"><button class="aura-category tone-gold" data-aura-view="colours">${visuals.colours}<span>01</span><h3>Color Combination</h3><p>Learn simple outfit colour formulas and see what pieces work together.</p><b>Explore colour ideas →</b></button><button class="aura-category tone-blue" data-aura-view="lookbook">${visuals.lookbook}<span>02</span><h3>Styling Guide · LookBook</h3><p>Browse real outfit inspiration with the details that make each look work.</p><b>Open the gallery →</b></button><button class="aura-category tone-green" data-aura-view="quick">${visuals.quick}<span>03</span><h3>Quick Looksmax Tips</h3><p>Fast, useful techniques for grooming, hair, skin, posture and presence.</p><b>Get quick tips →</b></button><button class="aura-category tone-red" data-aura-view="qa">${visuals.qa}<span>04</span><h3>Looksmax Q&amp;A Advanced</h3><p>Search clear answers, techniques and common mistakes without the noise.</p><b>Ask a question →</b></button><button class="aura-category tone-purple" data-aura-view="guide">${visuals.guide}<span>05</span><h3>Looksmax Complete Guide</h3><p>Go deeper with practical chapters on grooming, health, style and confidence.</p><b>Read the full guide →</b></button></section>`;
}
function renderTransformationPlan() {
  const planner = window.AuraMaxTransformationPlan;
  if (!planner) return;
  const progress = planner.load();
  const complete = new Set(progress.completedDays);
  const percent = planner.percentage(progress);
  const currentDay = planner.days.find(item => !complete.has(item.day))?.day || 30;
  const themes = ['Reset', 'Grooming', 'Posture', 'Fitness', 'Wardrobe', 'Confidence', 'Wellbeing'];
  appRoot.innerHTML = `${backButton()}<article class="transformation-shell"><header class="transformation-header"><div><p class="eyebrow">AURAMAX PREMIUM · 30-DAY TRANSFORMATION PLAN</p><h1>Build a stronger routine, one day at a time.</h1><p>This is a healthy grooming, style, movement, posture and wardrobe-reset plan. It is designed for practical confidence—not unsafe appearance changes, extreme diets or unrealistic standards.</p></div><div class="transformation-score"><strong>${percent}%</strong><span>${complete.size} of 30 days complete</span></div></header><section class="transformation-today"><div><p class="eyebrow">YOUR NEXT STEP</p><h2>Day ${currentDay}: ${escapeHtml(planner.days[currentDay - 1].title)}</h2><p>${escapeHtml(planner.days[currentDay - 1].task)}</p></div><button type="button" data-transformation-scroll="${currentDay}">See today’s task ↓</button></section><nav class="transformation-themes" aria-label="Plan themes">${themes.map(theme => `<span>${escapeHtml(theme)}</span>`).join('')}</nav><section class="transformation-days" aria-label="30-day transformation tasks">${planner.days.map(item => `<article class="transformation-day ${complete.has(item.day) ? 'is-complete' : ''}" id="transformation-day-${item.day}"><button type="button" class="transformation-check" data-transformation-day="${item.day}" aria-pressed="${complete.has(item.day)}" aria-label="Mark day ${item.day} as ${complete.has(item.day) ? 'incomplete' : 'complete'}"><span>${complete.has(item.day) ? '✓' : item.day}</span></button><div><p class="eyebrow">DAY ${String(item.day).padStart(2, '0')} · ${escapeHtml(item.theme)}</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.task)}</p></div></article>`).join('')}</section><aside class="transformation-disclaimer"><strong>Build healthy habits, not pressure.</strong><span>Adapt every task to your body, budget, schedule and comfort. Pause any activity that causes pain or distress and seek qualified support for personal health, skin, dental or fitness concerns.</span></aside></article>`;
  syncTransformationProgress();
}
async function syncTransformationProgress() {
  if (!galleryClient || appRoot.dataset.auraView !== 'transformation') return;
  const { data: { user } } = await galleryClient.auth.getUser();
  if (!user) return;
  const { data, error } = await galleryClient.from('auramax_transformation_progress').select('completed_days, started_at, updated_at').eq('user_id', user.id).maybeSingle();
  if (!error && data) {
    const local = window.AuraMaxTransformationPlan.load();
    const merged = [...new Set([...(local.completedDays || []), ...(data.completed_days || [])])];
    if (merged.length !== local.completedDays.length) {
      window.AuraMaxTransformationPlan.merge({ completedDays: merged, startedAt: data.started_at, updatedAt: data.updated_at });
      renderTransformationPlan();
    }
  } else if (!error) {
    const local = window.AuraMaxTransformationPlan.load();
    if (local.completedDays?.length) await persistTransformationProgress(local);
  }
}
async function persistTransformationProgress(progress) {
  if (!galleryClient) return;
  const { data: { user } } = await galleryClient.auth.getUser();
  if (!user) return;
  await galleryClient.from('auramax_transformation_progress').upsert({ user_id: user.id, completed_days: progress.completedDays, started_at: progress.startedAt || new Date().toISOString(), updated_at: new Date().toISOString() });
}
function renderStylePlan() {
  const profile = currentProfile();
  if (!profile) {
    appRoot.innerHTML = `${backButton()}<section class="style-plan-shell style-plan-empty"><p class="eyebrow">PERSONAL STYLE PLAN</p><h2>Start with your profile.</h2><p>Your plan is created from your face shape, body type and skin tone. Complete the short guide first, then AuraMax will save recommendations you can revisit.</p><button type="button" class="button-gold" id="style-plan-open-profile">Set up my profile →</button></section>`;
    document.querySelector('#style-plan-open-profile')?.addEventListener('click', () => document.querySelector('#edit-profile')?.click());
    return;
  }
  if (!profile.skinTone && !profile.skin) {
    const choices = ['Not sure / universal', 'Fair / light', 'Medium', 'Olive', 'Deep / dark'];
    appRoot.innerHTML = `${backButton()}<section class="style-plan-shell"><p class="eyebrow">ONE LAST DETAIL</p><h2>Which skin-depth guide feels closest?</h2><p>This is only used to suggest clothing colours with useful contrast. Choose the closest starting point—you can change it later.</p><div class="style-plan-choice-grid">${choices.map(choice => `<button type="button" data-style-skin="${choice}"><strong>${choice}</strong><span>Use this colour guide →</span></button>`).join('')}</div></section>`;
    return;
  }
  const plan = window.AuraMaxStylePlan?.createAndSave(profile) || null;
  if (!plan) return;
  appRoot.innerHTML = `${backButton()}<article class="style-plan-shell"><header class="style-plan-header"><div><p class="eyebrow">YOUR SAVED PERSONAL STYLE PLAN</p><h1>Build on what already suits you.</h1><p>This is a practical starting point based on your saved profile. Use the recommendations as flexible guidance—not strict rules.</p></div><button type="button" class="text-link" data-refresh-style-plan>Refresh plan ↻</button></header><div class="style-plan-profile-tags"><span>${escapeHtml(plan.profile.face)} face</span><span>${escapeHtml(plan.profile.body)} body</span><span>${escapeHtml(plan.profile.skinTone)} skin guide</span></div><section class="style-plan-grid"><article><p class="eyebrow">COLOURS TO REPEAT</p><h2>Recommended colours</h2><div class="style-plan-colours">${plan.recommendedColours.map(colour => `<span>${escapeHtml(colour)}</span>`).join('')}</div></article><article><p class="eyebrow">EASY OUTFITS</p><h2>Outfit formulas</h2><ol>${plan.outfitFormulas.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol></article><article><p class="eyebrow">GROOMING FIRST</p><h2>Priorities</h2><ol>${plan.groomingPriorities.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol></article><article><p class="eyebrow">KEEP IT SIMPLE</p><h2>Suggestions to avoid</h2><ul>${plan.avoids.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></section><aside class="style-plan-note"><strong>Healthy confidence first.</strong><span>Focus on healthy grooming, style, comfort and habits. AuraMax does not recommend unsafe appearance changes or unrealistic standards.</span></aside></article>`;
}
function renderColours() {
  const skinGuides = [
    { key:'universal', label:'Not sure / universal', note:'Start with versatile colours that work across many skin depths and undertones. Save what makes you feel comfortable and confident.', best:['Navy','Off-white','Charcoal','Teal','Forest green','Burgundy'], careful:'There are no forbidden colours. If a shade feels flat, add contrast with a darker layer, lighter collar or favourite accessory.', formulas:['College: navy overshirt + white tee + straight jeans','Everyday: charcoal tee + stone trousers + clean sneakers','Smart casual: forest shirt + dark denim + brown shoes'], swatch:['#152b4f','#f4efe3','#343940','#0e7775','#315b46','#7b2638'] },
    { key:'fair', label:'Fair / light', note:'Gentle contrast is a useful starting point; your undertone and preferences can shift the palette.', best:['Navy','Charcoal','Forest green','Burgundy','Cobalt','Camel'], careful:'Very pale neutrals close to your skin may need balance. Try a darker jacket, collar or accessory near your face.', formulas:['College: navy overshirt + white tee + stone trousers','Everyday: forest knit + charcoal trousers + white sneakers','Event: burgundy shirt + dark denim + brown shoes'], swatch:['#152b4f','#343940','#315b46','#7b2638','#235bb5','#b98b62'] },
    { key:'medium', label:'Medium', note:'Balanced contrast often works well; rich colours and warm neutrals are dependable starting points.', best:['Teal','Olive','Cream','Rust','Navy','Chocolate'], careful:'Muted beige or brown close to your skin may need balance. Separate it with navy, cream or white.', formulas:['College: teal polo + cream trousers + dark sneakers','Everyday: olive jacket + white tee + dark denim','Event: rust overshirt + navy trousers + tan shoes'], swatch:['#0e7775','#647042','#f1e8d5','#aa4d2b','#132d55','#573a2d'] },
    { key:'olive', label:'Olive', note:'Earthy and jewel tones are useful starting points for green-gold undertones.', best:['Emerald','Plum','Off-white','Terracotta','Deep blue','Warm grey'], careful:'Yellow-green or khaki close to your undertone may need balance. Place a crisp neutral near your face.', formulas:['College: emerald shirt + warm-grey trousers + black sneakers','Everyday: off-white knit + deep-blue denim + brown boots','Event: terracotta tee + charcoal overshirt + ecru trousers'], swatch:['#087a55','#6c356f','#f4efe3','#b45336','#153a67','#77736d'] },
    { key:'deep', label:'Deep / dark', note:'Clear contrast and saturated colour can create a strong, intentional look.', best:['Crisp white','Royal blue','Mustard','Emerald','Wine','Camel'], careful:'Very low-contrast dark layers may need balance. Add cream, white, camel or a clear accent.', formulas:['College: white shirt + camel trousers + dark sneakers','Everyday: royal-blue knit + grey trousers + white sneakers','Event: mustard overshirt + black tee + dark denim'], swatch:['#f7f5ee','#2454b5','#d69f19','#087a55','#78273d','#b98b62'] }
  ];
  const savedSkinTone = currentProfile()?.skinTone || '';
  const normalizedSavedTone = savedSkinTone.replace('Medium / wheatish', 'Medium');
  const selectedGuide = skinGuides.find(guide => normalizedSavedTone.toLowerCase().startsWith(guide.label.toLowerCase())) || skinGuides[0];
  const undertoneHelper = `<aside class="undertone-helper"><div><p class="eyebrow">DEPTH + UNDERTONE</p><h3>Use both as clues—not rules.</h3></div><div class="undertone-options"><p><b>Warm</b><span>Gold jewellery or cream may feel harmonious. Try rust, olive and camel.</span></p><p><b>Cool</b><span>Silver jewellery or crisp white may feel harmonious. Try cobalt, plum and charcoal.</span></p><p><b>Neutral / unsure</b><span>Both can work. Begin with navy, teal, off-white and burgundy.</span></p></div><small>Check colours in indirect daylight. Phone cameras and indoor bulbs can shift skin and fabric colour. Personal preference, school rules, climate and the clothes you already own matter most.</small></aside>`;
  appRoot.innerHTML = `${backButton()}<section class="auramax-page-head colour-guide-head"><p class="eyebrow">COLOUR COMBINATION · FLEXIBLE GUIDE</p><h2>Find colours you enjoy wearing.</h2><p>Choose the closest starting point—or choose Not sure. Compare palettes freely; selecting one saves it to your profile.</p></section>${undertoneHelper}${learnGalleryMarkup('Color Combination')}<nav class="skin-tone-nav" aria-label="Compare colour starting points">${skinGuides.map(guide=>`<button type="button" class="${guide.key===selectedGuide.key?'active':''}" data-skin-guide="${guide.key}" data-skin-label="${guide.label}" aria-pressed="${guide.key===selectedGuide.key}">${guide.label}</button>`).join('')}</nav><p class="colour-compare-note" role="status">Tap another palette to compare it. Your latest choice is saved automatically.</p><div>${skinGuides.map(guide=>`<article class="skin-guide-card ${guide.key===selectedGuide.key?'active':''}" data-skin-panel="${guide.key}"><header><div><p class="eyebrow">FLEXIBLE STARTING POINT</p><h3>${guide.label}</h3><p>${guide.note}</p></div><div class="skin-palette" aria-label="${guide.label} suggested colours">${guide.swatch.map((colour,i)=>`<span style="--swatch:${colour}"><b>${guide.best[i]}</b></span>`).join('')}</div></header><section><h4>Colours to try first</h4><div class="colour-chips">${guide.best.map(colour=>`<span>${colour}</span>`).join('')}</div></section><section class="colour-caution"><h4>Colours to balance</h4><p>${guide.careful}</p></section><section><h4>Student-budget outfit formulas</h4><ol class="outfit-formulas">${guide.formulas.map(formula=>`<li>${formula}</li>`).join('')}</ol></section></article>`).join('')}</div><aside class="colour-rule"><b>Your best colour is one you enjoy and will actually wear.</b> These palettes are starting points, not restrictions. Fit, fabric, contrast and confidence can make almost any colour work.</aside>`;
}
const lookbookCategories = ['Summer Fits', 'Formal', 'Denims', 'Tee', 'Luxury Casual', 'Old Money', 'Top Picks'];
function renderLookbook(selectedCategory = 'All') {
  activeLookbookCategory = selectedCategory;
  activeLookbookArticleId = null;
  const sourceItems = activeGallery();
  const items = selectedCategory === 'All' ? sourceItems : sourceItems.filter(item => item.category === selectedCategory);
  const emptyState = `<div class="lookbook-empty"><h3>No ${escapeHtml(selectedCategory)} looks yet</h3><p>New outfit guides in this category will appear here as soon as they are published.</p></div>`;
  appRoot.innerHTML = `${backButton()}<section class="auramax-page-head"><p class="eyebrow">STYLING GUIDE · LOOKBOOK</p><h2>Find an outfit direction that fits your life.</h2><p>Explore a category, then open any look for the full visual guide and its styling notes.</p></section><nav class="lookbook-category-nav" aria-label="LookBook categories"><button type="button" class="${selectedCategory === 'All' ? 'active' : ''}" data-lookbook-category="All">All looks</button>${lookbookCategories.map(category => `<button type="button" class="${selectedCategory === category ? 'active' : ''}" data-lookbook-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('')}</nav><div class="lookbook-grid">${items.length ? items.map(item => `<article class="lookbook-card"><button type="button" class="lookbook-card-open" data-lookbook-item="${escapeHtml(item.id)}" data-return-category="${escapeHtml(selectedCategory)}" aria-label="Open ${escapeHtml(item.title)} style guide">${imageMarkup(item)}<div><small>${escapeHtml(item.category)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><span class="lookbook-read-link">Read style guide <b aria-hidden="true">→</b></span></div></button></article>`).join('') : emptyState}</div>`;
}
function renderLookbookArticle(itemId, returnCategory = activeLookbookCategory) {
  const item = activeGallery().find(entry => String(entry.id) === String(itemId));
  if (!item) { renderLookbook(returnCategory); return; }
  activeLookbookArticleId = String(item.id);
  activeLookbookCategory = returnCategory;
  appRoot.dataset.auraView = 'lookbook-article';
  document.body.classList.add('aura-inner-view');
  const returnLabel = returnCategory === 'All' ? 'all looks' : returnCategory;
  appRoot.innerHTML = `<section class="lookbook-article-shell"><button type="button" class="lookbook-article-back" data-lookbook-return data-return-category="${escapeHtml(returnCategory)}"><span aria-hidden="true">←</span> Back to ${escapeHtml(returnLabel)}</button><article class="lookbook-article"><header class="lookbook-article-header"><p class="eyebrow">STYLE GUIDE · ${escapeHtml(item.category)}</p><h1>${escapeHtml(item.title)}</h1><p class="lookbook-article-lead">A visual outfit reference to adapt to your own wardrobe, occasion and comfort.</p></header><figure class="lookbook-article-media">${imageMarkup(item)}<figcaption>${escapeHtml(item.title)} · AuraMax LookBook</figcaption></figure><section class="lookbook-article-content"><div><p class="eyebrow">ABOUT THIS LOOK</p><h2>The details that make it work</h2></div><p>${escapeHtml(item.description)}</p><div class="lookbook-article-note"><strong>Make it your own.</strong><span>Use this as a practical reference. Prioritise fit, comfort and the pieces you already wear well over copying every item exactly.</span></div></section></article></section>`;
  appRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function getGuideChapter(id) { return (window.AuraMax.chapters || []).find(chapter => String(chapter.id) === String(id)); }
const premiumGuideProfiles = {
  foundations: { principle: 'Start with the changes that are visible, low-risk and easy to repeat. A strong result comes from a maintained base, not from trying to fix everything at once.', routine: ['Take one neutral daylight photo for reference, then put it away.', 'Choose one grooming, movement or wardrobe action you can repeat this week.', 'Review once after seven days and keep only what is genuinely useful.'], mistakes: [['Trying to change every detail at once', 'Choose three controllable priorities for the next 30 days.'], ['Judging yourself from one selfie', 'Use occasional daylight references and real-life comfort as the measure.']], examples: ['Clean hair, clear skin basics and a well-fitting outfit usually improve the whole impression at once.', 'A simple habit that survives busy weeks is more valuable than an intense plan you abandon.'], checklist: ['I have chosen a realistic priority.', 'My change is safe and repeatable.', 'I will review this weekly, not obsessively.'] },
  aesthetics: { principle: 'Useful aesthetic awareness should help you choose grooming, hair and clothing more intentionally. It should never become a numerical score or a reason to chase an unrealistic ideal.', routine: ['Notice the feature or proportion in normal daylight, not only through a close camera lens.', 'Use framing tools such as haircut shape, glasses, facial hair or clothing neckline first.', 'Choose comfort and a natural expression before any appearance trend.'], mistakes: [['Treating a feature as a flaw that needs urgent fixing', 'Use style and grooming to support what already suits you.'], ['Comparing yourself with edited photos', 'Compare choices by how they look and feel in ordinary life.']], examples: ['A balanced haircut can change how the face reads more than a new product.', 'Good posture and a relaxed expression improve the whole frame without changing a feature.'], checklist: ['I am using real-life references.', 'I am not rating my face numerically.', 'My next step is non-invasive and practical.'] },
  mewing: { principle: 'Comfortable oral posture and breathing habits are about everyday comfort, not forceful exercises or promises of dramatic structural change.', routine: ['Keep your jaw relaxed and avoid clenching during the day.', 'Notice whether your head and neck feel neutral while sitting and walking.', 'If you have pain, clicking, bite concerns or breathing issues, discuss them with a qualified dental or medical professional.'], mistakes: [['Forcing the tongue or jaw into a painful position', 'Use a comfortable resting posture and stop if it causes strain.'], ['Expecting a rapid facial transformation', 'Focus on posture, sleep, fitness and grooming that support overall wellbeing.']], examples: ['A relaxed jaw and neutral head position can photograph more naturally than a forced pose.', 'Regular dental care is a more reliable priority than internet exercises.'], checklist: ['No pain or clenching.', 'My posture feels relaxed.', 'I know when to seek professional advice.'] },
  body: { principle: 'A balanced, healthy frame improves movement, energy and how clothes sit. Progress should be gradual, properly fuelled and suited to your experience level.', routine: ['Train a simple push, pull, squat or hinge pattern with good technique.', 'Eat regular meals that support training and recovery rather than extreme restriction.', 'Track consistency, reps or energy over weeks instead of daily body criticism.'], mistakes: [['Starting with a punishing routine', 'Begin with a sustainable schedule and build volume slowly.'], ['Cutting food aggressively for appearance', 'Choose a health-focused approach that protects energy, sleep and training.']], examples: ['Upper-back strength and mobility can help a shirt or jacket sit more cleanly.', 'A repeatable three-day routine is a better foundation than an occasional heroic workout.'], checklist: ['My plan includes recovery.', 'Technique comes before heavier weight.', 'My goal supports health and confidence.'] },
  skin: { principle: 'Premium skin care is usually simple: gentle cleansing, moisturising when needed, daily sun protection and one deliberate treatment at a time.', routine: ['Use a simple morning and evening routine you can sustain.', 'Introduce only one new active product at a time and monitor irritation.', 'Keep pillowcases, trimmers and phone screens clean, especially if you break out.'], mistakes: [['Scrubbing or adding many harsh products at once', 'Protect the skin barrier and make changes gradually.'], ['Trying to self-treat persistent painful or scarring acne', 'See a dermatologist for evidence-based care.']], examples: ['A consistent SPF habit is more useful than an expensive product used occasionally.', 'Sleep and clean grooming tools often matter as much as adding another serum.'], checklist: ['My routine has only necessary steps.', 'I use sun protection when exposed to daylight.', 'I know when professional care is appropriate.'] },
  hair: { principle: 'Hair is the frame around the face. The best haircut works with your texture, density and ordinary morning routine—not just one salon photo.', routine: ['Save two or three references that match your real hair texture.', 'Tell your barber how much styling you will realistically do each morning.', 'Photograph the cut when it looks right so you can repeat the brief.'], mistakes: [['Copying a cut that needs a different texture or density', 'Use references with similar hair behaviour.'], ['Using too much product at the roots', 'Start with less product and build controlled volume.']], examples: ['A modest side shape and intentional fringe can add structure without extreme styling.', 'A cut that grows out neatly reduces the need for constant fixes.'], checklist: ['My reference matches my hair type.', 'My cut is maintainable.', 'My tools and products suit my routine.'] },
  hormones: { principle: 'Energy, recovery and wellbeing show up in your appearance. The dependable foundations are sleep, movement, food, hydration and professional support when something feels wrong.', routine: ['Set a consistent sleep and wake window most days.', 'Build regular meals and water into your schedule.', 'Speak to a clinician for persistent fatigue, mood changes or health concerns instead of self-diagnosing online.'], mistakes: [['Using appearance anxiety to justify risky products or habits', 'Choose health-first habits and qualified advice.'], ['Treating normal development as a problem to solve', 'Give your body time and focus on controllable routines.']], examples: ['Better sleep often improves energy, posture and skin more than another complicated supplement.', 'Reducing alcohol, smoking and other harmful habits supports both health and presentation.'], checklist: ['My sleep is a priority.', 'I avoid unsafe shortcuts.', 'I seek qualified help for persistent concerns.'] },
  supplements: { principle: 'Supplements are optional support, not a replacement for food, sleep, training or medical guidance. More products do not automatically mean better results.', routine: ['Check whether food, sleep and training basics are already in place.', 'Read labels and avoid unverified blends or dramatic claims.', 'Ask a clinician or qualified professional if you take medication, are under 18, or have a medical condition.'], mistakes: [['Buying a stack before building basic habits', 'Start with the fundamentals and add nothing unnecessary.'], ['Using hormone-like or extreme fat-loss products', 'Avoid products with unclear safety or exaggerated promises.']], examples: ['A simple, evidence-informed choice can be reasonable for some adults; it is never a shortcut to a new identity.', 'Good hydration and regular meals make a bigger daily difference than most supplement marketing.'], checklist: ['I know why I would use a product.', 'I have checked safety and suitability.', 'I can maintain the basics without it.'] },
  grooming: { principle: 'Polish is a collection of small maintained details: hair, skin, teeth, nails, clothes, scent and relaxed posture. Consistency reads better than overdoing any one detail.', routine: ['Do a sixty-second check: hair, face, outfit, details, posture and breath.', 'Choose one scent lightly after clean body and clothes.', 'Prepare tomorrow’s clothes and grooming tools before you are rushed.'], mistakes: [['Over-plucking, over-shaping or over-spraying fragrance', 'Keep edges natural and use a light hand.'], ['Ignoring fit and cleanliness while chasing expensive labels', 'Prioritise clean shoes, pressed clothes and intentional proportions.']], examples: ['A clean collar, moisturised lips and tidy nails create a stronger impression than a dramatic accessory.', 'A calm speaking pace can make a prepared outfit feel even more intentional.'], checklist: ['My grooming is clean, not excessive.', 'My outfit is ready and fits well.', 'I feel comfortable moving and speaking in it.'] },
  medical: { principle: 'Medical or cosmetic decisions deserve time, credible information and a qualified professional. This guide supports informed questions; it does not replace clinical advice.', routine: ['Write down your goal and the non-procedure alternatives you have already tried.', 'Discuss risks, recovery, qualifications and realistic outcomes with an appropriately licensed clinician.', 'Give yourself time away from pressure, filters and social media before deciding.'], mistakes: [['Choosing a procedure because of one photo or trend', 'Make decisions slowly and based on trusted medical guidance.'], ['Ignoring recovery, cost or mental wellbeing', 'Consider the full commitment and seek a second opinion if needed.']], examples: ['Skin, hair and style changes may address the concern without a procedure.', 'A good practitioner explains limitations as clearly as benefits.'], checklist: ['I understand the risks and recovery.', 'I have a qualified consultation.', 'My decision is not rushed.'] },
  mental: { principle: 'Confidence is easier to build when appearance habits reduce friction instead of taking over your attention. Use this guide to support life, not to become a scorecard.', routine: ['Limit comparison-heavy content when it makes you feel worse.', 'Spend time on skills, friendships, movement and routines that create real confidence.', 'If appearance anxiety affects daily life, talk with a trusted person or mental-health professional.'], mistakes: [['Compulsive mirror checking or constant photo retakes', 'Use planned check-ins, then return to your day.'], ['Confusing harsh self-talk with motivation', 'Use practical, respectful language about your next action.']], examples: ['A calm social interaction often leaves a better impression than a perfect photo.', 'Progress can mean feeling less preoccupied, not only changing a look.'], checklist: ['This plan supports my wellbeing.', 'I have limits around comparison.', 'I am building confidence beyond appearance.'] },
  routines: { principle: 'A premium routine is a calendar you can live with. Divide tasks into daily, weekly and monthly actions so polished never becomes an emergency.', routine: ['Choose a small daily clean-and-ready checklist.', 'Schedule one weekly reset for laundry, nails, shoes and grooming tools.', 'Use a monthly review to update one outfit formula, haircut reference or goal.'], mistakes: [['Saving every task for a special occasion', 'Use small maintenance blocks before problems pile up.'], ['Adding ten goals midway through a reset', 'Finish the few priorities you already chose.']], examples: ['A Sunday outfit reset can remove weekday decision fatigue.', 'A 30-day plan works best when it adds one layer each week: clean, frame, fit, then presence.'], checklist: ['My daily routine fits my real schedule.', 'I have a weekly reset time.', 'I review monthly without overcorrecting.'] },
  summary: { principle: 'The goal is a clear personal system: clean, proportional, intentional, relaxed and repeatable. Keep the few habits that make the biggest difference for you.', routine: ['Pick the three habits with the most visible return for your current life.', 'Create two reliable outfit formulas and one grooming baseline.', 'Use the next month to repeat, refine and maintain rather than restart.'], mistakes: [['Chasing a new trend before your basics are consistent', 'Return to fit, hygiene, sleep, posture and presence.'], ['Treating the guide as a final verdict', 'Use it as a flexible reference that changes with your life.']], examples: ['Fit usually matters more than brand.', 'Consistency usually matters more than a quick fix.'], checklist: ['My system is simple.', 'My choices are safe and personal.', 'I can maintain this next month.'] }
};
function getPremiumGuideContent(chapter, lesson, lessonIndex) {
  const profileAliases = {
    face: 'foundations',
    asymmetry: 'aesthetics',
    jaw: 'mewing',
    eyes: 'grooming',
    nutrition: 'hormones',
    lips: 'grooming',
    conclusion: 'summary',
    intro: 'foundations',
    advanced: 'medical',
    presentation: 'grooming',
    style: 'grooming',
    life: 'routines',
    mind: 'mental',
    frame: 'body',
    skincomplete: 'skin',
    haircomplete: 'hair'
  };
  const profileKey = profileAliases[String(chapter.id).toLowerCase()] || String(chapter.id).toLowerCase();
  const profile = premiumGuideProfiles[profileKey] || premiumGuideProfiles.foundations;
  const title = lesson[0] || `Lesson ${lessonIndex + 1}`;
  return { ...profile, focus: `In this lesson, use “${title}” as one small part of your broader AuraMax system. Keep what works in real life, adapt it to your budget and routine, and leave out anything that causes strain, irritation or anxiety.` };
}
function getLessonPersonalisation(chapter, lesson) {
  const chapterId = String(chapter.id || '').toLowerCase();
  const title = lesson[0] || 'this lesson';
  const styleFocused = ['foundations', 'body', 'grooming', 'routines', 'summary', 'aesthetics'].includes(chapterId);
  const skinFocused = chapterId === 'skin';
  const relatedMap = {
    foundations: ['Top Picks', 'Luxury Casual', 'Formal'], aesthetics: ['Top Picks', 'Old Money', 'Luxury Casual'],
    mewing: ['Top Picks', 'Tee', 'Luxury Casual'], body: ['Formal', 'Denims', 'Tee'], skin: ['Summer Fits', 'Top Picks', 'Luxury Casual'],
    hair: ['Old Money', 'Denims', 'Luxury Casual'], hormones: ['Summer Fits', 'Tee', 'Top Picks'], supplements: ['Summer Fits', 'Tee', 'Luxury Casual'],
    grooming: ['Formal', 'Old Money', 'Luxury Casual'], medical: ['Top Picks', 'Formal', 'Luxury Casual'], mental: ['Tee', 'Summer Fits', 'Top Picks'],
    routines: ['Top Picks', 'Formal', 'Denims'], summary: ['Top Picks', 'Luxury Casual', 'Summer Fits']
  };
  return {
    skin: skinFocused
      ? 'For lighter, medium and deeper skin tones alike, keep the routine gentle and judge products by comfort, irritation and daytime appearance—not by a one-size-fits-all result. Sunscreen should feel wearable and leave a finish you are happy to reapply.'
      : 'For different skin tones, use colour and grooming choices to create the contrast you enjoy. Check outfits in daylight, and choose product finishes that feel comfortable and look natural on your own skin.',
    body: styleFocused
      ? 'For different body types, use fit rather than rules: shoulders should move freely, waistbands should sit comfortably, and hems can be adjusted to create the proportion you prefer. No body type needs to chase the same silhouette.'
      : `For different body types and routines, adapt “${title}” around comfort, mobility and your real schedule. The best version is the one you can repeat without strain or comparison.` ,
    budget: 'For any budget, start with the lowest-cost action that improves your routine: use what you already own, repair or tailor where useful, then add one durable upgrade only when it solves a real need. Price is never the same as personal style.' ,
    relatedLooks: relatedMap[chapterId] || ['Top Picks', 'Luxury Casual', 'Summer Fits']
  };
}
function renderGuide() {
  const chapters = window.AuraMax.chapters || [];
  activeGuideChapterId = null;
  activeGuideLessonIndex = null;
  appRoot.dataset.auraView = 'guide';
  appRoot.innerHTML = `${backButton()}<section class="auramax-page-head"><p class="eyebrow">LOOKSMAX COMPLETE GUIDE</p><h2>Build the fundamentals before chasing details.</h2><p>Choose a chapter to open its complete set of practical lessons. Each lesson gives you clear steps you can use straight away.</p></section>${learnGalleryMarkup('Looksmax Complete Guide')}<section class="guide-chapter-directory" aria-label="Looksmax Complete Guide chapters"><div class="guide-directory-head"><div><p class="eyebrow">COMPLETE GUIDE</p><h3>Choose your next chapter</h3></div><span>${chapters.length} chapters</span></div><div class="chapter-grid">${chapters.map(chapter => `<button type="button" class="chapter-card" data-aura-guide-chapter="${escapeHtml(chapter.id)}"><small>CHAPTER ${escapeHtml(chapter.tag)}</small><h3>${escapeHtml(chapter.name)}</h3><p>${escapeHtml(chapter.desc)}</p><span class="guide-card-action">Open chapter <b aria-hidden="true">→</b></span></button>`).join('')}</div></section>`;
}
function renderGuideChapter(id) {
  const chapter = getGuideChapter(id);
  if (!chapter) { renderGuide(); return; }
  const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
  activeGuideChapterId = String(chapter.id);
  activeGuideLessonIndex = null;
  appRoot.dataset.auraView = 'guide-chapter';
  document.body.classList.add('aura-inner-view');
  appRoot.innerHTML = `<section class="guide-detail-shell"><button type="button" class="guide-back-button" data-aura-guide-back="chapters"><span aria-hidden="true">←</span> Back to complete guide</button><header class="guide-detail-head"><p class="eyebrow">CHAPTER ${escapeHtml(chapter.tag)}</p><h1>${escapeHtml(chapter.name)}</h1><p>${escapeHtml(chapter.desc)}</p><span>${lessons.length} practical lesson${lessons.length === 1 ? '' : 's'}</span></header><section class="guide-lesson-grid" aria-label="Lessons in ${escapeHtml(chapter.name)}">${lessons.length ? lessons.map((lesson, index) => `<button type="button" class="guide-lesson-card" data-aura-guide-lesson="${index}" data-aura-guide-chapter-id="${escapeHtml(chapter.id)}"><small>LESSON ${String(index + 1).padStart(2, '0')}</small><h2>${escapeHtml(lesson[0] || `Lesson ${index + 1}`)}</h2><p>${escapeHtml(lesson[1] || 'Open this lesson for practical steps.')}</p><span>Read lesson <b aria-hidden="true">→</b></span></button>`).join('') : '<p class="guide-empty">Lessons for this chapter are being prepared.</p>'}</section></section>`;
  appRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderGuideLesson(chapterId, index) {
  const chapter = getGuideChapter(chapterId);
  const lessonIndex = Number(index);
  const lesson = chapter?.lessons?.[lessonIndex];
  if (!chapter || !lesson) { renderGuideChapter(chapterId); return; }
  const [title = `Lesson ${lessonIndex + 1}`, summary = '', firstStep = '', secondStep = ''] = lesson;
  const previous = lessonIndex > 0 ? lessonIndex - 1 : null;
  const next = lessonIndex < chapter.lessons.length - 1 ? lessonIndex + 1 : null;
  activeGuideChapterId = String(chapter.id);
  activeGuideLessonIndex = lessonIndex;
  appRoot.dataset.auraView = 'guide-lesson';
  document.body.classList.add('aura-inner-view');
  const premium = getPremiumGuideContent(chapter, lesson, lessonIndex);
  const personalisation = getLessonPersonalisation(chapter, lesson);
  appRoot.innerHTML = `<article class="guide-reader guide-article"><button type="button" class="guide-back-button" data-aura-guide-back="chapter" data-aura-guide-chapter-id="${escapeHtml(chapter.id)}"><span aria-hidden="true">←</span> Back to ${escapeHtml(chapter.name)}</button><header><p class="eyebrow">CHAPTER ${escapeHtml(chapter.tag)} · LESSON ${String(lessonIndex + 1).padStart(2, '0')}</p><h1>${escapeHtml(title)}</h1><p class="guide-reader-lead">${escapeHtml(summary)}</p></header><div class="guide-article-body"><section><h2>The practical approach</h2><p>${escapeHtml(premium.principle)}</p><p>${escapeHtml(premium.focus)}</p></section><section class="guide-article-steps"><p class="eyebrow">PRACTICAL STEPS</p><h2>Put the lesson into practice</h2><ol><li>${escapeHtml(firstStep || 'Start with the smallest comfortable action you can repeat.')}</li><li>${escapeHtml(secondStep || 'Keep the routine simple enough to follow consistently.')}</li><li>Review what feels useful after a week, then adjust one detail at a time.</li></ol></section><section><h2>Build it into your week</h2><ol>${premium.routine.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section><aside class="guide-article-callout"><p class="eyebrow">COMMON MISTAKES</p><h2>Choose the better move</h2>${premium.mistakes.map(([avoid, instead]) => `<p><strong>Instead of ${escapeHtml(avoid)},</strong> ${escapeHtml(instead)}</p>`).join('')}</aside><section class="guide-personalise"><p class="eyebrow">MAKE IT PERSONAL</p><h2>Examples that fit real life</h2><div class="guide-personalise-grid"><article><h3>Skin tone &amp; comfort</h3><p>${escapeHtml(personalisation.skin)}</p></article><article><h3>Body type &amp; fit</h3><p>${escapeHtml(personalisation.body)}</p></article><article><h3>Budget-friendly version</h3><p>${escapeHtml(personalisation.budget)}</p></article></div></section><section><h2>What good progress looks like</h2><ul>${premium.examples.map(example => `<li>${escapeHtml(example)}</li>`).join('')}</ul></section><section class="guide-article-takeaway"><p class="eyebrow">SAVE THIS CHECKLIST</p><h2>Before you move to the next lesson</h2><ul>${premium.checklist.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section><section class="guide-related-looks"><div><p class="eyebrow">RELATED LOOKS</p><h2>See the ideas in a real outfit</h2><p>Open a LookBook category for visual references you can adapt to your own wardrobe.</p></div><div class="guide-related-look-list">${personalisation.relatedLooks.map(category => `<button type="button" data-aura-related-look="${escapeHtml(category)}"><span>${escapeHtml(category)}</span><b aria-hidden="true">→</b></button>`).join('')}</div></section><aside class="guide-reader-note"><strong>A healthy, sustainable guide.</strong><span>Use this guide for healthy grooming, style, confidence and habits—not unsafe appearance changes. Comfort, health and consistency matter more than chasing a perfect result.</span></aside></div><nav class="guide-reader-navigation" aria-label="Lesson navigation"><button type="button" ${previous === null ? 'disabled' : `data-aura-guide-navigate="${previous}" data-aura-guide-chapter-id="${escapeHtml(chapter.id)}"`}>← Previous lesson</button><button type="button" data-aura-guide-back="chapter" data-aura-guide-chapter-id="${escapeHtml(chapter.id)}">All lessons</button><button type="button" ${next === null ? 'disabled' : `data-aura-guide-navigate="${next}" data-aura-guide-chapter-id="${escapeHtml(chapter.id)}"`}>Next lesson →</button></nav></article>`;
  appRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderCurrentView() { const view = appRoot.dataset.auraView || 'hub'; if(view==='hub')renderHub(); if(view==='style-plan')renderStylePlan(); if(view==='transformation')renderTransformationPlan(); if(view==='colours')renderColours(); if(view==='lookbook')renderLookbook(activeLookbookCategory); if(view==='lookbook-article')renderLookbookArticle(activeLookbookArticleId, activeLookbookCategory); if(view==='guide')renderGuide(); if(view==='guide-chapter')renderGuideChapter(activeGuideChapterId); if(view==='guide-lesson')renderGuideLesson(activeGuideChapterId, activeGuideLessonIndex); }
function show(view) {
  appRoot.dataset.auraView = view;
  document.body.classList.toggle('aura-inner-view', view !== 'hub');
  if (view === 'quick' || view === 'qa') {
    window.AuraMax.legacyShow(view);
    const back = appRoot.querySelector(':scope > .back');
    if (back) {
      back.removeAttribute('data-view');
      back.dataset.auraView = 'hub';
      back.type = 'button';
      back.innerHTML = '<span aria-hidden="true">←</span> Back to all categories';
      // Legacy views install their own handler, so give this control a direct
      // route back to the redesigned hub as well as the delegated route.
      back.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        show('hub');
      };
    }
    appendCategoryGallery(view === 'quick' ? 'Quick Looksmax Tips' : 'Looksmax Q&A Advanced');
    appRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  renderCurrentView();
  appRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function installNavigation() {
  const legacyShow = window.AuraMax.show; window.AuraMax.legacyShow = legacyShow; window.AuraMax.show = show;
  document.addEventListener('click', event => {
    const styleSkin = event.target.closest('[data-style-skin]');
    if (styleSkin) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const profile = { ...(currentProfile() || {}), skinTone: styleSkin.dataset.styleSkin };
      localStorage.setItem(profileStore, JSON.stringify(profile));
      window.AuraMaxStylePlan?.createAndSave(profile, true);
      show('style-plan');
      return;
    }
    if (event.target.closest('[data-refresh-style-plan]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const profile = currentProfile();
      if (profile) window.AuraMaxStylePlan?.createAndSave(profile, true);
      show('style-plan');
      return;
    }
    const transformationDay = event.target.closest('[data-transformation-day]');
    if (transformationDay) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const progress = window.AuraMaxTransformationPlan?.toggle(Number(transformationDay.dataset.transformationDay));
      if (progress) { renderTransformationPlan(); persistTransformationProgress(progress); }
      return;
    }
    const transformationScroll = event.target.closest('[data-transformation-scroll]');
    if (transformationScroll) {
      event.preventDefault();
      document.querySelector(`#transformation-day-${transformationScroll.dataset.transformationScroll}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const skinControl = event.target.closest('[data-skin-guide]');
    if (skinControl) {
      event.preventDefault();
      event.stopImmediatePropagation();
      appRoot.querySelectorAll('[data-skin-guide]').forEach(button => {
        const selected = button === skinControl;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      appRoot.querySelectorAll('[data-skin-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.skinPanel === skinControl.dataset.skinGuide));
      const profile = currentProfile();
      if (profile && skinControl.dataset.skinLabel) {
        const updatedProfile = { ...profile, skinTone: skinControl.dataset.skinLabel };
        localStorage.setItem(profileStore, JSON.stringify(updatedProfile));
        window.AuraMaxStylePlan?.createAndSave(updatedProfile, true);
      }
      skinControl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      return;
    }
    const lookbookCategory = event.target.closest('[data-lookbook-category]');
    if (lookbookCategory) { event.preventDefault(); event.stopImmediatePropagation(); renderLookbook(lookbookCategory.dataset.lookbookCategory); return; }
    const lookbookItem = event.target.closest('[data-lookbook-item]');
    if (lookbookItem) { event.preventDefault(); event.stopImmediatePropagation(); renderLookbookArticle(lookbookItem.dataset.lookbookItem, lookbookItem.dataset.returnCategory || 'All'); return; }
    const lookbookReturn = event.target.closest('[data-lookbook-return]');
    if (lookbookReturn) { event.preventDefault(); event.stopImmediatePropagation(); renderLookbook(lookbookReturn.dataset.returnCategory || 'All'); return; }
    const relatedLook = event.target.closest('[data-aura-related-look]');
    if (relatedLook) { event.preventDefault(); event.stopImmediatePropagation(); renderLookbook(relatedLook.dataset.auraRelatedLook || 'All'); return; }
    const guideChapterControl = event.target.closest('[data-aura-guide-chapter]');
    if (guideChapterControl) { event.preventDefault(); event.stopImmediatePropagation(); renderGuideChapter(guideChapterControl.dataset.auraGuideChapter); return; }
    const guideLessonControl = event.target.closest('[data-aura-guide-lesson]');
    if (guideLessonControl) { event.preventDefault(); event.stopImmediatePropagation(); renderGuideLesson(guideLessonControl.dataset.auraGuideChapterId, guideLessonControl.dataset.auraGuideLesson); return; }
    const guideBackControl = event.target.closest('[data-aura-guide-back]');
    if (guideBackControl) { event.preventDefault(); event.stopImmediatePropagation(); if (guideBackControl.dataset.auraGuideBack === 'chapters') renderGuide(); else renderGuideChapter(guideBackControl.dataset.auraGuideChapterId); return; }
    const guideNavigateControl = event.target.closest('[data-aura-guide-navigate]');
    if (guideNavigateControl) { event.preventDefault(); event.stopImmediatePropagation(); renderGuideLesson(guideNavigateControl.dataset.auraGuideChapterId, guideNavigateControl.dataset.auraGuideNavigate); return; }
    const learnControl = event.target.closest('[data-learn-item]');
    if (learnControl) { event.preventDefault(); event.stopImmediatePropagation(); openLearnViewer(learnControl.dataset.learnItem); return; }
    if (event.target.closest('[data-close-learn]')) { event.preventDefault(); event.stopImmediatePropagation(); closeLearnViewer(); return; }
    const viewControl = event.target.closest('[data-aura-view]'); if(viewControl){event.preventDefault();event.stopImmediatePropagation();show(viewControl.dataset.auraView);return;} const legacyControl=event.target.closest('[data-view]'); if(legacyControl){event.preventDefault();event.stopImmediatePropagation();show(legacyControl.dataset.view==='style'?'lookbook':legacyControl.dataset.view);return;} const chapterControl=event.target.closest('[data-aura-chapter]');if(chapterControl){event.preventDefault();event.stopImmediatePropagation();window.AuraMax.chapter(chapterControl.dataset.auraChapter);return;}if(event.target.closest('#open-admin')){event.preventDefault();event.stopImmediatePropagation();openGalleryAdmin();}
  }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLearnViewer(); });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', event => {event.preventDefault();event.stopImmediatePropagation();show(button.dataset.view==='style'?'lookbook':button.dataset.view);}, true)); show(location.hash === '#style-plan' ? 'style-plan' : 'hub');
}
// Premium preview flow: visitors can build their profile, use a small set of
// practical tips and explore a few LookBook examples before deciding whether
// the full personal plan is right for them. This is deliberately transparent:
// no purchase is claimed until a real membership checkout is connected.
const fullAuraRenderHub = renderHub;
const fullAuraRenderLookbook = renderLookbook;
const fullAuraRenderStylePlan = renderStylePlan;

function premiumGateMarkup(title, detail, options = {}) {
  const button = options.button || 'Unlock your personal plan';
  return `<section class="premium-gate" aria-label="Premium personal plan preview"><span class="premium-gate-kicker">PERSONAL PLAN · ₹199 / 30 DAYS</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(detail)}</p><ul><li>Personal recommendations based on your saved profile</li><li>Full LookBook access and complete guides</li><li>Structured routines, checklists and progress tools</li></ul><button class="button primary premium-gate-button" type="button" data-aura-purchase>${escapeHtml(button)} <span aria-hidden="true">→</span></button><p class="premium-gate-note">One-time payment. No auto-renewal. Your free profile and tools stay available.</p></section>`;
}

function premiumPromptMarkup(context) {
  return `<aside class="premium-prompt" aria-label="Premium access"><div><span>FREE PREVIEW</span><strong>${escapeHtml(context)}</strong><small>Unlock all content for ₹199 / 30 days. No auto-renewal.</small></div><button class="button primary" type="button" data-aura-purchase>Buy premium <span aria-hidden="true">→</span></button></aside>`;
}

function renderUnlockPreview() {
  appRoot.dataset.auraView = 'premium-preview';
  document.body.classList.add('aura-inner-view');
  appRoot.innerHTML = `${backButton('Back to free tools')}<section class="premium-preview-page"><p class="eyebrow">AURAMAX PERSONAL PLAN</p><h2>Unlock your personal plan.</h2><p class="premium-preview-lede">One payment gives you 30 days of full guides, routines, the complete LookBook and saved progress.</p><div class="premium-preview-grid"><article><span>01</span><h3>Use your profile</h3><p>Turn your face, body and skin-tone choices into a practical starting point.</p></article><article><span>02</span><h3>Follow a clear routine</h3><p>Move through style, grooming and confidence habits at a steady pace.</p></article><article><span>03</span><h3>Save what works</h3><p>Keep outfit formulas, checklists and favourite looks in one place.</p></article></div><div class="premium-preview-action"><h3>₹199 for 30 days</h3><p>One-time payment. No auto-renewal.</p><button class="button primary" type="button" data-aura-purchase>Unlock Personal Plan</button><button class="button secondary" type="button" data-aura-view="hub">Continue with free tools</button></div></section>`;
  appRoot.querySelector('[data-aura-account-signup]')?.addEventListener('click', () => { window.location.href = 'account.html?mode=signup'; });
}

function renderLockedStylePlan() {
  const profile = currentProfile();
  if (!profile) { fullAuraRenderStylePlan(); return; }
  const skinTone = profile.skinTone || null;
  const savedSelections = skinTone ? `face, body and ${escapeHtml(skinTone)} skin guide` : 'face and body';
  const profileTags = [profile.faceShape || profile.face || 'Face profile', profile.bodyType || profile.body || 'Body profile', skinTone].filter(Boolean);
  appRoot.dataset.auraView = 'style-plan';
  document.body.classList.add('aura-inner-view');
  appRoot.innerHTML = `${backButton('Back to free tools')}<section class="premium-preview-page style-plan-preview"><p class="eyebrow">YOUR SAVED PROFILE</p><h2>Your personal plan preview is ready.</h2><p class="premium-preview-lede">AuraMax has saved your ${savedSelections}. ${skinTone ? 'Here is a preview of the direction your plan will organise.' : 'Choose a skin-depth guide in Color Combination to complete your colour recommendations.'}</p><div class="profile-preview-tags">${profileTags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div><div class="premium-preview-grid"><article><span>COLOUR</span><h3>Build around easy neutrals</h3><p>Start with two reliable base colours, then add one accent you enjoy wearing.</p></article><article><span>FIT</span><h3>Prioritise clean proportions</h3><p>Use comfortable shoulder fit, intentional trouser length and balanced footwear.</p></article><article><span>ROUTINE</span><h3>Keep one weekly reset</h3><p>Plan outfits, grooming basics and a small wardrobe improvement each week.</p></article></div>${premiumGateMarkup('Turn this preview into your personal plan.', 'Unlock detailed colours, outfit formulas, routines, checklists and saved progress tailored to your profile.')}</section>`;
}

function renderPremiumSection(type) {
  const content = {
    qa: { eyebrow: 'LOOKSMAX Q&A ADVANCED', title: 'Get clearer answers from your personal plan.', lead: 'Free visitors can use the profile and quick tips. Advanced Q&A becomes useful when answers can refer back to your saved direction.', samples: ['How do I make a simple outfit look more intentional?', 'What should I improve first: fit, grooming or wardrobe?'] },
    guide: { eyebrow: 'LOOKSMAX COMPLETE GUIDE', title: 'Preview the complete guide, then unlock the full system.', lead: 'The full guide is organized as a practical reading plan with routines, examples, checklists and related looks.', samples: ['Foundation: build healthy, realistic habits', 'Style system: outfit formulas that are easy to repeat', '30-day reset: small actions you can actually sustain'] },
    transformation: { eyebrow: '30-DAY TRANSFORMATION PLAN', title: 'Start with a three-day preview.', lead: 'Your free preview shows the pace. The complete personal plan keeps the full 30-day schedule, progress tracker and weekly resets together.', samples: ['Day 1 — Save your profile and choose one grooming priority', 'Day 2 — Review fit: shoulders, sleeve length and trouser break', 'Day 3 — Build one reliable outfit formula from what you own'] }
  }[type];
  appRoot.dataset.auraView = type;
  document.body.classList.add('aura-inner-view');
  appRoot.innerHTML = `${backButton('Back to free tools')}<section class="premium-preview-page"><p class="eyebrow">${content.eyebrow}</p><h2>${content.title}</h2><p class="premium-preview-lede">${content.lead}</p><div class="premium-sample-list">${content.samples.map((sample, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><p>${sample}</p><small>Free preview</small></article>`).join('')}</div>${premiumGateMarkup('Continue with the full personal plan.', 'Unlock the complete set of lessons, routines, examples and saved progress tools.')}</section>`;
}

function applyFreeQuickTipPreview() {
  appRoot.classList.add('free-quick-preview');
  const grid = appRoot.querySelector('.tips-grid');
  if (!grid || appRoot.querySelector('.quick-premium-gate')) return;
  const cards = [...grid.querySelectorAll('.tip-card')];
  cards.slice(5).forEach(card => card.remove());
  const resultCount = appRoot.querySelector('.qa-meta');
  const visibleCount = Math.min(cards.length, 5);
  if (resultCount) resultCount.textContent = `${visibleCount} free tip${visibleCount === 1 ? '' : 's'}`;
  const pageHead = appRoot.querySelector('.view-head');
  if (pageHead && !appRoot.querySelector('.premium-prompt')) pageHead.insertAdjacentHTML('afterend', premiumPromptMarkup('Five quick tips are included free.'));
  grid.insertAdjacentHTML('afterend', `<div class="quick-premium-gate">${premiumGateMarkup('You have reached the five free quick tips.', 'Keep the free actions, or unlock your personal plan for the complete routines, Q&A and guide.')}</div>`);
}

renderHub = function renderHubWithFreeFoundation() {
  fullAuraRenderHub();
  const colourCardTitle = appRoot.querySelector('[data-aura-view="colours"] h3');
  if (colourCardTitle) colourCardTitle.textContent = 'Colour Combination';
  const intro = appRoot.querySelector('.auramax-intro');
  if (!intro || appRoot.querySelector('.student-start')) return;
  intro.insertAdjacentHTML('afterend', `<section class="student-start" aria-labelledby="student-start-title"><div class="student-start-head"><div><p class="eyebrow">START HERE</p><h2 id="student-start-title">What would help you most today?</h2></div><p>Choose one simple path. You can explore everything else whenever you are ready.</p></div><div class="student-start-grid"><button class="student-start-card" type="button" data-aura-view="quick"><span>01</span><span><strong>Get a quick win</strong><small>Five useful actions you can try today</small></span><b aria-hidden="true">→</b></button><button class="student-start-card" type="button" data-aura-view="lookbook"><span>02</span><span><strong>Find outfit ideas</strong><small>Visual looks you can adapt to your wardrobe</small></span><b aria-hidden="true">→</b></button><button class="student-start-card" type="button" data-aura-view="style-plan"><span>03</span><span><strong>Build my plan</strong><small>Use your profile for personal recommendations</small></span><b aria-hidden="true">→</b></button></div></section>`);
};

renderLookbook = function renderLookbookWithPreview(selectedCategory = 'All') {
  fullAuraRenderLookbook(selectedCategory);
  if (window.AuraMaxPayments?.isPremium()) return;
  appRoot.classList.add('free-lookbook-preview');
  const cards = [...appRoot.querySelectorAll('[data-lookbook-item]')];
  cards.slice(3).forEach(card => card.remove());
  const pageHead = appRoot.querySelector('.auramax-page-head');
  if (pageHead && !appRoot.querySelector('.premium-prompt')) pageHead.insertAdjacentHTML('afterend', premiumPromptMarkup('Three LookBook examples are included free.'));
  const grid = appRoot.querySelector('.lookbook-grid');
  if (grid && !grid.querySelector('.lookbook-preview-lock')) grid.insertAdjacentHTML('beforeend', `<div class="lookbook-preview-lock">${premiumGateMarkup('See the rest of the LookBook in your personal plan.', 'You can explore these free examples now. Unlock the full library to save looks and see complete styling notes.')}</div>`);
};

renderStylePlan = function renderStylePlanWithAccess() {
  if (window.AuraMaxPayments?.isPremium()) fullAuraRenderStylePlan();
  else {
    renderLockedStylePlan();
    const previewLede = appRoot.querySelector('.premium-preview-lede');
    if (previewLede) previewLede.textContent = previewLede.textContent.replace('Color Combination', 'Colour Combination');
  }
};

const originalAuraShow = show;
show = function showWithPremiumPreview(view) {
  if (view === 'qa' || view === 'guide' || view === 'transformation') { if (window.AuraMaxPayments?.isPremium()) { originalAuraShow(view); } else renderPremiumSection(view); return; }
  originalAuraShow(view);
  if (view === 'quick' && !window.AuraMaxPayments?.isPremium()) applyFreeQuickTipPreview();
};

function handlePersonalPlanUnlock(event) {
  const unlock = event.target.closest('[data-aura-unlock]');
  if (!unlock) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  renderUnlockPreview();
}

// Keep this separate from the view initialiser. The unlock button may be
// inserted by a render that happens after navigation has already been set up.
// Delegating at document level guarantees it stays usable after every redraw.
document.addEventListener('click', handlePersonalPlanUnlock, true);

const originalAuraInstallNavigation = installNavigation;
installNavigation = function installPremiumNavigation() {
  originalAuraInstallNavigation();
};

function initializeAuraMaxRedesign() {
  installNavigation();
  connectGallery();

  // The original onboarding flow lives in a legacy module. When it completes,
  // it renders the old hub directly, so bring the user back to the redesigned
  // five-category hub instead.
  const onboarding = document.querySelector('#onboarding');
  if (onboarding) {
    let wasOpen = !onboarding.classList.contains('hidden');
    new MutationObserver(() => {
      const isOpen = !onboarding.classList.contains('hidden');
      if (wasOpen && !isOpen && appRoot.dataset.auraView !== 'account') {
        const profile = currentProfile();
        if (profile) window.AuraMaxStylePlan?.createAndSave(profile, true);
        requestAnimationFrame(() => show(profile ? 'style-plan' : 'hub'));
      }
      wasOpen = isOpen;
    }).observe(onboarding, { attributes: true, attributeFilter: ['class'] });
  }
}

// Module scripts can finish loading after the browser's `load` event (for
// example when an imported dependency is fetched slowly).  In that case a
// load-only listener never runs and dynamically rendered controls, including
// the Personal Plan unlock button, appear to do nothing.  Initialise
// immediately when the document has already finished loading instead.
if (document.readyState === 'complete') {
  initializeAuraMaxRedesign();
} else {
  window.addEventListener('load', initializeAuraMaxRedesign, { once: true });
}

async function openGalleryAdmin() {
  if (!galleryClient) { alert('To use shared gallery uploads, add the Supabase publishable key and run supabase/auramax_gallery.sql first.'); return; }
  const { data: { session } } = await galleryClient.auth.getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email || !(config.adminEmails || []).map(value => value.toLowerCase()).includes(email)) { alert('Only an AuraMax administrator can manage the LookBook gallery.'); return; }
  appRoot.dataset.auraView = 'gallery-admin';
  appRoot.innerHTML = `${backButton()}<section class="auramax-page-head"><p class="eyebrow">ADMIN · LOOKBOOK GALLERY</p><h2>Publish a new outfit guide.</h2><p>Upload one image with a clear category, title and practical styling explanation. Published items appear in the LookBook automatically.</p></section><form id="gallery-upload-form" class="gallery-admin-form"><label>LookBook category<select name="category">${lookbookCategories.map(category => `<option>${escapeHtml(category)}</option>`).join('')}</select></label><label>Title<input name="title" required maxlength="100" placeholder="e.g. Navy overshirt with light-wash denim"></label><label>Style details<textarea name="description" required maxlength="500" placeholder="Explain why the outfit works, how to wear it, and useful alternatives."></textarea></label><label>Outfit image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required></label><label class="publish-toggle"><input name="published" type="checkbox" checked> Publish this item immediately</label><button class="button primary" type="submit">Upload to LookBook</button><p class="gallery-upload-status" role="status"></p></form>`;
  appRoot.querySelector('#gallery-upload-form').addEventListener('submit', uploadGalleryItem);
}
window.AuraMax.openGalleryAdmin = openGalleryAdmin;

async function uploadGalleryItem(event) {
  event.preventDefault(); const form=event.currentTarget; const status=form.querySelector('.gallery-upload-status'); const formData=new FormData(form); const file=formData.get('image');
  if (!(file instanceof File) || !file.size) return;
  if (file.size > 6 * 1024 * 1024) { status.textContent='Please use an image smaller than 6 MB.'; return; }
  status.textContent='Uploading image…'; const { data: { session } }=await galleryClient.auth.getSession(); const safeName=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-'); const path=`${session.user.id}/${Date.now()}-${safeName}`;
  const { error: uploadError }=await galleryClient.storage.from('auramax-gallery').upload(path,file,{cacheControl:'3600',upsert:false}); if(uploadError){status.textContent=uploadError.message;return;}
  const { data:urlData }=galleryClient.storage.from('auramax-gallery').getPublicUrl(path); const { error:insertError }=await galleryClient.from('auramax_gallery_items').insert({category:formData.get('category'),title:formData.get('title'),description:formData.get('description'),image_url:urlData.publicUrl,is_published:formData.get('published')==='on'}); if(insertError){status.textContent=insertError.message;return;}
  status.textContent='Published successfully. It is now visible in the LookBook.'; form.reset(); await connectGallery();
}
