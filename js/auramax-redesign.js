const appRoot = document.querySelector('#view-root');
const config = window.AURAMAX_CONFIG || {};
const profileStore = 'auramax-web-profile';
const galleryStore = 'auramax-lookbook-gallery';
const galleryFallback = [
  { id: 'quiet-luxury', category: 'Quiet luxury', title: 'Quiet luxury, made practical', description: 'Use clean layers, soft neutrals and pieces that fit well. The goal is calm polish, not labels.', image_url: '' },
  { id: 'smart-casual', category: 'Smart casual', title: 'A dependable smart-casual formula', description: 'Start with dark straight-leg trousers, a textured knit or shirt and simple leather footwear.', image_url: '' },
  { id: 'streetwear', category: 'Streetwear', title: 'Streetwear with balance', description: 'Let one statement piece lead. Keep the remaining silhouette, colours and shoes more controlled.', image_url: '' },
];
let galleryItems = [];
let galleryClient = null;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const currentProfile = () => JSON.parse(localStorage.getItem(profileStore) || 'null');
const activeGallery = () => galleryItems.length ? galleryItems : JSON.parse(localStorage.getItem(galleryStore) || 'null') || galleryFallback;
const imageMarkup = item => item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : `<div class="lookbook-image-placeholder"><span>${escapeHtml(item.category)}</span><strong>Image coming soon</strong></div>`;
const categoryItems = category => activeGallery().filter(item => item.category === category);
const learnGalleryMarkup = category => {
  const items = categoryItems(category);
  if (!items.length) return '';
  return `<section class="learn-gallery"><div class="learn-gallery-head"><div><p class="eyebrow">VIEW &amp; LEARN GALLERY</p><h3>Visual guides for ${escapeHtml(category)}</h3></div><span>${items.length} guide${items.length === 1 ? '' : 's'}</span></div><div class="learn-gallery-grid">${items.map(item => `<article class="learn-card">${imageMarkup(item)}<div class="learn-card-copy"><small>${escapeHtml(item.category)}</small><h3>${escapeHtml(item.title)}</h3><details><summary>View &amp; learn <span>→</span></summary><p>${escapeHtml(item.description)}</p></details></div></article>`).join('')}</div></section>`;
};
const appendCategoryGallery = category => appRoot.insertAdjacentHTML('beforeend', learnGalleryMarkup(category));

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
function backButton() { return '<button class="text-link back" data-aura-view="hub">← All categories</button>'; }
function renderHub() {
  appRoot.innerHTML = `<section class="auramax-intro"><p class="eyebrow">YOUR PERSONALISED LOOKBOOK</p><h2>Build your style, one practical choice at a time.</h2><p>${currentProfile() ? 'Your face and body selections are saved. Choose a category to start.' : 'Start with a category, then personalise your guide whenever you want.'}</p></section><section class="auramax-category-grid" aria-label="AuraMax categories"><button class="aura-category tone-gold" data-aura-view="colours"><span>01</span><h3>Color Combination</h3><p>Learn simple outfit colour formulas and see what pieces work together.</p><b>Explore colour ideas →</b></button><button class="aura-category tone-blue" data-aura-view="lookbook"><span>02</span><h3>Styling Guide · LookBook</h3><p>Browse real outfit inspiration with the details that make each look work.</p><b>Open the gallery →</b></button><button class="aura-category tone-green" data-aura-view="quick"><span>03</span><h3>Quick Looksmax Tips</h3><p>Fast, useful techniques for grooming, hair, skin, posture and presence.</p><b>Get quick tips →</b></button><button class="aura-category tone-purple" data-aura-view="guide"><span>04</span><h3>Looksmax Complete Guide</h3><p>Go deeper with practical chapters on grooming, health, style and confidence.</p><b>Read the full guide →</b></button><button class="aura-category tone-red" data-aura-view="qa"><span>05</span><h3>Looksmax Q&amp;A Advanced</h3><p>Search clear answers, techniques and common mistakes without the noise.</p><b>Ask a question →</b></button></section>`;
}
function renderColours() {
  const skinGuides = [
    { key:'fair', label:'Fair / light skin', note:'Create gentle contrast instead of letting pale colours wash you out.', best:['Navy','Charcoal','Forest green','Burgundy','Cobalt','Camel'], careful:'Very pale beige, icy grey or white close to your skin may look flat. Add a darker jacket, collar or accessory.', formulas:['Navy overshirt + white tee + stone trousers','Forest knit + charcoal trousers + white sneakers','Burgundy shirt + dark denim + brown leather'], swatch:['#152b4f','#343940','#315b46','#7b2638','#235bb5'] },
    { key:'medium', label:'Medium / wheatish skin', note:'Balanced contrast works well; rich colours and warm neutrals are dependable.', best:['Teal','Olive','Cream','Rust','Navy','Chocolate'], careful:'Khaki, mustard-beige or muted brown very close to your skin can blend in. Separate them with navy, cream or white.', formulas:['Teal polo + cream trousers + dark brown shoes','Olive jacket + white tee + dark denim','Rust overshirt + navy trousers + tan sneakers'], swatch:['#0e7775','#647042','#f1e8d5','#aa4d2b','#132d55'] },
    { key:'olive', label:'Olive skin', note:'Earthy and jewel tones complement the natural green-gold depth of olive skin.', best:['Emerald','Plum','Off-white','Terracotta','Deep blue','Warm grey'], careful:'Yellow-greens and dull khakis may echo your undertone too closely. Place a crisp neutral near your face.', formulas:['Emerald shirt + warm-grey trousers + black loafers','Off-white knit + deep-blue denim + brown boots','Terracotta tee + charcoal overshirt + ecru trousers'], swatch:['#087a55','#6c356f','#f4efe3','#b45336','#153a67'] },
    { key:'deep', label:'Deep / dark skin', note:'Clear contrast and saturated colour can look especially strong and intentional.', best:['Crisp white','Royal blue','Mustard','Emerald','Wine','Camel'], careful:'Head-to-toe dark brown or low-contrast charcoal may lose definition. Add cream, white, camel or a clear accent.', formulas:['Crisp white shirt + camel trousers + dark loafers','Royal-blue knit + grey trousers + white sneakers','Mustard overshirt + black tee + dark denim'], swatch:['#f7f5ee','#2454b5','#d69f19','#087a55','#78273d'] }
  ];
  const universal = [['Navy + white + tan','A reliable smart-casual combination with clear contrast.'],['Charcoal + cream + one accent','Add burgundy, teal or cobalt near the face.'],['Olive + ecru + brown','A relaxed earth-tone formula with visible light–dark separation.'],['Denim + white + personal accent','Use denim as the neutral and one colour you genuinely enjoy.']];
  appRoot.innerHTML = `${backButton()}<section class="auramax-page-head colour-guide-head"><p class="eyebrow">COLOR COMBINATION · SKIN-TONE GUIDE</p><h2>Choose colours that bring your face forward.</h2><p>Start with your approximate skin depth, then adjust for undertone, contrast and personal preference. These are useful starting points—not rules.</p></section>${learnGalleryMarkup('Color Combination')}<section class="undertone-helper"><div><p class="eyebrow">QUICK UNDERTONE CHECK</p><h3>Warm, cool or neutral?</h3></div><div class="undertone-options"><p><b>Warm</b><span>Gold and cream often feel harmonious. Try olive, rust, camel and warm navy.</span></p><p><b>Cool</b><span>Silver and bright white often feel cleaner. Try cobalt, charcoal, burgundy and cool green.</span></p><p><b>Neutral</b><span>Both directions tend to work. Choose based on contrast and occasion.</span></p></div><small>Test in daylight. Hold a colour near your face—if your skin looks clearer and your eyes stand out, it is working.</small></section><nav class="skin-tone-nav" aria-label="Choose a skin-tone guide">${skinGuides.map((guide,index)=>`<button type="button" class="${index===0?'active':''}" data-skin-guide="${guide.key}">${guide.label}</button>`).join('')}</nav><div>${skinGuides.map((guide,index)=>`<article class="skin-guide-card ${index===0?'active':''}" data-skin-panel="${guide.key}"><header><div><p class="eyebrow">PERSONALISED STARTING POINT</p><h3>${guide.label}</h3><p>${guide.note}</p></div><div class="skin-palette">${guide.swatch.map((colour,i)=>`<span style="--swatch:${colour}" title="${guide.best[i]}"></span>`).join('')}</div></header><section><h4>Colours to try first</h4><div class="colour-chips">${guide.best.map(colour=>`<span>${colour}</span>`).join('')}</div></section><section class="colour-caution"><h4>Use thoughtfully</h4><p>${guide.careful}</p></section><section><h4>Ready-to-wear outfit formulas</h4><ol class="outfit-formulas">${guide.formulas.map(formula=>`<li>${formula}</li>`).join('')}</ol></section></article>`).join('')}</div><section class="universal-combos"><p class="eyebrow">WORKS ACROSS SKIN TONES</p><h3>Four dependable combinations</h3><div class="universal-grid">${universal.map(([title,text],index)=>`<article><span>${String(index+1).padStart(2,'0')}</span><h4>${title}</h4><p>${text}</p></article>`).join('')}</div><p class="colour-rule"><b>The simple 60–30–10 rule:</b> use one base colour for roughly 60% of the outfit, a supporting colour for 30%, and an accent for 10%. Fit and confidence still matter more than perfect colour theory.</p></section>`;
  appRoot.querySelectorAll('[data-skin-guide]').forEach(button=>button.addEventListener('click',()=>{appRoot.querySelectorAll('[data-skin-guide]').forEach(item=>item.classList.toggle('active',item===button));appRoot.querySelectorAll('[data-skin-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.skinPanel===button.dataset.skinGuide));}));
}
function renderLookbook() { const uploaded=categoryItems('Styling Guide · LookBook'); const items=uploaded.length?uploaded:galleryFallback; appRoot.innerHTML = `${backButton()}<section class="auramax-page-head"><p class="eyebrow">STYLING GUIDE · LOOKBOOK</p><h2>Outfit inspiration with a reason behind every choice.</h2><p>Save ideas that fit your own climate, budget, comfort and lifestyle. New admin uploads appear here automatically.</p></section><div class="lookbook-grid">${items.map(item => `<article class="lookbook-card">${imageMarkup(item)}<div><small>${escapeHtml(item.category)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div></article>`).join('')}</div>`; }
function renderGuide() { const chapters = window.AuraMax.chapters || []; appRoot.innerHTML = `${backButton()}<section class="auramax-page-head"><p class="eyebrow">LOOKSMAX COMPLETE GUIDE</p><h2>Build the fundamentals before chasing details.</h2><p>Choose a chapter and work through a few lessons at a time.</p></section>${learnGalleryMarkup('Looksmax Complete Guide')}<div class="chapter-grid">${chapters.map(chapter => `<button class="chapter-card" data-aura-chapter="${escapeHtml(chapter.id)}"><small>CHAPTER ${escapeHtml(chapter.tag)}</small><h3>${escapeHtml(chapter.name)}</h3><p>${escapeHtml(chapter.desc)}</p></button>`).join('')}</div>`; }
function renderCurrentView() { const view = appRoot.dataset.auraView || 'hub'; if(view==='hub')renderHub(); if(view==='colours')renderColours(); if(view==='lookbook')renderLookbook(); if(view==='guide')renderGuide(); }
function show(view) { appRoot.dataset.auraView = view; if(view==='quick'||view==='qa'){window.AuraMax.legacyShow(view);appendCategoryGallery(view==='quick'?'Quick Looksmax Tips':'Looksmax Q&A Advanced');appRoot.scrollIntoView({behavior:'smooth',block:'start'});return;} renderCurrentView(); appRoot.scrollIntoView({behavior:'smooth',block:'start'}); }
function installNavigation() {
  const legacyShow = window.AuraMax.show; window.AuraMax.legacyShow = legacyShow; window.AuraMax.show = show;
  document.addEventListener('click', event => { const viewControl = event.target.closest('[data-aura-view]'); if(viewControl){event.preventDefault();event.stopImmediatePropagation();show(viewControl.dataset.auraView);return;} const legacyControl=event.target.closest('[data-view]'); if(legacyControl){event.preventDefault();event.stopImmediatePropagation();show(legacyControl.dataset.view==='style'?'lookbook':legacyControl.dataset.view);return;} const chapterControl=event.target.closest('[data-aura-chapter]');if(chapterControl){event.preventDefault();event.stopImmediatePropagation();window.AuraMax.chapter(chapterControl.dataset.auraChapter);return;}if(event.target.closest('#open-admin')){event.preventDefault();event.stopImmediatePropagation();openGalleryAdmin();}}, true);
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
  appRoot.innerHTML = `${backButton()}<section class="auramax-page-head"><p class="eyebrow">ADMIN · LOOKBOOK GALLERY</p><h2>Publish a new outfit guide.</h2><p>Upload one image with a clear category, title and practical styling explanation. Published items appear in the LookBook automatically.</p></section><form id="gallery-upload-form" class="gallery-admin-form"><label>Gallery category<select name="category"><option>Quiet luxury</option><option>Smart casual</option><option>Streetwear</option><option>Formalwear</option><option>Summer outfits</option><option>Winter layering</option><option>Colour combination</option></select></label><label>Title<input name="title" required maxlength="100" placeholder="e.g. Navy overshirt with light-wash denim"></label><label>Style details<textarea name="description" required maxlength="500" placeholder="Explain why the outfit works, how to wear it, and useful alternatives."></textarea></label><label>Outfit image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required></label><label class="publish-toggle"><input name="published" type="checkbox" checked> Publish this item immediately</label><button class="button primary" type="submit">Upload to LookBook</button><p class="gallery-upload-status" role="status"></p></form>`;
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
