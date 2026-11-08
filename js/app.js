import { GROUPS, WORKSHEETS, sheetById } from './worksheets.js?v=202611080330';
import {
  play,
  stop,
  onAudioEvent,
  engineSummary,
  getSettings,
  saveSettings,
  fetchSubscription,
  clearAudioCache,
  checkScript,
  loadVoices,
} from './tts.js?v=202611080330';
import { handleRecorderClick } from './recorder.js?v=202611080330';
import { handleBookClick, playClip, playClips, parseClip, bookList } from './book.js?v=202611080330';
import { esc, toast } from './ui.js?v=202611080330';
import { initVoicePanel, open as openVoicePanel } from './voice-panel.js?v=202611080330';
import { renderHome } from './views/home.js?v=202611080330';
import { renderSheet, handleSheetClick, handleNameForm, resetSheet } from './views/sheet.js?v=202611080330';
import { renderSettings, renderCredits, bookTableHtml } from './views/settings.js?v=202611080330';
import { applyLinkParams, flushQueue, isSheetUrl, testConnection } from './sheets.js?v=202611080330';

const root = document.documentElement;
const main = document.getElementById('main');
const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('scrim');
const menuBtn = document.getElementById('menu-btn');
const engineEl = document.getElementById('engine');
const engineLabel = document.getElementById('engine-label');
const stopBtn = document.getElementById('stop-btn');
const themeBtn = document.getElementById('theme-btn');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ─── theme ──────────────────────────────────────────────────────────────────

function currentTheme() {
  return root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
themeBtn.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = next;
    try {
      localStorage.setItem('rl.theme', next);
    } catch {
      /* storage unavailable */
    }
  };
  if (document.startViewTransition && !reducedMotion.matches) document.startViewTransition(apply);
  else apply();
});

// ─── navigation ─────────────────────────────────────────────────────────────

function renderSidebar(active) {
  let n = 0;
  const link = (href, label, num = '') =>
    `<a class="nav-link" href="${href}"${active === href ? ' aria-current="page"' : ''}>${num ? `<span class="nav-num">${num}</span>` : ''}<span>${label}</span></a>`;
  sidebar.innerHTML = `
    <div class="nav-group">${link('#/', 'Overview')}</div>
    ${GROUPS.map(
      (g) => `<div class="nav-group">
        <div class="nav-title">${esc(g.title)}<small>Pronouncing American English · Unit 5</small></div>
        ${g.ids
          .map((id) => {
            const s = sheetById(id);
            return link(`#/sheet/${id}`, `<b class="nav-short">${esc(s.short)}</b> ${esc(s.title)}`, String(++n).padStart(2, '0'));
          })
          .join('')}
      </div>`,
    ).join('')}
    <div class="nav-group">${link('#/settings', 'Voice, recordings &amp; results')}</div>`;
}

function setMenu(open) {
  sidebar.classList.toggle('open', open);
  scrim.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
}
menuBtn.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
scrim.addEventListener('click', () => setMenu(false));

// Staggered reveal as elements scroll into view.
const REVEAL = [
  '.topic-head > *',
  '.part-h',
  '.part-text',
  '.step',
  '.set-card',
  '.how-grid > .card',
  '.home-section > h2',
  '.group-head',
  '.settings-stack > *',
].join(',');

const observer =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          let n = 0;
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            e.target.style.setProperty('--i', Math.min(n++, 10));
            e.target.classList.add('in');
            observer.unobserve(e.target);
          }
        },
        { rootMargin: '0px 0px -6% 0px', threshold: 0.02 },
      )
    : null;

function reveal(scope) {
  if (!observer || reducedMotion.matches) return;
  scope.querySelectorAll(REVEAL).forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

function view(parts) {
  if (!parts.length) return { html: renderHome(), active: '#/', title: 'Rhythm Lab · Content words, function words and rhythm' };
  if (parts[0] === 'sheet') {
    resetSheet();
    const html = renderSheet(parts[1]);
    const s = sheetById(parts[1]);
    return html && { html, active: `#/sheet/${parts[1]}`, title: `${s.short}: ${s.title} · Rhythm Lab` };
  }
  if (parts[0] === 'settings') return { html: renderSettings(), active: '#/settings', title: 'Settings · Rhythm Lab' };
  return null;
}

function route() {
  const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
  stop();
  const v = view(parts) || {
    html: '<h1>Page not found</h1><p><a href="#/">Back to the overview</a></p>',
    active: '',
    title: 'Not found · Rhythm Lab',
  };
  const update = () => {
    main.innerHTML = v.html;
    document.title = v.title;
    renderSidebar(v.active);
    setMenu(false);
    window.scrollTo(0, 0);
    reveal(main);
  };
  if (document.startViewTransition && !reducedMotion.matches && main.childElementCount) {
    document.startViewTransition(update);
  } else {
    update();
  }
  main.focus({ preventScroll: true });
}

window.addEventListener('hashchange', route);

// ─── audio state in the UI ──────────────────────────────────────────────────

let activeButton = null;
let sequenceButton = null; // "Listen to all four" while its sentences play

function refreshEngine() {
  const { label, short, level } = engineSummary();
  engineLabel.innerHTML = `<span class="long">${esc(label)}</span><span class="short">${esc(short)}</span>`;
  engineEl.dataset.level = level;
  engineEl.setAttribute('aria-label', `Voice engine: ${label}. Choose voices`);
}

function clearPlaying() {
  document.querySelectorAll('.is-playing, .is-loading').forEach((el) => {
    if (!el.closest('.engine-panel') && el !== sequenceButton) el.classList.remove('is-playing', 'is-loading');
  });
  root.classList.remove('audio-playing');
  stopBtn.hidden = true;
}

function markOnly(btn, cls) {
  document.querySelectorAll('.is-playing, .is-loading').forEach((el) => {
    if (el !== btn && !el.closest('.engine-panel') && !el.contains(btn) && el !== sequenceButton) el.classList.remove('is-playing', 'is-loading');
  });
  btn?.classList.add(cls);
}

onAudioEvent((e) => {
  if (e.type === 'loading') markOnly(activeButton, 'is-loading');
  if (e.type === 'play') {
    markOnly(activeButton, 'is-playing');
    activeButton?.classList.remove('is-loading');
    activeButton?.classList.add('is-playing');
    activeButton?.closest('.ex, .dlg-line, .form-row')?.classList.add('is-playing');
    root.classList.add('audio-playing');
    engineEl.title = `Playing: ${e.source}`;
    stopBtn.hidden = false;
  }
  if (e.type === 'end' || e.type === 'stop') {
    clearPlaying();
    activeButton = null;
  }
  if (e.type === 'error') toast(e.message);
  if (['settings', 'engine', 'voices'].includes(e.type)) refreshEngine();
});

stopBtn.addEventListener('click', () => stop());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    stop();
    setMenu(false);
  }
});

// Several sentences of the book in a row (the four "Men fight wars").
async function playSequence(btn) {
  const clips = btn.dataset.clips.split('|').map(parseClip);
  const scope = btn.closest('.stage, .step') || document;
  const rows = clips.map((c) => scope.querySelector(`[data-clip="${c.join(':')}"]`));
  stop();
  sequenceButton = btn;
  btn.classList.add('is-playing');
  await playClips(clips, {
    onClip: (i) => {
      activeButton = rows[i];
    },
  });
  if (sequenceButton === btn) sequenceButton = null;
  btn.classList.remove('is-playing');
}

// ─── delegated events ───────────────────────────────────────────────────────

document.addEventListener('click', async (e) => {
  const t = e.target;
  if (!(t instanceof Element) || t.closest('.engine-panel')) return;

  if (t.closest('[data-book-player]')) {
    handleBookClick(t, e);
    return;
  }

  const seqBtn = t.closest('[data-clips]');
  if (seqBtn) {
    if (seqBtn === sequenceButton) {
      sequenceButton = null;
      stop();
    } else playSequence(seqBtn);
    return;
  }

  const clipBtn = t.closest('[data-clip]');
  if (clipBtn) {
    if (clipBtn.classList.contains('is-playing')) {
      stop();
      return;
    }
    stop();
    activeButton = clipBtn;
    playClip(parseClip(clipBtn.dataset.clip));
    return;
  }

  const playBtn = t.closest('[data-play]');
  if (playBtn) {
    if (playBtn.classList.contains('is-playing')) {
      stop();
      return;
    }
    stop();
    activeButton = playBtn;
    play(playBtn.dataset.text, { mode: playBtn.dataset.mode, voice: playBtn.dataset.voice });
    return;
  }

  if (handleRecorderClick(t)) return;

  if (main.querySelector('[data-sheet]')) {
    const r = handleSheetClick(t, main);
    if (r === 'rerender') route();
    if (r) return;
  }

  // settings page
  if (t.closest('[data-open-voices]')) {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    openVoicePanel();
    return;
  }
  if (t.closest('[data-toggle-key]')) {
    const input = document.getElementById('api-key');
    input.type = input.type === 'password' ? 'text' : 'password';
    t.closest('[data-toggle-key]').textContent = input.type === 'password' ? 'Show' : 'Hide';
    return;
  }
  if (t.closest('[data-check-credits]')) {
    const key = document.getElementById('api-key').value.trim() || getSettings().apiKey;
    if (!key) return toast('Enter your ElevenLabs API key first.');
    try {
      renderCredits(await fetchSubscription(key));
    } catch (err) {
      toast(err.message);
    }
    return;
  }
  if (t.closest('[data-clear-cache]')) {
    await clearAudioCache();
    toast('Cached audio cleared.');
    return;
  }
  const bookCheck = t.closest('[data-book-check]');
  if (bookCheck) {
    const out = document.getElementById('book-out');
    bookCheck.disabled = true;
    out.innerHTML = '<p class="muted">Asking the Google Script which recordings it finds…</p>';
    try {
      out.innerHTML = bookTableHtml(await bookList());
    } catch (err) {
      out.innerHTML = `<p class="warn-text">Couldn’t get the list: ${esc(err.message)}</p>`;
    }
    bookCheck.disabled = false;
    return;
  }
  if (t.closest('[data-test-sheet]')) {
    const url = document.getElementById('sheet-url').value.trim();
    try {
      const info = await testConnection(url);
      if (info.app !== 'Rhythm Lab') toast(`That is the script of “${info.sheet}”, but not the Rhythm Lab script. Use the Rhythm Lab one.`);
      else toast(`Connected to “${info.sheet}”${info.tts ? ' · voice engine ready' : ' · no ElevenLabs key yet'}${info.book ? ' · book recordings ready' : ''}. Press Save.`);
    } catch (err) {
      toast(`Couldn't connect: ${err.message}`);
    }
    return;
  }
  if (t.closest('[data-copy-link]')) {
    const input = document.getElementById('student-link');
    try {
      await navigator.clipboard.writeText(input.value);
      toast('Student link copied.');
    } catch {
      input.select();
      toast('Select the link and copy it.');
    }
    return;
  }
  if (t.closest('[data-flush-sheet]')) {
    const left = await flushQueue();
    toast(left ? `${left} result(s) still pending.` : 'All pending results were sent.');
    route();
  }
});

document.addEventListener('change', (e) => {
  if (e.target.matches('[data-model]')) {
    saveSettings({ model: e.target.value });
    toast('Model saved.');
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  if (form.id === 'settings-form') {
    e.preventDefault();
    const data = new FormData(form);
    saveSettings({ apiKey: String(data.get('apiKey') || '').trim() });
    loadVoices({ force: true });
    toast('Saved.');
    return;
  }
  if (form.id === 'sheet-form') {
    e.preventDefault();
    const data = new FormData(form);
    const sheetUrl = String(data.get('sheetUrl') || '').trim();
    if (sheetUrl && !isSheetUrl(sheetUrl)) {
      toast('That is not an Apps Script web app URL (it should end in /exec).');
      return;
    }
    saveSettings({
      student: String(data.get('student') || '').trim(),
      group: String(data.get('group') || '').trim(),
      sheetUrl,
    });
    toast('Saved.');
    checkScript().then(() => location.hash.startsWith('#/settings') && route());
    return;
  }
  if (form.matches('[data-name-form]')) {
    e.preventDefault();
    handleNameForm(form, main);
  }
});

// ─── start ──────────────────────────────────────────────────────────────────

const linked = applyLinkParams();
initVoicePanel();
refreshEngine();
route();
checkScript().then(() => {
  refreshEngine();
  // The settings page shows what the script can do: show it once it's known.
  if (location.hash.startsWith('#/settings')) route();
  if (getSettings().engine !== 'browser') loadVoices().then(refreshEngine);
});
if (linked) toast("Connected to your teacher's results sheet.");
flushQueue();

// For the console and tests.
window.rhythmLab = { WORKSHEETS };
