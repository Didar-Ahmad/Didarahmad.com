const appRoot = document.querySelector('#view-root');
const config = window.AURAMAX_CONFIG || {};
const profileStore = 'auramax-web-profile';
const galleryStore = 'auramax-lookbook-gallery';
const premiumProgressStore = 'auramax-premium-progress-v1';
const premiumDisclaimer = 'AuraMax is educational lifestyle content focused on healthy grooming, personal style, confidence and sustainable habits. It is not medical advice and does not promote unsafe appearance changes, extreme dieting, pain, or comparison-based scoring.';
const premiumChapterResources = {
  'playbook-start': { before: 'Choose one realistic reason you want a more intentional routine. Write it in one sentence.', after: 'You have a simple baseline, three priorities, and a plan that fits ordinary weekdays.', weekly: 'Spend ten minutes each Sunday reviewing what helped and removing what did not.', mistakes: [['Changing everything at once', 'Start with one grooming, one wardrobe and one habit change.'], ['Copying a stranger’s routine', 'Use examples as inspiration, then adapt to your schedule and comfort.'], ['Measuring yourself daily', 'Track actions completed, not imagined perfection.']] },
  'playbook-face': { before: 'Take one neutral-light photo and notice your natural proportions without trying to label them as good or bad.', after: 'You can choose a haircut, glasses or collar that feels balanced and comfortable.', weekly: 'Review only one visual choice at a time—hair, beard, glasses or neckline.', mistakes: [['Trying to change bone structure', 'Work with haircut, grooming, eyewear and posture instead.'], ['Over-shaping facial hair', 'Keep edges tidy and leave enough density for a natural result.'], ['Using extreme online “face” routines', 'Choose gentle, reversible grooming habits and professional advice where needed.']] },
  'playbook-skin': { before: 'Keep a short note of what your skin currently tolerates and stop adding several new products at once.', after: 'You have a basic cleanse, moisturise and sun-protection routine you can repeat.', weekly: 'Check for comfort and irritation; change only one product or frequency at a time.', mistakes: [['Using too many active products', 'Use a gentle basic routine first and introduce changes slowly.'], ['Scrubbing or picking at skin', 'Use mild care and seek qualified advice for persistent concerns.'], ['Skipping sun protection', 'Use suitable daily sun protection when exposed, alongside shade and clothing.']] },
  'playbook-hair': { before: 'Notice your hair texture, wash frequency and the shape that is easiest for you to maintain.', after: 'You have a barber brief and a low-effort styling routine for normal days.', weekly: 'Plan one wash, condition and styling reset based on your own hair needs.', mistakes: [['Chasing a haircut that needs daily salon styling', 'Choose a cut that works with your natural texture.'], ['Using too much product', 'Start with a small amount and build only if needed.'], ['Ignoring scalp comfort', 'Prioritise gentle care and professional help for ongoing irritation or hair loss concerns.']] },
  'playbook-frame': { before: 'List movement you enjoy and one everyday meal habit you can make more regular.', after: 'You have a supportive movement, sleep and meal rhythm—not a punishing transformation plan.', weekly: 'Schedule enjoyable movement, basic meal preparation and proper recovery.', mistakes: [['Extreme diets or workouts', 'Choose sustainable food, movement and rest habits.'], ['Training through pain', 'Stop and consult a qualified professional when pain persists.'], ['Comparing your frame to edited images', 'Use strength, energy and comfort as your progress markers.']] },
  'playbook-posture': { before: 'Notice when you feel cramped at a desk, phone or bag—not how you look in a mirror.', after: 'You have simple movement breaks and a more comfortable daily setup.', weekly: 'Review desk height, walking breaks and any discomfort that needs professional attention.', mistakes: [['Forcing an exaggerated posture', 'Aim for comfortable, varied positions and regular movement.'], ['Ignoring pain or numbness', 'Seek a qualified clinician for symptoms that persist.'], ['Trying one stretch once', 'Use small frequent movement breaks instead.']] },
  'playbook-style': { before: 'Choose three occasions you dress for most and note what you already wear comfortably.', after: 'You can identify a repeatable silhouette, palette and fit preference.', weekly: 'Photograph or note two outfits that felt good in real life and learn from them.', mistakes: [['Buying a whole new identity', 'Upgrade one category at a time around your actual life.'], ['Prioritising labels over fit', 'Choose fit, fabric and comfort before branding.'], ['Saving outfits only for special days', 'Test them on ordinary days so they become usable.']] },
  'playbook-formulas': { before: 'Pick two dependable base colours and one accent you already own.', after: 'You have outfit formulas with item lists, not a confusing pile of inspiration.', weekly: 'Pre-build three outfits for the next week and note what is missing.', mistakes: [['Matching every item exactly', 'Use colour balance and proportions instead of strict matching.'], ['Buying one-off statement pieces', 'Start with pieces that work in at least three outfits.'], ['Ignoring shoe condition', 'Keep one clean everyday shoe option ready.']] },
  'playbook-photos': { before: 'Choose natural window light and a clean background before adjusting poses.', after: 'You can make simple photos that show fit, grooming and expression honestly.', weekly: 'Keep one reference photo only to document outfits and confidence over time.', mistakes: [['Using heavy filters as a benchmark', 'Use clear lighting and a true-to-life image.'], ['Over-posing', 'Use relaxed posture and a natural expression.'], ['Taking photos only to criticise yourself', 'Use them to evaluate clothing fit and presentation choices.']] },
  'playbook-presence': { before: 'Choose one situation where you want to feel calmer and more prepared.', after: 'You have a simple arrival routine: breathe, posture-check, make eye contact, listen.', weekly: 'Reflect on one conversation and one small improvement, without self-judgment.', mistakes: [['Performing confidence', 'Use curiosity, listening and clear speech instead.'], ['Trying to dominate every room', 'Focus on being present and respectful.'], ['Treating social skill as a fixed trait', 'Practise small behaviours repeatedly.']] },
  'playbook-reset': { before: 'Set aside a short weekly reset window and collect what needs repair, laundry or planning.', after: 'Your kit, calendar and clothes are easier to use when life gets busy.', weekly: 'Do a 30-minute reset: laundry, grooming kit, three outfits and next-week calendar.', mistakes: [['Making the reset too long', 'Use a short checklist you can finish.'], ['Waiting until everything is chaotic', 'Reset before the week begins.'], ['Buying duplicates because you cannot find items', 'Store essentials in one predictable place.']] },
  'playbook-maintenance': { before: 'Choose the few practices that genuinely improved your comfort, confidence or preparation.', after: 'You have a personal system that survives travel, work and imperfect weeks.', weekly: 'Keep the essentials, release the rest, and update your plan seasonally.', mistakes: [['Constantly searching for a better system', 'Keep a working routine long enough to learn from it.'], ['Making progress dependent on purchases', 'Use maintenance, repair and fit first.'], ['Turning habits into pressure', 'Return to the smallest helpful version after a missed week.']] }
};
const premiumChecklists = {
  grooming: { title: 'Grooming kit checklist', intro: 'A compact, comfortable baseline—choose products suitable for your own needs.', items: ['Gentle cleanser or body wash', 'Moisturiser suitable for your skin', 'Daily sun protection for outdoor exposure', 'Toothbrush, toothpaste and floss/interdental cleaner', 'Nail clipper and file', 'Deodorant', 'Hair brush or comb', 'A small towel and clean pillowcase routine'] },
  wardrobe: { title: 'Wardrobe essentials checklist', intro: 'Build a flexible base before buying trend pieces.', items: ['Two well-fitting tees or knit polos', 'One light shirt and one darker shirt/overshirt', 'One tailored neutral trouser and one clean denim', 'One comfortable pair of clean everyday shoes', 'One smarter shoe or loafer option', 'A light layer or jacket', 'Socks and underwear you can rely on', 'Simple belt, watch or accessory only if you enjoy wearing it'] },
  reset: { title: 'Weekly reset checklist', intro: 'A 30-minute reset that makes the next week easier.', items: ['Laundry and stain check', 'Steam, fold or hang next week’s core outfits', 'Clean everyday shoes', 'Restock grooming basics', 'Plan movement and rest', 'Prepare one easy meal or snack option', 'Check calendar for dress-code needs', 'Choose one small focus for the week'] }
};
const premiumExamples = [
  ['Face shapes', 'Use hair, glasses and necklines as optional framing tools. For example, a longer face may prefer less height at the crown; a rounder face may enjoy structure at the sides. Comfort and personal preference come first.'],
  ['Skin tones', 'Use contrast near the face. Fair/light skin can test navy, forest and burgundy; medium/wheatish skin can test cream, teal and olive; olive skin can test deep blue and terracotta; deep/dark skin can test crisp white, royal blue and emerald.'],
  ['Body types', 'Use fit and proportion rather than rules. A shorter frame may prefer cleaner vertical lines; a broader frame may prefer room through the shoulders; a taller frame can use layers to break up length. Tailoring and comfort matter most.'],
  ['Budgets', 'Starter: repair, clean and fit existing clothes. Builder: add versatile trousers, shirts and shoes. Investment: spend only on pieces you will repeat often, such as outerwear, footwear or tailoring.']
];
const premiumOutfitFormulas = [
  ['Clean everyday', 'White or cream tee · dark overshirt · straight dark denim · clean sneakers', 'A controlled light-to-dark contrast that works for errands, casual work and coffee.'],
  ['Warm-weather refined', 'Linen/cotton shirt · tailored shorts or light trousers · loafers or clean sandals · simple watch', 'Breathable texture and a relaxed fit keep the outfit intentional without looking formal.'],
  ['Smart casual', 'Fine knit or polo · neutral trousers · leather belt · loafers or minimal sneakers', 'The top is structured enough for a dinner or meeting while the trouser keeps the silhouette clean.'],
  ['Low-cost upgrade', 'Best-fitting existing tee · washed denim · clean shoes · one layer in navy, olive or charcoal', 'Fit, condition and colour harmony have more impact than a large shopping list.']
];
const premiumThirtyDayPlan = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;
  const phases = [
    ['Foundation', ['Write your personal goal and a realistic reason for it.', 'Take a neutral wardrobe and grooming inventory.', 'Choose a simple sleep and hydration cue.', 'Create a comfortable morning baseline.', 'Create a low-effort evening reset.', 'Choose one confident-but-natural outfit.', 'Review the week without judging the result.']],
    ['Grooming', ['Set up your basic grooming kit.', 'Test a gentle cleanse and moisturise routine.', 'Check sun-protection and outdoor habits.', 'Choose a manageable haircut or barber brief.', 'Practice a small hair styling routine.', 'Tidy nails, shoes and clothing care.', 'Review what felt comfortable and sustainable.']],
    ['Style', ['Choose your two base colours and one accent.', 'Build one clean everyday outfit.', 'Build one warm-weather or casual formula.', 'Build one smart-casual formula.', 'Try a fit adjustment or tailoring note.', 'Prepare three outfits for next week.', 'Wear one formula on an ordinary day and take a reference photo.']],
    ['Presence', ['Set a comfortable desk and phone-break routine.', 'Take a short walk or choose enjoyable movement.', 'Practice a calm arrival routine before one interaction.', 'Use one active-listening habit.', 'Refresh your weekly reset checklist.', 'Choose what to maintain next month.', 'Write your personal one-page plan and celebrate consistency.']]
  ];
  const phase = phases[Math.floor(index / 7)];
  return { day, phase: phase[0], action: phase[1][index % 7] };
});
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
const currentProfile = () => JSON.parse(localStorage.getItem(profileStore) || 'null');
function readPremiumProgress() {
  try { return { completedLessons: {}, completedDays: {}, personalNote: '', ...JSON.parse(localStorage.getItem(premiumProgressStore) || '{}') }; }
  catch { return { completedLessons: {}, completedDays: {}, personalNote: '' }; }
}
function savePremiumProgress(next) { localStorage.setItem(premiumProgressStore, JSON.stringify(next)); }
function lessonKey(chapterId, index) { return `${chapterId}:${index}`; }
function downloadChecklist(kind) {
  const checklist = premiumChecklists[kind];
  if (!checklist) return;
  const text = `${checklist.title}\n\n${checklist.intro}\n\n${checklist.items.map((item, index) => `${index + 1}. [ ] ${item}`).join('\n')}\n\nAuraMax note: ${premiumDisclaimer}`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${kind}-checklist.txt`; link.click(); URL.revokeObjectURL(url);
}
const activeGallery = () => galleryItems.length ? galleryItems : JSON.parse(localStorage.getItem(galleryStore) || 'null') || galleryFallback;
const imageMarkup = item => item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : `<div class="lookbook-image-placeholder"><span>${escapeHtml(item.category)}</span><strong>Image coming soon</strong></div>`;
const categoryItems = category => activeGallery().filter(item => item.category === category);
const learnGalleryMarkup = category => {
  const items = categoryItems(category);
  if (!items.length) return '';
  return `<section class="learn-gallery"><div class="learn-gallery-head"><div><p class="eyebrow">VIEW &amp; LEARN GALLERY</p><h3>Visual guides for ${escapeHtml(category)}</h3></div><span>${items.length} guide${items.length === 1 ? '' : 's'}</span></div><div class="learn-gallery-grid">${items.map(item => `<article class="learn-card">${imageMarkup(item)}<div class="learn-card-copy"><small>${escapeHtml(item.category)}</small><h3>${escapeHtml(item.title)}</h3><button type="button" class="learn-open" data-learn-item="${escapeHtml(item.id)}">View &amp; learn <span>→</span></button></div></article>`).join('')}</div></section>`;
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
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    galleryClient = createClient(config.supabaseUrl, config.supabasePublishableKey);
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
  appRoot.innerHTML = `<section class="auramax-intro"><p class="eyebrow">YOUR PERSONALISED LOOKBOOK</p><h2>Build your style, one practical choice at a time.</h2><p>${currentProfile() ? 'Your face and body selections are saved. Choose a category to start.' : 'Start with a category, then personalise your guide whenever you want.'}</p></section><section class="auramax-category-grid" aria-label="AuraMax categories"><button class="aura-category tone-gold" data-aura-view="colours">${visuals.colours}<span>01</span><h3>Color Combination</h3><p>Learn simple outfit colour formulas and see what pieces work together.</p><b>Explore colour ideas →</b></button><button class="aura-category tone-blue" data-aura-view="lookbook">${visuals.lookbook}<span>02</span><h3>Styling Guide · LookBook</h3><p>Browse real outfit inspiration with the details that make each look work.</p><b>Open the gallery →</b></button><button class="aura-category tone-green" data-aura-view="quick">${visuals.quick}<span>03</span><h3>Quick Looksmax Tips</h3><p>Fast, useful techniques for grooming, hair, skin, posture and presence.</p><b>Get quick tips →</b></button><button class="aura-category tone-red" data-aura-view="qa">${visuals.qa}<span>04</span><h3>Looksmax Q&amp;A Advanced</h3><p>Search clear answers, techniques and common mistakes without the noise.</p><b>Ask a question →</b></button><button class="aura-category tone-purple" data-aura-view="guide">${visuals.guide}<span>05</span><h3>Looksmax Complete Guide</h3><p>Go deeper with practical chapters on grooming, health, style and confidence.</p><b>Read the full guide →</b></button></section>`;
}
function renderColours() {
  const skinGuides = [
    { key:'fair', label:'Fair / light skin', note:'Create gentle contrast instead of letting pale colours wash you out.', best:['Navy','Charcoal','Forest green','Burgundy','Cobalt','Camel'], careful:'Very pale beige, icy grey or white close to your skin may look flat. Add a darker jacket, collar or accessory.', formulas:['Navy overshirt + white tee + stone trousers','Forest knit + charcoal trousers + white sneakers','Burgundy shirt + dark denim + brown leather'], swatch:['#152b4f','#343940','#315b46','#7b2638','#235bb5'] },
    { key:'medium', label:'Medium / wheatish skin', note:'Balanced contrast works well; rich colours and warm neutrals are dependable.', best:['Teal','Olive','Cream','Rust','Navy','Chocolate'], careful:'Khaki, mustard-beige or muted brown very close to your skin can blend in. Separate them with navy, cream or white.', formulas:['Teal polo + cream trousers + dark brown shoes','Olive jacket + white tee + dark denim','Rust overshirt + navy trousers + tan sneakers'], swatch:['#0e7775','#647042','#f1e8d5','#aa4d2b','#132d55'] },
    { key:'olive', label:'Olive skin', note:'Earthy and jewel tones complement the natural green-gold depth of olive skin.', best:['Emerald','Plum','Off-white','Terracotta','Deep blue','Warm grey'], careful:'Yellow-greens and dull khakis may echo your undertone too closely. Place a crisp neutral near your face.', formulas:['Emerald shirt + warm-grey trousers + black loafers','Off-white knit + deep-blue denim + brown boots','Terracotta tee + charcoal overshirt + ecru trousers'], swatch:['#087a55','#6c356f','#f4efe3','#b45336','#153a67'] },
    { key:'deep', label:'Deep / dark skin', note:'Clear contrast and saturated colour can look especially strong and intentional.', best:['Crisp white','Royal blue','Mustard','Emerald','Wine','Camel'], careful:'Head-to-toe dark brown or low-contrast charcoal may lose definition. Add cream, white, camel or a clear accent.', formulas:['Crisp white shirt + camel trousers + dark loafers','Royal-blue knit + grey trousers + white sneakers','Mustard overshirt + black tee + dark denim'], swatch:['#f7f5ee','#2454b5','#d69f19','#087a55','#78273d'] }
  ];
  appRoot.innerHTML = `${backButton()}<section class="auramax-page-head colour-guide-head"><p class="eyebrow">COLOR COMBINATION · SKIN-TONE GUIDE</p><h2>Choose colours that bring your face forward.</h2><p>Start with your approximate skin depth, then choose a category to see recommended colours, caution colours and ready-to-wear outfit formulas.</p></section>${learnGalleryMarkup('Color Combination')}<nav class="skin-tone-nav" aria-label="Choose a skin-tone guide">${skinGuides.map((guide,index)=>`<button type="button" class="${index===0?'active':''}" data-skin-guide="${guide.key}">${guide.label}</button>`).join('')}</nav><div>${skinGuides.map((guide,index)=>`<article class="skin-guide-card ${index===0?'active':''}" data-skin-panel="${guide.key}"><header><div><p class="eyebrow">PERSONALISED STARTING POINT</p><h3>${guide.label}</h3><p>${guide.note}</p></div><div class="skin-palette">${guide.swatch.map((colour,i)=>`<span style="--swatch:${colour}" title="${guide.best[i]}"></span>`).join('')}</div></header><section><h4>Colours to try first</h4><div class="colour-chips">${guide.best.map(colour=>`<span>${colour}</span>`).join('')}</div></section><section class="colour-caution"><h4>Use thoughtfully</h4><p>${guide.careful}</p></section><section><h4>Ready-to-wear outfit formulas</h4><ol class="outfit-formulas">${guide.formulas.map(formula=>`<li>${formula}</li>`).join('')}</ol></section></article>`).join('')}</div>`;
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
function renderGuide() {
  const chapters = window.AuraMax.chapters || [];
  activeGuideChapterId = null;
  activeGuideLessonIndex = null;
  appRoot.dataset.auraView = 'guide';
  const lessonCount = chapters.reduce((total, chapter) => total + (Array.isArray(chapter.lessons) ? chapter.lessons.length : 0), 0);
  appRoot.innerHTML = `${backButton()}<section class="auramax-page-head"><p class="eyebrow">AURAMAX PREMIUM PLAYBOOK</p><h2>Your complete 30-day healthy grooming and style system.</h2><p>A structured manual for grooming, skin, hair, movement, style, photos and presence. Work through one practical lesson at a time, then keep the habits that fit your real life.</p><div class="guide-value-summary"><span><b>${chapters.length}</b> premium chapters</span><span><b>${lessonCount}</b> practical lessons</span><span><b>30 days</b> guided actions</span></div></section><section class="premium-resource-grid" aria-label="Premium guide resources"><button type="button" data-aura-guide-resource="plan"><b>30-day plan</b><span>One clear action every day</span></button><button type="button" data-aura-guide-resource="checklists"><b>Downloadable checklists</b><span>Grooming, wardrobe and reset</span></button><button type="button" data-aura-guide-resource="examples"><b>Examples & formulas</b><span>Face, skin, fit and budget context</span></button><button type="button" data-aura-guide-resource="progress"><b>My saved plan</b><span>Track lessons and daily actions</span></button></section>${learnGalleryMarkup('Looksmax Complete Guide')}<section class="guide-chapter-directory" aria-label="AuraMax Complete Looksmax Playbook chapters"><div class="guide-directory-head"><div><p class="eyebrow">THE COMPLETE PLAYBOOK</p><h3>Choose your next chapter</h3></div><span>${chapters.length} chapters</span></div><div class="chapter-grid">${chapters.map(chapter => `<button type="button" class="chapter-card" data-aura-guide-chapter="${escapeHtml(chapter.id)}"><small>CHAPTER ${escapeHtml(chapter.tag)}</small><h3>${escapeHtml(chapter.name)}</h3><p>${escapeHtml(chapter.desc)}</p><span class="guide-card-action">Open chapter <b aria-hidden="true">→</b></span></button>`).join('')}</div></section><aside class="premium-disclaimer"><strong>Healthy, practical guidance only.</strong><span>${escapeHtml(premiumDisclaimer)}</span></aside>`;
}
function renderGuideResource(resource) {
  appRoot.dataset.auraView = 'guide-resource';
  document.body.classList.add('aura-inner-view');
  const progress = readPremiumProgress();
  if (resource === 'checklists') {
    appRoot.innerHTML = `<section class="premium-resource-page">${backButton()}<p class="eyebrow">DOWNLOADABLE TOOLS</p><h1>Checklists that make the guide usable.</h1><p class="premium-resource-lead">Download and tick these off in any notes app. They are intentionally practical rather than product-heavy.</p><div class="premium-checklist-grid">${Object.entries(premiumChecklists).map(([key, list]) => `<article><h2>${escapeHtml(list.title)}</h2><p>${escapeHtml(list.intro)}</p><ul>${list.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul><button type="button" data-download-checklist="${key}">Download checklist ↓</button></article>`).join('')}</div></section>`;
  } else if (resource === 'examples') {
    appRoot.innerHTML = `<section class="premium-resource-page">${backButton()}<p class="eyebrow">PRACTICAL EXAMPLES</p><h1>Adapt the system to your real life.</h1><p class="premium-resource-lead">These are flexible starting points, not labels or rules. The best option is the one that feels comfortable, suits your day and fits your budget.</p><div class="premium-example-grid">${premiumExamples.map(([title, copy]) => `<article><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></article>`).join('')}</div><h2 class="premium-section-title">Outfit formula library</h2><div class="premium-formula-grid">${premiumOutfitFormulas.map(([title, items, why]) => `<article><p class="eyebrow">${escapeHtml(title)}</p><h3>${escapeHtml(items)}</h3><p>${escapeHtml(why)}</p></article>`).join('')}</div></section>`;
  } else if (resource === 'plan') {
    appRoot.innerHTML = `<section class="premium-resource-page">${backButton()}<p class="eyebrow">30-DAY PERSONAL PLAN</p><h1>One useful action each day.</h1><p class="premium-resource-lead">Do not rush it. Missed days are normal—resume with the next practical action instead of restarting.</p><div class="premium-plan-grid">${premiumThirtyDayPlan.map(item => `<label class="premium-day ${progress.completedDays[item.day] ? 'complete' : ''}"><input type="checkbox" data-plan-day="${item.day}" ${progress.completedDays[item.day] ? 'checked' : ''}><span><b>Day ${item.day}</b><small>${escapeHtml(item.phase)}</small></span><em>${escapeHtml(item.action)}</em></label>`).join('')}</div></section>`;
  } else {
    const allLessons = (window.AuraMax.chapters || []).flatMap(chapter => (chapter.lessons || []).map((lesson, index) => ({ chapter, lesson, index })));
    const completeCount = allLessons.filter(item => progress.completedLessons[lessonKey(item.chapter.id, item.index)]).length;
    const dayCount = Object.keys(progress.completedDays).filter(day => progress.completedDays[day]).length;
    appRoot.innerHTML = `<section class="premium-resource-page">${backButton()}<p class="eyebrow">YOUR AURAMAX DASHBOARD</p><h1>Saved personal plan.</h1><p class="premium-resource-lead">This tracker is saved securely in this browser. It keeps your guide useful without turning it into a scorecard.</p><div class="premium-progress-summary"><article><b>${completeCount}/${allLessons.length}</b><span>Lessons completed</span></article><article><b>${dayCount}/30</b><span>30-day actions completed</span></article></div><label class="premium-plan-note"><span>Your personal focus</span><textarea data-premium-note placeholder="Example: I want a calmer weekly grooming and outfit reset.">${escapeHtml(progress.personalNote || '')}</textarea><small>Saved automatically on this device.</small></label><div class="premium-progress-actions"><button type="button" data-aura-guide-resource="plan">Open 30-day plan</button><button type="button" data-aura-guide-resource="checklists">Open checklists</button></div></section>`;
  }
  appRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const editorial = window.AuraMax.premiumGuideEditorial?.[chapter.id] || {};
  const chapterDetail = editorial.details?.[lessonIndex] || 'Choose the smallest useful version of this practice, repeat it for a week, and keep only the part that makes your everyday routine easier.';
  const nextDetail = editorial.details?.[(lessonIndex + 1) % (editorial.details?.length || 1)] || 'Keep the routine realistic enough to use on ordinary days.';
  const safetyNote = ['playbook-skin', 'playbook-hair', 'playbook-frame', 'playbook-posture'].includes(chapter.id)
    ? 'This is general education, not medical or treatment advice. Stop if something causes pain or irritation, and seek a qualified professional for persistent concerns.'
    : 'Use this as a practical reference, not a scorecard. Comfort, health and consistency matter more than copying an exact outcome.';
  const previous = lessonIndex > 0 ? lessonIndex - 1 : null;
  const next = lessonIndex < chapter.lessons.length - 1 ? lessonIndex + 1 : null;
  const resources = premiumChapterResources[chapter.id] || premiumChapterResources['playbook-start'];
  const progress = readPremiumProgress();
  const isComplete = Boolean(progress.completedLessons[lessonKey(chapter.id, lessonIndex)]);
  activeGuideChapterId = String(chapter.id);
  activeGuideLessonIndex = lessonIndex;
  appRoot.dataset.auraView = 'guide-lesson';
  document.body.classList.add('aura-inner-view');
  appRoot.innerHTML = `<article class="guide-reader"><button type="button" class="guide-back-button" data-aura-guide-back="chapter" data-aura-guide-chapter-id="${escapeHtml(chapter.id)}"><span aria-hidden="true">←</span> Back to ${escapeHtml(chapter.name)}</button><header><p class="eyebrow">CHAPTER ${escapeHtml(chapter.tag)} · LESSON ${String(lessonIndex + 1).padStart(2, '0')}</p><h1>${escapeHtml(title)}</h1><p class="guide-reader-lead">${escapeHtml(summary)}</p><p class="guide-reader-meta">AuraMax Premium Playbook · Estimated reading: 6 minutes</p></header><section class="guide-reader-article"><p>${escapeHtml(summary)} This lesson is designed to give you one reliable decision instead of another complicated rule. Take the principle into your real schedule, your budget and the clothes or tools you already own.</p><h2>Why this matters</h2><p>${escapeHtml(editorial.foundation || 'The best results come from consistent, low-friction routines rather than dramatic changes. Focus on actions you can repeat with care.')}</p><p>${escapeHtml(chapterDetail)}</p><h2>Make it work in real life</h2><p>${escapeHtml(editorial.practice || 'Keep the practice simple: test one adjustment, notice how it feels through a normal day, then refine it instead of starting over.')}</p><div class="guide-reader-focus"><p class="eyebrow">YOUR 7-DAY FOCUS</p><strong>${escapeHtml(title)}</strong><span>Repeat the smallest version of this practice for one week. Notice what feels easier, more comfortable or more prepared—not what looks perfect in a single moment.</span></div><h2>A detail to carry forward</h2><p>${escapeHtml(nextDetail)}</p></section><section class="guide-routine"><p class="eyebrow">BEFORE → AFTER ROUTINE</p><div><article><b>Before you begin</b><span>${escapeHtml(resources.before)}</span></article><article><b>What changes in practice</b><span>${escapeHtml(resources.after)}</span></article><article><b>Weekly reset</b><span>${escapeHtml(resources.weekly)}</span></article></div></section><section class="guide-reader-steps"><p class="eyebrow">PRACTICAL STEPS</p><h2>Put the lesson into practice</h2><ol><li>${escapeHtml(firstStep || 'Start with the smallest comfortable action you can repeat.')}</li><li>${escapeHtml(secondStep || 'Keep the routine simple enough to follow consistently.')}</li><li>Try it in a normal setting, not only when you have extra time or an event planned.</li><li>Review what feels useful after a week, then adjust one detail at a time.</li></ol></section><section class="guide-mistakes"><p class="eyebrow">COMMON MISTAKES → BETTER OPTIONS</p><div>${resources.mistakes.map(([mistake, instead]) => `<article><strong>${escapeHtml(mistake)}</strong><span><b>Do instead:</b> ${escapeHtml(instead)}</span></article>`).join('')}</div></section><aside class="guide-reader-note"><strong>Keep it personal.</strong><span>${escapeHtml(safetyNote)}</span></aside><aside class="guide-disclaimer"><strong>Healthy guidance only.</strong><span>${escapeHtml(premiumDisclaimer)}</span></aside><button type="button" class="guide-complete-button ${isComplete ? 'complete' : ''}" data-complete-lesson="${escapeHtml(lessonKey(chapter.id, lessonIndex))}">${isComplete ? '✓ Lesson saved as complete' : 'Mark this lesson complete'}</button><nav class="guide-reader-navigation" aria-label="Lesson navigation"><button type="button" ${previous === null ? 'disabled' : `data-aura-guide-navigate="${previous}" data-aura-guide-chapter-id="${escapeHtml(chapter.id)}"`}>← Previous lesson</button><button type="button" data-aura-guide-back="chapter" data-aura-guide-chapter-id="${escapeHtml(chapter.id)}">All lessons</button><button type="button" ${next === null ? 'disabled' : `data-aura-guide-navigate="${next}" data-aura-guide-chapter-id="${escapeHtml(chapter.id)}"`}>Next lesson →</button></nav></article>`;
  appRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderCurrentView() { const view = appRoot.dataset.auraView || 'hub'; if(view==='hub')renderHub(); if(view==='colours')renderColours(); if(view==='lookbook')renderLookbook(activeLookbookCategory); if(view==='lookbook-article')renderLookbookArticle(activeLookbookArticleId, activeLookbookCategory); if(view==='guide')renderGuide(); if(view==='guide-chapter')renderGuideChapter(activeGuideChapterId); if(view==='guide-lesson')renderGuideLesson(activeGuideChapterId, activeGuideLessonIndex); if(view==='guide-resource')renderGuideResource(appRoot.dataset.auraGuideResource || 'progress'); }
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
    const skinControl = event.target.closest('[data-skin-guide]');
    if (skinControl) {
      event.preventDefault();
      event.stopImmediatePropagation();
      appRoot.querySelectorAll('[data-skin-guide]').forEach(button => button.classList.toggle('active', button === skinControl));
      appRoot.querySelectorAll('[data-skin-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.skinPanel === skinControl.dataset.skinGuide));
      skinControl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      return;
    }
    const lookbookCategory = event.target.closest('[data-lookbook-category]');
    if (lookbookCategory) { event.preventDefault(); event.stopImmediatePropagation(); renderLookbook(lookbookCategory.dataset.lookbookCategory); return; }
    const lookbookItem = event.target.closest('[data-lookbook-item]');
    if (lookbookItem) { event.preventDefault(); event.stopImmediatePropagation(); renderLookbookArticle(lookbookItem.dataset.lookbookItem, lookbookItem.dataset.returnCategory || 'All'); return; }
    const lookbookReturn = event.target.closest('[data-lookbook-return]');
    if (lookbookReturn) { event.preventDefault(); event.stopImmediatePropagation(); renderLookbook(lookbookReturn.dataset.returnCategory || 'All'); return; }
    const guideChapterControl = event.target.closest('[data-aura-guide-chapter]');
    if (guideChapterControl) { event.preventDefault(); event.stopImmediatePropagation(); renderGuideChapter(guideChapterControl.dataset.auraGuideChapter); return; }
    const guideLessonControl = event.target.closest('[data-aura-guide-lesson]');
    if (guideLessonControl) { event.preventDefault(); event.stopImmediatePropagation(); renderGuideLesson(guideLessonControl.dataset.auraGuideChapterId, guideLessonControl.dataset.auraGuideLesson); return; }
    const guideBackControl = event.target.closest('[data-aura-guide-back]');
    if (guideBackControl) { event.preventDefault(); event.stopImmediatePropagation(); if (guideBackControl.dataset.auraGuideBack === 'chapters') renderGuide(); else renderGuideChapter(guideBackControl.dataset.auraGuideChapterId); return; }
    const guideNavigateControl = event.target.closest('[data-aura-guide-navigate]');
    if (guideNavigateControl) { event.preventDefault(); event.stopImmediatePropagation(); renderGuideLesson(guideNavigateControl.dataset.auraGuideChapterId, guideNavigateControl.dataset.auraGuideNavigate); return; }
    const guideResource = event.target.closest('[data-aura-guide-resource]');
    if (guideResource) { event.preventDefault(); event.stopImmediatePropagation(); appRoot.dataset.auraGuideResource = guideResource.dataset.auraGuideResource; renderGuideResource(guideResource.dataset.auraGuideResource); return; }
    const downloadControl = event.target.closest('[data-download-checklist]');
    if (downloadControl) { event.preventDefault(); event.stopImmediatePropagation(); downloadChecklist(downloadControl.dataset.downloadChecklist); return; }
    const completeLessonControl = event.target.closest('[data-complete-lesson]');
    if (completeLessonControl) { event.preventDefault(); event.stopImmediatePropagation(); const progress = readPremiumProgress(); const key = completeLessonControl.dataset.completeLesson; progress.completedLessons[key] = !progress.completedLessons[key]; savePremiumProgress(progress); renderGuideLesson(activeGuideChapterId, activeGuideLessonIndex); return; }
    const learnControl = event.target.closest('[data-learn-item]');
    if (learnControl) { event.preventDefault(); event.stopImmediatePropagation(); openLearnViewer(learnControl.dataset.learnItem); return; }
    if (event.target.closest('[data-close-learn]')) { event.preventDefault(); event.stopImmediatePropagation(); closeLearnViewer(); return; }
    const viewControl = event.target.closest('[data-aura-view]'); if(viewControl){event.preventDefault();event.stopImmediatePropagation();show(viewControl.dataset.auraView);return;} const legacyControl=event.target.closest('[data-view]'); if(legacyControl){event.preventDefault();event.stopImmediatePropagation();show(legacyControl.dataset.view==='style'?'lookbook':legacyControl.dataset.view);return;} const chapterControl=event.target.closest('[data-aura-chapter]');if(chapterControl){event.preventDefault();event.stopImmediatePropagation();window.AuraMax.chapter(chapterControl.dataset.auraChapter);return;}if(event.target.closest('#open-admin')){event.preventDefault();event.stopImmediatePropagation();openGalleryAdmin();}
  }, true);
  document.addEventListener('change', event => {
    const day = event.target.closest('[data-plan-day]');
    if (day) { const progress = readPremiumProgress(); progress.completedDays[day.dataset.planDay] = day.checked; savePremiumProgress(progress); day.closest('.premium-day')?.classList.toggle('complete', day.checked); }
  });
  document.addEventListener('input', event => {
    const note = event.target.closest('[data-premium-note]');
    if (note) { const progress = readPremiumProgress(); progress.personalNote = note.value; savePremiumProgress(progress); }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLearnViewer(); });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', event => {event.preventDefault();event.stopImmediatePropagation();show(button.dataset.view==='style'?'lookbook':button.dataset.view);}, true)); show('hub');
}
window.addEventListener('load', () => {
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
        requestAnimationFrame(() => show('hub'));
      }
      wasOpen = isOpen;
    }).observe(onboarding, { attributes: true, attributeFilter: ['class'] });
  }
});

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
