import { GROUPS, sheetById, stepsOf } from '../worksheets.js?v=202611080415';
import { esc, icons } from '../ui.js?v=202611080415';
import { loadProgress, pointsOf, beatHtml } from './sheet.js?v=202611080415';

// "Men fight wars": three beats, whatever the number of words (Exercise 7A).
const STAGE = stepsOf(sheetById('ideas')).find((s) => s.key === 'beat');

function stage() {
  const longest = Math.max(...STAGE.lines.map((l) => l.seconds));
  const rows = STAGE.lines
    .map(
      (l, i) => `<button type="button" class="fam-word beat-row" data-clip="${esc(l.clip.join(':'))}" style="--w:${i}"
        aria-label="${esc(`Listen: ${l.text.replace(/\*/g, '')}, ${l.seconds.toFixed(1)} seconds`)}">
        <span class="beats-text" data-words="${esc(l.clip.join(':'))}">${beatHtml(l.text, l.clip)}</span>
        <span class="dur"><span class="dur-bar"><span style="width:${((100 * l.seconds) / longest).toFixed(1)}%"></span></span><small>${l.seconds.toFixed(1)} s</small></span>
      </button>`,
    )
    .join('');
  const all = STAGE.lines.map((l) => l.clip.join(':')).join('|');
  return `<div class="stage rhythm-stage">
    <div class="eyebrow">Same beat, more words</div>
    <div class="fam">${rows}</div>
    <p class="muted stage-note">Three words or six: three beats, about the same time. Tap a sentence to hear it from the book’s recording.</p>
    <div class="row"><button type="button" class="pbtn main" data-clips="${esc(all)}">${icons.play}<span>Listen to all four</span></button></div>
  </div>`;
}

function sheetCard(sheet, progress, n) {
  const p = progress[sheet.id];
  const steps = stepsOf(sheet);
  const total = steps.reduce((t, s) => t + pointsOf(s), 0);
  const pct = p ? Math.round((100 * p.correct) / p.total) : 0;
  const tracks = new Set(steps.flatMap((s) => [s.track, ...(s.lines || []).map((l) => l.clip?.[0]), ...(s.items || []).map((x) => x.clip?.[0]), ...(s.rows || []).map((r) => r.clip?.[0])]).filter(Boolean));
  return `<a class="card set-card sheet-card" href="#/sheet/${sheet.id}">
    <div class="row"><span class="sheet-no">${String(n).padStart(2, '0')}</span><span class="badge">${esc(sheet.short)}</span></div>
    <h3>${esc(sheet.title)}</h3>
    <p>${esc(sheet.intro)}</p>
    <div class="sheet-meta muted">${total ? `<span>${total} points</span>` : `<span>${sheet.parts.length} topics</span>`}<span>${icons.headphones}${tracks.size} book recording${tracks.size > 1 ? 's' : ''}</span></div>
    ${total ? `<div class="progress" title="Best score: ${pct}%"><span style="width:${pct}%"></span></div><small class="muted">${p ? `Best: ${p.correct}/${p.total} (${pct}%)` : 'Not tried yet'}</small>` : '<small class="muted">Read, listen and repeat</small>'}
  </a>`;
}

export function renderHome() {
  const progress = loadProgress();
  let n = 0;
  const groups = GROUPS.map(
    (g) => `<section class="home-section practice-group">
      <div class="group-head"><p class="kicker">Unit 5 · Content and function words</p><h2>${esc(g.title)}</h2></div>
      <div class="grid">${g.ids.map((id) => sheetCard(sheetById(id), progress, ++n)).join('')}</div>
    </section>`,
  ).join('');
  return `
  <section class="hero">
    <div>
      <p class="kicker">Rhythm · American English</p>
      <h1>
        <span class="line"><span style="--l:0">Content words</span></span>
        <span class="line"><span style="--l:1">keep the</span></span>
        <span class="line"><span style="--l:2"><em>beat.</em></span></span>
      </h1>
      <p class="lede">The key ideas of Unit 5 of <em>Pronouncing American English</em> (content words, function words, weak forms and the rhythm of English) and four short activities, with the book’s recordings, natural ElevenLabs voices and a recorder.
        Answer, check, and your results go to your teacher.</p>
      <div class="row hero-cta">
        <a class="btn primary" href="#/sheet/ideas">Start with the key ideas ${icons.arrowR}</a>
        <a class="btn" href="#/sheet/listen">Go to the activities</a>
      </div>
    </div>
    ${stage()}
  </section>

  <section class="home-section how">
    <div class="how-grid">
      <div class="card"><span class="how-n">1</span><h3>Listen</h3><p>The ${icons.headphones} buttons play the book’s own recording, one sentence at a time. Words and examples without a recording use the app’s voice.</p></div>
      <div class="card"><span class="how-n">2</span><h3>Mark</h3><p>Cross out the weak function words, tap the content words that carry the <span class="beat-inline"><i></i>beats</span>, and decide whether you hear a strong or a weak form.</p></div>
      <div class="card"><span class="how-n">3</span><h3>Check &amp; record</h3><p>Press <b>Check</b> in each activity. Record yourself and compare with the book. When an activity is finished, your score goes to your teacher’s sheet.</p></div>
    </div>
  </section>

  ${groups}`;
}
