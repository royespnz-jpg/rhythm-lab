import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORKSHEETS, GROUPS, TRACKS, DIALOGUE, stepsOf, sheetById } from '../js/worksheets.js';
import { unitsOf, pointsOf, stepBody, tapTokens, beatHtml } from '../js/views/sheet.js';
import { plainText } from '../js/text.js';

const TYPES = ['table', 'forms', 'lines', 'rhythm', 'reduce', 'choice', 'strike', 'beats', 'dialogue'];
const all = WORKSHEETS.flatMap((sheet) => stepsOf(sheet).map((step) => ({ sheet, step })));
const step = (sheet, key) => stepsOf(sheetById(sheet)).find((s) => s.key === key);

// Every clip of the content, with what it says.
function clips() {
  const out = [];
  for (const { sheet, step: s } of all) {
    const where = `${sheet.id} ${s.key}`;
    for (const l of s.lines || []) {
      if (l.clip) out.push({ where, clip: l.clip, text: l.text || l.said || l.scene });
      if (l.wclip) out.push({ where, clip: l.wclip, text: l.written });
    }
    for (const r of s.rows || []) {
      if (r.word) out.push({ where, clip: r.word, text: r.w });
      if (r.clip) out.push({ where, clip: r.clip, text: r.ex });
    }
    for (const it of s.items || []) {
      if (it.clip) out.push({ where, clip: it.clip, text: it.q });
      if (it.after) out.push({ where, clip: it.after, text: it.explain });
    }
  }
  return out;
}

test('the key ideas, then four activities', () => {
  assert.deepEqual(GROUPS.flatMap((g) => g.ids).sort(), WORKSHEETS.map((w) => w.id).sort());
  assert.deepEqual(GROUPS.map((g) => g.ids.length), [1, 4]);
  const ideas = sheetById('ideas');
  assert.deepEqual(ideas.parts.map((p) => p.title), ['Content words and function words', 'Strong and weak forms', 'The rhythm of English', 'Reductions in conversation']);
  assert.equal(stepsOf(ideas).reduce((n, s) => n + pointsOf(s), 0), 0, 'the key ideas are not scored');
  for (const id of GROUPS[1].ids) assert.ok(stepsOf(sheetById(id)).some((s) => pointsOf(s) > 0), `${id} is scored`);
});

test('every step has a known type and a task, and renders', () => {
  for (const { sheet, step: s } of all) {
    const where = `${sheet.id} ${s.key}`;
    assert.ok(TYPES.includes(s.type), `${where}: type ${s.type}`);
    assert.ok(s.task && s.n, `${where}: task`);
    assert.ok(stepBody(s).length > 40, `${where}: renders`);
    if (s.track) assert.ok(TRACKS[s.track], `${where}: track ${s.track}`);
  }
});

test('every clip is inside its recording, and only a sentence long', () => {
  const list = clips();
  assert.ok(list.length > 100);
  for (const { where, clip, text } of list) {
    const [track, a, b] = clip;
    assert.ok(TRACKS[track], `${where}: ${track}`);
    assert.ok(a >= 0 && b > a && b <= TRACKS[track].seconds, `${where}: ${clip} (${text})`);
    assert.ok(b - a >= 0.5 && b - a <= 6, `${where}: ${(b - a).toFixed(2)} s for “${text}”`);
  }
});

test('the same clip always says the same thing', () => {
  const said = new Map();
  for (const { clip, text } of clips()) {
    const key = clip.join(':');
    const t = plainText(text).replace(/^Written English: /, '');
    if (said.has(key)) assert.equal(said.get(key), t, key);
    else said.set(key, t);
  }
});

test('Exercise 5 says what the recording says (not the PDF)', () => {
  // Checked against PAE3_U05_E5.mp3: sentences 4, 5 and 8 are not the PDF's
  // "We have been here all day", "Yes, we are coming home now" and "They have more than they need".
  assert.deepEqual(
    step('listen', 'e5').lines.map((l) => plainText(l.text)),
    [
      'I think Tom and Lee went home.',
      'The party was fun.',
      'You can pass the test.',
      'I read the play today.',
      'I like him very much.',
      'Do as I say, not as I do.',
      'I think of you all the time.',
      'Register for the class.',
      'He was a good teacher.',
      'I eat it because it’s healthy.',
    ],
  );
});

test('Exercise 4C: Molly and Linda (as recorded), weak then strong', () => {
  const items = step('strong-weak', 'e4c').items;
  assert.equal(items.length, 10);
  assert.ok(items.some((i) => i.q === 'Molly and Linda are sisters.'));
  assert.ok(!items.some((i) => /Mary and June/.test(i.q)));
  // Each sentence twice: once weak, once strong, in a mixed order.
  const byQ = Object.groupBy(items, (i) => i.q);
  for (const [q, two] of Object.entries(byQ)) assert.deepEqual(two.map((i) => i.answer).sort(), [0, 1], q);
  assert.notDeepEqual(items.map((i) => i.answer), [0, 1, 0, 1, 0, 1, 0, 1, 0, 1]);
  // In the recording, the weak form (a) comes before the strong one (b) of each sentence.
  for (const two of Object.values(byQ)) {
    const [weak, strong] = [two.find((i) => i.answer === 0), two.find((i) => i.answer === 1)];
    assert.ok(weak.clip[1] < strong.clip[1], weak.q);
  }
});

test('Exercise 8A: the dialogue of the recording, two speakers in turn', () => {
  const lines = DIALOGUE.filter((l) => !l.scene);
  assert.equal(lines.length, 15);
  assert.equal(lines[0].said, 'Hi, howarya?');
  assert.ok(lines.some((l) => l.written === 'What are you going to eat?'));
  assert.ok(!lines.some((l) => /coffee shop|bacon/.test(l.written)), 'not the PDF’s dialogue');
  // A (the man) and B (the woman) speak in turn, before and after "Later, at the diner".
  assert.equal(lines.map((l) => l.who).join(''), 'ABABABAABABABAB');
  for (let i = 1; i < DIALOGUE.length; i++) assert.ok(DIALOGUE[i].clip[1] > DIALOGUE[i - 1].clip[1], 'in the order of the recording');
  for (const l of lines) assert.ok(l.wclip[1] > l.clip[2], `${l.said}: the written version comes after`);
});

test('choices: one right answer, among different options', () => {
  for (const { sheet, step: s } of all.filter((x) => x.step.type === 'choice')) {
    for (const it of s.items) {
      assert.ok(Number.isInteger(it.answer) && it.answer >= 0 && it.answer < it.options.length, `${sheet.id}: ${it.q}`);
      assert.equal(new Set(it.options).size, it.options.length, `${sheet.id}: ${it.q}`);
      assert.ok(it.clip, `${sheet.id}: ${it.q} has its recording`);
    }
  }
  const decode = step('decode', 'e8a').items;
  assert.ok(new Set(decode.map((i) => i.answer)).size === 3, 'the right answer is not always in the same place');
  for (const it of decode) assert.equal(it.options[it.answer], DIALOGUE.find((l) => l.said === it.q).written);
});

test('cross out the weak words: the targets, the free words, and the points', () => {
  const s = step('listen', 'e5');
  assert.equal(pointsOf(s), 16);
  const t = tapTokens('Do {as} (I) say, not {as} (I) do.', 'strike');
  assert.deepEqual(
    t.filter((x) => x.word).map((x) => `${x.word}:${x.role}`),
    ['Do:plain', 'as:target', 'I:free', 'say:plain', 'not:plain', 'as:target', 'I:free', 'do:plain'],
  );
  // Every function word that is a target is a real function word.
  const FUNCTION = ['a', 'an', 'the', 'and', 'as', 'or', 'because', 'can', 'was', 'of', 'for', 'him'];
  for (const u of unitsOf(s)) assert.ok(FUNCTION.includes(u.word.toLowerCase()), u.word);
});

test('find the beats: content words only', () => {
  const s = step('beats', 'e6');
  assert.equal(pointsOf(s), 20);
  const FUNCTION = /^(a|an|the|it|it’s|they’re|he|him|your|of|to|for|and|or|as)$/i;
  for (const l of s.lines) {
    for (const t of tapTokens(l.text, 'beats').filter((x) => x.word)) {
      assert.equal(t.role === 'target', !FUNCTION.test(t.word), `${l.text}: ${t.word}`);
    }
  }
  const html = beatHtml('The *men* *fight* *wars*.');
  assert.match(html, /<span class="bw kw" style="--k:0"><i aria-hidden="true"><\/i>The<\/span> <span class="bw kw beat" style="--k:1">/);
  assert.equal((html.match(/class="bw kw beat"/g) || []).length, 3);
  // With its clip, each word also knows when the recording says it.
  assert.match(beatHtml('*Men* *fight* *wars*.', ['E7A', 50.29, 51.94]), /--k:1;--t:0\.44/);
});

test('the rhythm demo: three beats each, about the same time', () => {
  const s = step('ideas', 'beat');
  for (const l of s.lines) assert.equal(tapTokens(l.text, 'beats').filter((t) => t.role === 'target').length, 3, l.text);
  const secs = s.lines.map((l) => l.seconds);
  assert.ok(Math.max(...secs) - Math.min(...secs) < 0.25, 'within a quarter of a second');
  for (const l of s.lines) assert.ok(l.clip[2] - l.clip[1] >= l.seconds, l.text);
});

test('strong and weak forms: the 18 words of Exercise 4B, each crossed out in its sentence', () => {
  const s = step('ideas', 'forms');
  assert.deepEqual(
    s.rows.map((r) => r.w),
    ['a', 'an', 'and', 'are', 'as', 'because', 'can', 'for', 'from', 'had', 'has', 'have', 'of', 'or', 'that', 'than', 'to', 'was'],
  );
  for (const r of s.rows) {
    assert.ok(r.ex.includes(`{${r.w}}`), `${r.w}: ${r.ex}`);
    assert.ok(r.word[2] < r.clip[1], `${r.w}: the word alone comes first`);
    assert.match(r.weak, /ə|ɚ|n̩/, `${r.w}: a reduced vowel`);
  }
});

test('the karaoke: every word on the page has its moment in the recording', async () => {
  const { TIMINGS } = await import('../js/timings.js');
  const { lineHtml, kwWrap, beatHtml } = await import('../js/views/sheet.js');
  const { renderMarked } = await import('../js/text.js');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const kws = (html) => (html.match(/class="(?:bw )?kw\b/g) || []).length;
  const seen = new Set();
  const check = (clip, count, what) => {
    const key = clip.join(':');
    const t = TIMINGS[key];
    assert.ok(t, `${what}: no timings for ${key}`);
    assert.equal(count, t.length, `${what}: ${count} words on the page, ${t.length} in the recording`);
    for (let i = 0; i < t.length; i++) {
      assert.ok(t[i][0] < t[i][1] && t[i][0] >= 0, `${what}: word ${i}`);
      if (i) assert.ok(t[i][0] >= t[i - 1][0], `${what}: word ${i} in order`);
    }
    assert.ok(t.at(-1)[1] <= clip[2] - clip[1] + 0.05, `${what}: inside the clip`);
    seen.add(key);
  };
  for (const { sheet, step: s } of all) {
    const where = `${sheet.id} ${s.key}`;
    for (const l of s.lines || []) {
      if (l.scene || !(l.clip || l.wclip)) continue;
      if (s.type === 'lines') check(l.clip, kws(kwWrap(lineHtml(l.text))), `${where}: ${l.text}`);
      if (s.type === 'rhythm') check(l.clip, kws(beatHtml(l.text, l.clip)), `${where}: ${l.text}`);
      if (s.type === 'strike' || s.type === 'beats') check(l.clip, tapTokens(l.text, s.type).filter((t) => t.word).length, `${where}: ${l.text}`);
      if (s.type === 'dialogue') {
        check(l.clip, kws(kwWrap(esc(l.said))), `${where}: ${l.said}`);
        check(l.wclip, kws(kwWrap(esc(l.written))), `${where}: ${l.written}`);
      }
    }
    for (const r of s.rows || []) if (r.clip) check(r.clip, kws(kwWrap(renderMarked(r.ex))), `${where}: ${r.ex}`);
    for (const it of s.items || []) if (it.clip) check(it.clip, kws(kwWrap(esc(it.q))), `${where}: ${it.q}`);
  }
  assert.equal(seen.size, Object.keys(TIMINGS).length, 'every timing is used');
});

test('the beats of Men fight wars fall at regular intervals in the recording', async () => {
  const { TIMINGS } = await import('../js/timings.js');
  for (const l of step('ideas', 'beat').lines) {
    const t = TIMINGS[l.clip.join(':')];
    const beats = tapTokens(l.text, 'beats').filter((x) => x.word).map((x, i) => [x, t[i][0]]).filter(([x]) => x.role === 'target').map(([, s]) => s);
    const gaps = beats.slice(1).map((b, i) => b - beats[i]);
    assert.ok(Math.max(...gaps) - Math.min(...gaps) < 0.12, `${l.text}: beats at ${beats.join(', ')}`);
  }
});
