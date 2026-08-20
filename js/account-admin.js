const config = window.AURAMAX_CONFIG || {};
const savedKey = 'auramax-web-saved-lessons';
const contentKey = 'auramax-admin-content';
const imageKey = 'auramax-admin-images';
let supabase = null;
let session = null;
let localUser = JSON.parse(localStorage.getItem('auramax-local-user') || 'null');

const root = document.querySelector('#view-root');
const accountButton = document.querySelector('#account-button');
const adminEmails = (config.adminEmails || []).map(email => email.toLowerCase());
const isAdmin = () => adminEmails.includes((session?.user?.email || localUser?.email || '').toLowerCase());
const saved = () => JSON.parse(localStorage.getItem(savedKey) || '[]');
const images = () => JSON.parse(localStorage.getItem(imageKey) || '{}');
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const lessonId = (chapter, lesson) => `${chapter.id}:${lesson[0]}`;

function persistContent() {
  localStorage.setItem(contentKey, JSON.stringify(window.AuraMax.chapters));
}

function loadLocalContent() {
  const stored = localStorage.getItem(contentKey);
  if (!stored) return;
  try {
    const chapters = JSON.parse(stored);
    if (Array.isArray(chapters) && chapters.length) window.AuraMax.chapters.splice(0, window.AuraMax.chapters.length, ...chapters);
  } catch { localStorage.removeItem(contentKey); }
}

async function connectSupabase() {
  if (!config.supabaseUrl || !config.supabasePublishableKey) return;
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  ({ data: { session } } = await supabase.auth.getSession());
  supabase.auth.onAuthStateChange((_event, nextSession) => { session = nextSession; updateAccountLabel(); });
}

function updateAccountLabel() {
  if (!accountButton) return;
  const email = session?.user?.email || localUser?.email;
  accountButton.textContent = email ? (isAdmin() ? 'Admin' : 'Dashboard') : 'Sign in';
}

function openAccount() {
  // Mark this view so async gallery loading cannot redraw it as the category hub.
  root.dataset.auraView = 'account';
  const email = session?.user?.email || localUser?.email;
  const activeSaved = saved();
  const savedLessons = window.AuraMax.chapters.flatMap(chapter => chapter.lessons.map(lesson => ({ chapter, lesson }))).filter(item => activeSaved.includes(lessonId(item.chapter, item.lesson)));
  root.innerHTML = `<button class="text-link back" data-return>← Back to categories</button><section class="account-page"><p class="eyebrow">YOUR AURAMAX ACCOUNT</p><h2>${email ? `Welcome, ${esc(email.split('@')[0])}.` : 'Sign in to keep your saved lessons.'}</h2>${email ? `<div class="account-grid"><article><h3>Subscription</h3><p>${session ? 'Signed in — subscription status syncs with your payment record.' : 'Preview mode — connect Supabase to sync subscription status.'}</p></article><article><h3>Saved lessons</h3><p>${savedLessons.length} lesson${savedLessons.length === 1 ? '' : 's'} saved on this device.</p>${savedLessons.map(({chapter,lesson}) => `<button class="saved-link" data-open-lesson="${esc(lessonId(chapter,lesson))}">${esc(chapter.name)} · ${esc(lesson[0])}</button>`).join('') || '<p>Save a lesson while reading to find it here.</p>'}</article></div><div class="account-links">${isAdmin() ? '<button class="button primary" id="open-admin">Open admin dashboard</button>' : ''}<button class="text-link" id="sign-out">Sign out</button></div>` : `<form id="auth-form" class="auth-card"><label>Email<input required type="email" name="email" autocomplete="email"></label><label>Password<input required type="password" name="password" minlength="8" autocomplete="current-password"></label><p class="auth-note">${supabase ? 'Your account, saved lessons and access can sync securely.' : 'Preview mode is active. Add your Supabase publishable key to enable live sign-in.'}</p><button class="button primary" type="submit">Sign in</button><button class="text-link" type="button" id="create-account">Create account</button><button class="text-link" type="button" id="reset-password">Forgot password?</button></form>`}</section>`;
  root.querySelector('[data-return]').onclick = () => window.AuraMax.show('hub');
  root.querySelectorAll('[data-open-lesson]').forEach(button => button.onclick = () => openSavedLesson(button.dataset.openLesson));
  root.querySelector('#open-admin')?.addEventListener('click', openAdmin);
  root.querySelector('#sign-out')?.addEventListener('click', signOut);
  root.querySelector('#auth-form')?.addEventListener('submit', signIn);
  root.querySelector('#create-account')?.addEventListener('click', createAccount);
  root.querySelector('#reset-password')?.addEventListener('click', resetPassword);
  root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openSavedLesson(id) {
  for (const chapter of window.AuraMax.chapters) {
    const index = chapter.lessons.findIndex(lesson => lessonId(chapter, lesson) === id);
    if (index !== -1) return window.AuraMax.lesson(chapter, index);
  }
}

async function signIn(event) {
  event.preventDefault();
  event.stopPropagation();
  const data = new FormData(event.currentTarget); const email = data.get('email').trim(); const password = data.get('password');
  if (supabase) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) return alert(error.message); }
  else { localUser = { email }; localStorage.setItem('auramax-local-user', JSON.stringify(localUser)); }
  updateAccountLabel(); openAccount();
}

async function createAccount() {
  const form = root.querySelector('#auth-form'); const data = new FormData(form); const email = data.get('email').trim(); const password = data.get('password');
  if (!supabase) return alert('Add the Supabase publishable key in js/auramax-config.js to create live accounts.');
  const { error } = await supabase.auth.signUp({ email, password }); if (error) return alert(error.message); alert('Check your email to confirm your AuraMax account.');
}

async function resetPassword() {
  const email = root.querySelector('[name=email]')?.value?.trim();
  if (!email) return alert('Enter your email address first.');
  if (!supabase) return alert('Add the Supabase publishable key in js/auramax-config.js to enable password reset.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname}` });
  alert(error ? error.message : 'Password reset email sent.');
}

async function signOut() {
  if (supabase) await supabase.auth.signOut();
  localUser = null; localStorage.removeItem('auramax-local-user'); updateAccountLabel(); openAccount();
}

function openAdmin() {
  if (!isAdmin()) return;
  const chapters = window.AuraMax.chapters;
  root.innerHTML = `<button class="text-link back" id="back-account">← Back to account</button><section class="admin-page"><p class="eyebrow">ADMIN DASHBOARD</p><h2>Manage the lookbook.</h2><p>Changes are stored in this browser in preview mode. With Supabase storage configured, image files can be shared across devices.</p><div class="admin-layout"><aside><h3>Chapters</h3><div class="admin-list">${chapters.map((chapter,index) => `<button data-admin-chapter="${index}">${String(index+1).padStart(2,'0')} · ${esc(chapter.name)}</button>`).join('')}</div><button class="text-link" id="add-chapter">+ Add chapter</button></aside><div id="admin-editor"><p>Select a chapter to edit its lessons.</p></div></div></section>`;
  root.querySelector('#back-account').onclick = openAccount;
  root.querySelectorAll('[data-admin-chapter]').forEach(button => button.onclick = () => editChapter(Number(button.dataset.adminChapter)));
  root.querySelector('#add-chapter').onclick = addChapter;
}

function editChapter(index) {
  const chapter = window.AuraMax.chapters[index]; const editor = root.querySelector('#admin-editor');
  editor.innerHTML = `<div class="editor-head"><h3>${esc(chapter.name)}</h3><button class="text-link danger" id="delete-chapter">Delete chapter</button></div><label>Chapter title<input id="chapter-title" value="${esc(chapter.name)}"></label><label>Description<textarea id="chapter-desc">${esc(chapter.desc)}</textarea></label><button class="button primary" id="save-chapter">Save chapter</button><h3>Lessons</h3><div class="admin-lessons">${chapter.lessons.map((lesson,lessonIndex) => `<article><b>${esc(lesson[0])}</b><button data-edit-lesson="${lessonIndex}">Edit</button><button data-delete-lesson="${lessonIndex}">Delete</button></article>`).join('')}</div><button class="text-link" id="add-lesson">+ Add lesson</button>`;
  editor.querySelector('#save-chapter').onclick = () => { chapter.name = editor.querySelector('#chapter-title').value.trim() || chapter.name; chapter.desc = editor.querySelector('#chapter-desc').value.trim(); persistContent(); editChapter(index); };
  editor.querySelector('#delete-chapter').onclick = () => { if (confirm(`Delete ${chapter.name}?`)) { window.AuraMax.chapters.splice(index,1); persistContent(); openAdmin(); } };
  editor.querySelectorAll('[data-edit-lesson]').forEach(button => button.onclick = () => editLesson(index, Number(button.dataset.editLesson)));
  editor.querySelectorAll('[data-delete-lesson]').forEach(button => button.onclick = () => { if (confirm('Delete this lesson?')) { chapter.lessons.splice(Number(button.dataset.deleteLesson),1); persistContent(); editChapter(index); } });
  editor.querySelector('#add-lesson').onclick = () => { chapter.lessons.push(['New lesson','Brief, clear lesson purpose.','First practical step.','Second practical step.']); persistContent(); editChapter(index); };
}

function editLesson(chapterIndex, lessonIndex) {
  const chapter = window.AuraMax.chapters[chapterIndex]; const lesson = chapter.lessons[lessonIndex]; const editor = root.querySelector('#admin-editor'); const id = lessonId(chapter, lesson); const currentImage = images()[id];
  editor.innerHTML = `<button class="text-link" id="back-chapter">← Back to ${esc(chapter.name)}</button><h3>Edit lesson</h3><label>Title<input id="lesson-title" value="${esc(lesson[0])}"></label><label>Summary<textarea id="lesson-summary">${esc(lesson[1])}</textarea></label><label>Step one<textarea id="lesson-step-one">${esc(lesson[2])}</textarea></label><label>Step two<textarea id="lesson-step-two">${esc(lesson[3])}</textarea></label><div class="admin-image"><h3>Lesson image</h3>${currentImage ? `<img src="${currentImage}" alt="Current lesson image">` : '<p>No image selected.</p>'}<input id="lesson-image" type="file" accept="image/*"><small>Admin only. In preview mode this image stays in this browser; configure Supabase Storage for shared uploads.</small></div><button class="button primary" id="save-lesson">Save lesson</button>`;
  editor.querySelector('#back-chapter').onclick = () => editChapter(chapterIndex);
  editor.querySelector('#save-lesson').onclick = () => { const oldId = lessonId(chapter, lesson); lesson[0] = editor.querySelector('#lesson-title').value.trim() || lesson[0]; lesson[1] = editor.querySelector('#lesson-summary').value.trim(); lesson[2] = editor.querySelector('#lesson-step-one').value.trim(); lesson[3] = editor.querySelector('#lesson-step-two').value.trim(); const file = editor.querySelector('#lesson-image').files[0]; if (file) { const reader = new FileReader(); reader.onload = () => { const nextImages = images(); delete nextImages[oldId]; nextImages[lessonId(chapter, lesson)] = reader.result; localStorage.setItem(imageKey, JSON.stringify(nextImages)); persistContent(); editLesson(chapterIndex, lessonIndex); }; reader.readAsDataURL(file); return; } persistContent(); editLesson(chapterIndex, lessonIndex); };
}

function addChapter() {
  const chapters = window.AuraMax.chapters; chapters.push({ id: `chapter-${Date.now()}`, name: 'New chapter', tag: String(chapters.length + 1).padStart(2,'0'), desc: 'Add a clear chapter description.', lessons: [] }); persistContent(); openAdmin();
}

function enhanceLessons() {
  const reader = root.querySelector('.reader'); if (!reader || reader.querySelector('.save-lesson')) return;
  const title = reader.querySelector('h1')?.textContent; const eyebrow = reader.querySelector('.eyebrow')?.textContent || ''; const chapter = window.AuraMax.chapters.find(item => eyebrow.includes(`CHAPTER ${item.tag}`)); const lesson = chapter?.lessons.find(item => item[0] === title); if (!chapter || !lesson) return;
  const id = lessonId(chapter, lesson); const image = images()[id]; const button = document.createElement('button'); button.className = 'text-link save-lesson'; button.textContent = saved().includes(id) ? '★ Saved' : '☆ Save lesson'; button.onclick = () => { const entries = saved(); const next = entries.includes(id) ? entries.filter(item => item !== id) : [...entries, id]; localStorage.setItem(savedKey, JSON.stringify(next)); button.textContent = next.includes(id) ? '★ Saved' : '☆ Save lesson'; };
  reader.prepend(button);
  if (image) { const figure = document.createElement('figure'); figure.className = 'lesson-admin-image'; figure.innerHTML = `<img src="${image}" alt="${esc(title)}"><figcaption>Lesson illustration</figcaption>`; reader.querySelector('h1')?.insertAdjacentElement('afterend', figure); }
}

loadLocalContent();
await connectSupabase();
updateAccountLabel();
accountButton?.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  openAccount();
});
new MutationObserver(enhanceLessons).observe(root, { childList: true, subtree: true });
enhanceLessons();
