// The book recordings (Pronouncing American English, Unit 5, 3rd edition).
// They stay in the teacher's Google Drive, in the folder "Unit 5 Content Words
// & Function Words"; Google doesn't let other pages play Drive's own links, so
// the teacher's Google Script sends each file, by its name (PAE3_U05_E5.mp3).
//
// Two ways to play them:
//   • a clip: one sentence, [track, start, end] in seconds — data-clip="E5:12.43:14.56".
//     Clips play with Web Audio, so they start and stop exactly on the sentence.
//   • the whole exercise, instructions included: the player at the top of a step.
import { TRACKS } from './worksheets.js?v=202611080330';
import { CACHE_NAME, announce, getSettings, onHalt, stop as stopVoice } from './tts.js?v=202611080330';
import { isScriptUrl, scriptPost } from './script-api.js?v=202611080330';
import { esc, icons } from './ui.js?v=202611080330';

// ─── fetching a recording ───────────────────────────────────────────────────

const blobs = new Map(); // track → Promise<Blob>

async function download(track) {
  const cacheReq = new Request(`https://book-audio.invalid/${encodeURIComponent(TRACKS[track].file)}`);
  try {
    const hit = await (await caches.open(CACHE_NAME)).match(cacheReq);
    if (hit) return await hit.blob();
  } catch {
    /* Cache API unavailable */
  }
  const { sheetUrl } = getSettings();
  if (!isScriptUrl(sheetUrl)) throw new Error('the teacher’s Google Script is not connected (Settings)');
  const res = await scriptPost(sheetUrl, { type: 'book-audio', track });
  if (!res.audio) throw new Error('the Google Script sent no audio');
  const blob = new Blob([Uint8Array.from(atob(res.audio), (c) => c.charCodeAt(0))], { type: res.mime || 'audio/mpeg' });
  try {
    await (await caches.open(CACHE_NAME)).put(cacheReq, new Response(blob, { headers: { 'Content-Type': blob.type } }));
  } catch {
    /* Cache API unavailable */
  }
  return blob;
}

export function trackBlob(track) {
  if (!TRACKS[track]) return Promise.reject(new Error(`unknown recording ${track}`));
  if (!blobs.has(track)) {
    const p = download(track);
    p.catch(() => blobs.delete(track));
    blobs.set(track, p);
  }
  return blobs.get(track);
}

// ─── clips (one sentence) ───────────────────────────────────────────────────

export const clipAttr = (clip) => clip.join(':');
export function parseClip(s) {
  const [track, a, b] = String(s || '').split(':');
  return [track, Number(a), Number(b)];
}

let ctx = null;
function audioContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Decoded recordings: a few at a time (a long one is ~40 MB decoded).
const decoded = new Map(); // track → Promise<AudioBuffer>, oldest first
function bufferOf(track) {
  if (decoded.has(track)) {
    const p = decoded.get(track);
    decoded.delete(track);
    decoded.set(track, p);
    return p;
  }
  const p = trackBlob(track)
    .then((blob) => blob.arrayBuffer())
    .then((raw) => new Promise((ok, fail) => audioContext().decodeAudioData(raw, ok, () => fail(new Error('the recording could not be decoded')))));
  p.catch(() => decoded.delete(track));
  decoded.set(track, p);
  while (decoded.size > 2) decoded.delete(decoded.keys().next().value);
  return p;
}

let token = 0; // the clip that should be playing
let seq = 0; // the sequence (playClips) that should be playing
let current = null; // { src, resolve }

function stopClip() {
  if (!current) return;
  const { src, resolve } = current;
  current = null;
  try {
    src.onended = null;
    src.stop();
  } catch {
    /* already stopped */
  }
  resolve();
}

// The app's voice, the whole-exercise player and Stop all end a clip.
onHalt(() => {
  token++;
  seq++;
  stopClip();
});

// Play one sentence of a recording. Resolves when it ends or is stopped.
// A clip played on its own also ends any sequence that was playing.
export async function playClip(clip, { inSeq = false } = {}) {
  const [track, start, end] = clip;
  if (!inSeq) seq++;
  const mine = ++token;
  stopClip();
  audioContext(); // inside the tap: phones only let audio start from one
  announce({ type: 'loading' });
  let buf;
  try {
    buf = await bufferOf(track);
  } catch (err) {
    if (mine === token) {
      announce({ type: 'error', message: `The book recording isn’t available: ${err.message}.` });
      announce({ type: 'end' });
    }
    return;
  }
  if (mine !== token) return;
  const ac = audioContext();
  const from = Math.max(0, start);
  const length = Math.max(0.05, Math.min(buf.duration, end) - from);
  return new Promise((resolve) => {
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    current = { src, resolve };
    src.onended = () => {
      if (current && current.src === src) {
        current = null;
        announce({ type: 'end' });
      }
      resolve();
    };
    src.start(0, from, length);
    announce({ type: 'play', source: `Book recording · ${TRACKS[track].title}` });
  });
}

// Several clips, one after another; stops when anything else plays.
export async function playClips(clips, { gap = 0.45, onClip } = {}) {
  const mine = ++seq;
  for (const [i, c] of clips.entries()) {
    if (mine !== seq) return;
    onClip?.(i);
    await playClip(c, { inSeq: true });
    if (mine !== seq) return;
    await new Promise((r) => setTimeout(r, gap * 1000));
  }
}

// ─── the whole exercise (the player at the top of a step) ───────────────────

const urls = new Map(); // track → object URL
let whole = null; // { audio, el }
onHalt(() => pauseWhole());

function pauseWhole() {
  if (whole) {
    whole.audio.pause();
    setState(whole.el, 'paused');
  }
}

const fmt = (t) => (Number.isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}` : '–:––');

function setState(el, state, message) {
  el.dataset.state = state;
  const btn = el.querySelector('[data-book-toggle]');
  if (btn) {
    btn.innerHTML = state === 'playing' ? icons.pause : icons.play;
    btn.setAttribute('aria-label', state === 'playing' ? 'Pause the book recording' : 'Play the book recording');
  }
  const msg = el.querySelector('[data-book-msg]');
  if (msg && message !== undefined) msg.textContent = message;
}

function draw(el, audio) {
  const bar = el.querySelector('[data-book-bar] span');
  const time = el.querySelector('[data-book-time]');
  if (bar) bar.style.width = `${audio.duration ? (100 * audio.currentTime) / audio.duration : 0}%`;
  if (time) time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
}

export function bookPlayerHtml(track) {
  const t = TRACKS[track];
  return `<div class="book-player" data-book-player="${esc(track)}" data-state="idle">
    <button type="button" class="bp-toggle" data-book-toggle aria-label="Play the book recording">${icons.play}</button>
    <div class="bp-body">
      <div class="bp-top"><span class="bp-label">${icons.headphones}Book recording</span><span class="bp-where">${esc(t.title)} · the whole exercise</span><span class="bp-time" data-book-time></span></div>
      <div class="bp-bar" data-book-bar role="slider" tabindex="0" aria-label="Position in the recording" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
      <div class="bp-msg" data-book-msg aria-live="polite"></div>
    </div>
  </div>`;
}

export async function handleBookClick(target, event) {
  const el = target.closest('[data-book-player]');
  if (!el) return false;
  const bar = target.closest('[data-book-bar]');
  if (bar) {
    if (whole?.el === el && whole.audio.duration) {
      const r = bar.getBoundingClientRect();
      const x = (event?.clientX ?? r.left) - r.left;
      whole.audio.currentTime = Math.max(0, Math.min(1, x / r.width)) * whole.audio.duration;
      draw(el, whole.audio);
    }
    return true;
  }
  if (!target.closest('[data-book-toggle]')) return true;
  if (whole?.el === el && el.dataset.state === 'playing') {
    pauseWhole();
    return true;
  }
  stopVoice(); // ends any clip, voice or other player (and pauses this one)
  if (whole?.el === el && whole.audio.src) {
    whole.audio.play().then(() => setState(el, 'playing', '')).catch(() => setState(el, 'error', 'Could not play the recording.'));
    return true;
  }
  const track = el.dataset.bookPlayer;
  setState(el, 'loading', 'Loading the recording from the teacher’s Drive…');
  try {
    if (!urls.has(track)) urls.set(track, URL.createObjectURL(await trackBlob(track)));
    const audio = new Audio(urls.get(track));
    audio.addEventListener('timeupdate', () => draw(el, audio));
    audio.addEventListener('loadedmetadata', () => draw(el, audio));
    audio.addEventListener('ended', () => setState(el, 'idle', ''));
    whole = { audio, el };
    el.title = TRACKS[track].file;
    await audio.play();
    setState(el, 'playing', '');
  } catch (err) {
    setState(el, 'error', `The book recording isn’t available: ${err.message}.`);
  }
  return true;
}

// For Settings: which file of the teacher's folder each recording uses.
export async function bookList() {
  const { sheetUrl } = getSettings();
  if (!isScriptUrl(sheetUrl)) throw new Error('No Google Script URL.');
  const res = await scriptPost(sheetUrl, { type: 'book-list' });
  return res.tracks || [];
}
