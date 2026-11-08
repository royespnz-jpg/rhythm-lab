// While a sentence of the book plays, its words light up as the recording
// says them, and the dot of each beat pulses on its word (js/timings.js has
// when each word is said). The words are the .kw elements of the container
// marked data-words="track:start:end" next to the button that played it.
import { TIMINGS } from './timings.js?v=202611080415';
import { clipNow } from './book.js?v=202611080415';

let live = null; // { key, words, times, raf, at }

// The words of a clip, next to the button that plays it (or inside it).
export function wordsFor(btn, key) {
  if (!btn || !TIMINGS[key]) return null;
  const scope = btn.closest('li, .form-row, .beat-row, .item') || btn.parentElement;
  const box = scope?.querySelector(`[data-words="${CSS.escape(key)}"]`);
  const words = box ? [...box.querySelectorAll('.kw')] : [];
  return words.length === TIMINGS[key].length ? words : null;
}

export function stopKaraoke() {
  if (!live) return;
  cancelAnimationFrame(live.raf);
  const { words } = live;
  live = null;
  // Let the last word finish its pulse, then let go.
  setTimeout(() => {
    if (live && live.words === words) return;
    words.forEach((w) => w.classList.remove('now', 'done'));
    words[0]?.closest('[data-words]')?.classList.remove('saying');
  }, 350);
}

// Follow the clip that starts playing now, for the button that played it.
export function followClip(btn, key) {
  stopKaraoke();
  const words = wordsFor(btn, key);
  if (!words) return;
  const times = TIMINGS[key];
  live = { key, words, times, raf: 0, at: -1 };
  words[0].closest('[data-words]')?.classList.add('saying');
  const tick = () => {
    if (!live || live.words !== words) return;
    const now = clipNow();
    if (!now || now.key !== key) return stopKaraoke();
    // The word being said: the last one that has started.
    let at = -1;
    for (let i = 0; i < times.length; i++) if (now.t >= times[i][0]) at = i;
    if (at !== live.at) {
      live.at = at;
      words.forEach((w, i) => {
        w.classList.toggle('now', i === at);
        w.classList.toggle('done', i < at);
      });
    }
    live.raf = requestAnimationFrame(tick);
  };
  live.raf = requestAnimationFrame(tick);
}
