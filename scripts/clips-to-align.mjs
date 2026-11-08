// Every clip whose words the page shows, with its spoken text: the input of
// scripts/align-clips.py (see js/timings.js).
import { WORKSHEETS, stepsOf } from '../js/worksheets.js';
import { plainText } from '../js/text.js';
const out = new Map();
const add = (clip, text) => {
  if (!clip || !text) return;
  const key = clip.join(':');
  const t = plainText(text).replace(/\s*\/\s*/g, ' ');
  if (out.has(key) && out.get(key).text !== t) throw new Error(`${key}: two texts`);
  out.set(key, { key, track: clip[0], a: clip[1], b: clip[2], text: t });
};
for (const sheet of WORKSHEETS) {
  for (const s of stepsOf(sheet)) {
    for (const l of s.lines || []) {
      if (l.scene) continue;
      add(l.clip, l.text || l.said);
      add(l.wclip, l.written);
    }
    for (const r of s.rows || []) add(r.clip, r.ex);
    for (const it of s.items || []) add(it.clip, it.q);
  }
}
console.log(JSON.stringify([...out.values()], null, 1));
