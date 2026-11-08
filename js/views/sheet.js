// A worksheet: the key ideas, or one activity. Where the student has to cross
// out, tap or choose, the step is interactive: answer, press Check, and see
// what was right. A finished activity goes to the teacher's Google Sheet.
import { BOOKS, WORKSHEETS, sheetById, stepsOf } from '../worksheets.js?v=202611080415';
import { plainText, renderMarked } from '../text.js?v=202611080415';
import { bookPlayerHtml } from '../book.js?v=202611080415';
import { esc, icons, playButton, audioButtons, recButton, clipButton } from '../ui.js?v=202611080415';
import { getSettings, saveSettings } from '../tts.js?v=202611080415';
import { TIMINGS } from '../timings.js?v=202611080415';
import { sheetConfigured, studentName, newId, sendResult } from '../sheets.js?v=202611080415';

const PROGRESS_KEY = 'rl.progress.v1';

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveBest(sheetId, correct, total) {
  const all = loadProgress();
  const prev = all[sheetId];
  if (!prev || correct / total > prev.correct / prev.total) all[sheetId] = { correct, total };
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}

// ─── words to tap ───────────────────────────────────────────────────────────

// strike: {word} must be crossed out, (word) may be, any other word must not.
// beats:  *word* is a content word (a beat); any other word is not.
// → [{ word, role: 'target' | 'free' | 'plain' } | { sep }]
export function tapTokens(text, type) {
  const re =
    type === 'beats'
      ? /\*([^*]+)\*|([A-Za-z’']+)|([^A-Za-z’'*]+)/g
      : /\{([^}]+)\}|\(([^)]+)\)|([A-Za-z’']+)|([^A-Za-z’'{}()]+)/g;
  const out = [];
  for (const m of String(text).matchAll(re)) {
    if (type === 'beats') {
      if (m[1] !== undefined) out.push({ word: m[1], role: 'target' });
      else if (m[2] !== undefined) out.push({ word: m[2], role: 'plain' });
      else out.push({ sep: m[3] });
    } else if (m[1] !== undefined) out.push({ word: m[1], role: 'target' });
    else if (m[2] !== undefined) out.push({ word: m[2], role: 'free' });
    else if (m[3] !== undefined) out.push({ word: m[3], role: 'plain' });
    else out.push({ sep: m[4] });
  }
  return out;
}

// A sentence with its beats: a big dot over each *beat*, a small one over every
// other word. --k: the word's place; --t: when the recording says it (seconds).
export function beatHtml(text, clip) {
  const times = clip ? TIMINGS[clip.join(':')] : null;
  let k = 0;
  return tapTokens(text, 'beats')
    .map((t) => {
      if (t.sep !== undefined) return esc(t.sep);
      const at = times?.[k]?.[0];
      return `<span class="bw kw${t.role === 'target' ? ' beat' : ''}" style="--k:${k++}${at != null ? `;--t:${at}` : ''}"><i aria-hidden="true"></i>${esc(t.word)}</span>`;
    })
    .join('');
}

// Each word of a sentence in its own .kw span (the text between the tags), so
// it can light up when the recording says it.
export function kwWrap(html) {
  return String(html)
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith('<') ? part : part.replace(/(&[#\w]+;)|([A-Za-z’']+)/g, (m, ent, w) => (ent ? m : `<span class="kw">${w}</span>`))))
    .join('');
}

// The words of a clip: the container the karaoke looks for (js/karaoke.js).
export const wordsAttr = (clip) => (clip ? ` data-words="${esc(clip.join(':'))}"` : '');

// ─── the units of each activity (the things that score a point) ─────────────

function unitsOf(step) {
  switch (step.type) {
    case 'choice':
      return step.items.map((item, i) => ({ i, item }));
    case 'strike':
    case 'beats':
      return step.lines.flatMap((l, li) =>
        tapTokens(l.text, step.type)
          .filter((t) => t.role === 'target')
          .map((t) => ({ word: t.word, line: li })),
      );
    default:
      return [];
  }
}

const isScored = (step) => unitsOf(step).length > 0;
const pointsOf = (step) => unitsOf(step).length;

// ─── rendering ──────────────────────────────────────────────────────────────

export function renderSheet(id) {
  const sheet = sheetById(id);
  if (!sheet) return null;
  const idx = WORKSHEETS.indexOf(sheet);
  const prev = WORKSHEETS[idx - 1];
  const next = WORKSHEETS[idx + 1];
  const steps = stepsOf(sheet);
  const total = steps.reduce((n, s) => n + pointsOf(s), 0);
  const parts = [];
  let part = null;
  steps.forEach((step, k) => {
    if (step.part !== part) {
      if (part) parts.push('</section>');
      part = step.part;
      parts.push(`<section class="book-part">
        <h2 class="part-h"><span class="part-letter">${esc(part.label)}</span><span>${esc(part.title)}</span></h2>
        ${part.text ? `<div class="part-text">${part.text}</div>` : ''}`);
    }
    parts.push(stepSection(step, k));
  });
  parts.push('</section>');
  const activities = steps.filter((s) => isScored(s)).length;

  return `<span hidden data-sheet="${sheet.id}"></span>
    <header class="topic-head sheet-head">
      <div class="eyebrow"><a href="#/">Rhythm Lab</a> · Unit 5</div>
      <h1><span class="sheet-short">${esc(sheet.short)}</span> ${esc(sheet.title)}</h1>
      <p class="lede">${esc(sheet.intro)}</p>
      <div class="row"><span class="badge book">${icons.headphones}Book recordings</span>${
        total ? `<span class="badge">${activities} activit${activities > 1 ? 'ies' : 'y'} · ${total} points</span>` : '<span class="badge">Listen · repeat · record</span>'
      }</div>
    </header>
    ${
      total
        ? `<div class="scorebar" data-scorebar data-total="${total}" data-attempt="${newId()}" data-started="${Date.now()}">
      <span class="score" data-score>0 / ${total}</span>
      <div class="progress"><span data-bar style="width:0%"></span></div>
      <button type="button" class="btn" data-reset>Start over</button>
    </div>`
        : ''
    }
    ${parts.join('')}
    <div class="card done-panel" data-done hidden aria-live="polite"></div>
    <nav class="pager">
      ${prev ? `<a class="btn back" href="#/sheet/${prev.id}">${icons.arrowL}${esc(prev.short)}</a>` : `<a class="btn back" href="#/">${icons.arrowL}Overview</a>`}
      ${next ? `<a class="btn primary" href="#/sheet/${next.id}">${esc(next.short)} · ${esc(next.title)}${icons.arrowR}</a>` : `<a class="btn primary" href="#/">Overview${icons.arrowR}</a>`}
    </nav>
    <p class="muted source-line">Source: ${esc(BOOKS.pae.long)}.</p>`;
}

const pointsPill = (step) =>
  isScored(step) ? `<span class="pts">${pointsOf(step)} pt${pointsOf(step) > 1 ? 's' : ''}</span>` : '<span class="pts free">Listen · repeat</span>';

const checkRow = (step) =>
  isScored(step) && step.type !== 'choice'
    ? `<div class="check-row" data-check-row><button type="button" class="btn primary" data-check>${icons.check}Check</button>
      <span class="check-msg" data-check-msg aria-live="polite"></span></div>`
    : '';

function stepSection(step, k) {
  return `<section class="step${step.track ? ' has-book' : ''}" data-step="${k}" data-type="${step.type}" id="s-${esc(step.key)}">
    <div class="step-head">
      <span class="step-n">${esc(step.n)}</span>
      <div class="step-meta">${step.track ? `<span>${icons.headphones}${esc(step.track)}</span>` : ''}${pointsPill(step)}</div>
    </div>
    <p class="step-task">${step.task}</p>
    ${step.track ? bookPlayerHtml(step.track) : ''}
    <div class="step-body" data-body>${stepBody(step)}</div>
    ${step.note ? `<p class="step-note">${esc(step.note)}</p>` : ''}
    ${checkRow(step)}
  </section>`;
}

export function stepBody(step) {
  switch (step.type) {
    case 'table':
      return tableBody(step);
    case 'forms':
      return formsBody(step);
    case 'lines':
      return linesBody(step);
    case 'rhythm':
      return rhythmBody(step);
    case 'reduce':
      return reduceBody(step);
    case 'choice':
      return choiceBody(step);
    case 'strike':
    case 'beats':
      return tapBody(step);
    case 'dialogue':
      return dialogueBody(step);
    default:
      return '';
  }
}

// ── listen and repeat ──

// A word as a button that says it (the app's voice).
function wordChip(text) {
  return `<button type="button" class="wchip" data-play data-mode="natural" data-voice="A" data-text="${esc(text)}"
    aria-label="${esc(`Listen: ${text}`)}"><span class="wchip-t">${esc(text)}</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>`;
}

function tableBody(step) {
  return step.groups
    .map(
      (g) => `<h3 class="wt-group">${esc(g.title)}</h3><div class="wtable">${g.rows
        .map(
          (r) => `<div class="wrow">
            <div class="wmeta"><span class="wt-label">${esc(r.label)}</span></div>
            <div class="wwords">${r.words.map((w) => wordChip(w)).join('')}${playButton(r.words.join(', '), { label: '', round: true, title: 'Listen to the whole row' })}</div>
          </div>`,
        )
        .join('')}</div>`,
    )
    .join('');
}

// One line to listen to and repeat: the book's clip, or the app's voice.
function exLine(html, { clip, say, note = '', extra = '' }) {
  const listen = clip ? clipButton(clip, { say }) : audioButtons(say);
  return `<li class="ex rec-host">
    <div class="ex-body"><span class="ex-mark"${wordsAttr(clip)}>${clip ? kwWrap(html) : html}</span>${note ? `<span class="ex-note">${esc(note)}</span>` : ''}${extra}</div>
    <div class="ex-actions">${listen}${recButton(say)}</div>
    <div class="rec-out" hidden></div>
  </li>`;
}

// The book's marks (text.js) plus **syl**: a stressed syllable or word.
export function lineHtml(text) {
  return String(text)
    .split(/\*\*([^*]+)\*\*/)
    .map((part, i) => (i % 2 ? `<b class="st">${esc(part)}</b>` : renderMarked(part)))
    .join('');
}

function linesBody(step) {
  return `<ul class="examples">${step.lines.map((l) => exLine(lineHtml(l.text), { clip: l.clip, say: plainText(l.text), note: l.note })).join('')}</ul>`;
}

function formsBody(step) {
  return `<div class="forms" role="table" aria-label="Strong and weak forms">
    <div class="forms-h" role="row"><span role="columnheader">Strong form (alone)</span><span role="columnheader">Weak form</span><span role="columnheader">In a sentence</span></div>
    ${step.rows
      .map((r) => {
        const say = plainText(r.ex);
        return `<div class="form-row" role="row">
          <div class="form-w" role="cell">${clipButton(r.word, { label: r.w, say: r.w, main: false, round: false, title: `Listen: “${r.w}” alone (strong form)` })}<span class="ipa">${esc(r.strong)}</span></div>
          <div class="form-weak" role="cell"><span class="arrow" aria-hidden="true">→</span><span class="ipa">${esc(r.weak)}</span></div>
          <div class="form-ex rec-host" role="cell"><span class="ex-mark"${wordsAttr(r.clip)}>${kwWrap(renderMarked(r.ex))}</span>
            <span class="ex-actions">${clipButton(r.clip, { say })}${recButton(say, { round: true })}</span>
            <div class="rec-out" hidden></div></div>
        </div>`;
      })
      .join('')}
  </div>`;
}

function rhythmBody(step) {
  const longest = Math.max(...step.lines.map((l) => l.seconds));
  const all = step.lines.map((l) => l.clip.join(':')).join('|');
  return `<div class="row rhythm-all"><button type="button" class="pbtn main" data-clips="${esc(all)}">${icons.play}<span>Listen to all four</span></button></div>
    <ol class="rhythm-lines">${step.lines
      .map(
        (l) => `<li class="ex rec-host rhythm-line" data-clip-row="${esc(l.clip.join(':'))}">
          <div class="ex-body"><span class="beats-text"${wordsAttr(l.clip)}>${beatHtml(l.text, l.clip)}</span>
            <span class="dur" title="${l.seconds.toFixed(2)} seconds in the recording"><span class="dur-bar"><span style="width:${((100 * l.seconds) / longest).toFixed(1)}%"></span></span><small>${l.seconds.toFixed(1)} s</small></span></div>
          <div class="ex-actions">${clipButton(l.clip, { say: plainText(l.text) })}${recButton(plainText(l.text))}</div>
          <div class="rec-out" hidden></div>
        </li>`,
      )
      .join('')}</ol>`;
}

function reduceBody(step) {
  return `<div class="table-wrap"><table class="reduce-table">
    <thead><tr><th scope="col">You hear</th><th scope="col">It means</th><th scope="col">Example</th></tr></thead>
    <tbody>${step.rows
      .map(
        (r) => `<tr><td><b class="heard">${esc(r.heard)}</b></td><td>${esc(r.means)}</td>
          <td><span class="red-ex">${playButton(r.ex, { label: '', round: true, title: 'Listen (app voice)' })}<span>${esc(r.ex)}</span></span></td></tr>`,
      )
      .join('')}</tbody>
  </table></div>`;
}

// ── multiple choice (answered one by one) ──

function choiceBody(step) {
  return `<ol class="items">${step.items
    .map((item, i) => {
      const listen = item.clip ? clipButton(item.clip, { label: 'Listen', round: false, say: item.q }) : '';
      const after = item.after ? clipButton(item.after, { label: 'Hear it written', main: false, round: false, title: 'The written English, in the book’s recording' }) : '';
      return `<li class="card item" data-item="${i}" data-answer="${item.answer}">
        <div class="item-q"><div class="q"${wordsAttr(item.clip)}>${item.clip ? kwWrap(esc(item.q)) : esc(item.q)}</div><div class="row">${listen}</div></div>
        <div class="options">${item.options
          .map((o, k) => `<button type="button" class="opt" data-opt="${k}" aria-label="${esc(o)}">${esc(o)}</button>`)
          .join('')}</div>
        <div class="feedback" data-feedback hidden><span class="verdict"></span><span class="why">${esc(item.explain || '')}</span>${after}</div>
      </li>`;
    })
    .join('')}</ol>`;
}

// ── tap the words: cross out the weak ones, or mark the beats ──

function tapBody(step) {
  let n = 0;
  let w = 0;
  return `<ol class="tap-lines${step.type === 'beats' ? ' beats-mode' : ' strike-mode'}">${step.lines
    .map((l, li) => {
      const words = tapTokens(l.text, step.type)
        .map((t) => {
          if (t.sep !== undefined) return esc(t.sep);
          const u = t.role === 'target' ? ` data-u="${n++}"` : '';
          return `<button type="button" class="ow kw"${u} data-role="${t.role}" style="--n:${w++}" aria-pressed="false">${esc(t.word)}</button>`;
        })
        .join('');
      const say = plainText(l.text);
      return `<li class="ex rec-host tap-line" data-line="${li}">
        <div class="ex-body"><span class="tap-text"${wordsAttr(l.clip)}>${words}</span></div>
        <div class="ex-actions">${clipButton(l.clip, { say })}${recButton(say)}</div>
        <div class="rec-out" hidden></div>
      </li>`;
    })
    .join('')}</ol>`;
}

// ── the conversation ──

function dialogueBody(step) {
  return `<ol class="dlg-lines talk">${step.lines
    .map((l) => {
      if (l.scene) return `<li class="scene">${clipButton(l.clip, { say: l.scene, main: false })}<i>(${esc(l.scene)})</i></li>`;
      return `<li class="dlg-line voice-${l.who} rec-host">
        <span class="who"><span aria-hidden="true">${esc(l.who)}</span><span class="sr-only">Speaker ${esc(l.who)}:</span></span>
        <span class="said"><span class="said-c"${wordsAttr(l.clip)}>${kwWrap(esc(l.said))}</span><small class="said-w"${wordsAttr(l.wclip)}>${kwWrap(esc(l.written))}</small></span>
        <span class="dlg-actions">${clipButton(l.clip, { say: l.said, title: 'As it sounds (book recording)' })}${clipButton(l.wclip, { say: l.written, main: false, title: 'As it is written (book recording)' })}${recButton(l.said, { round: true })}</span>
        <div class="rec-out" hidden></div>
      </li>`;
    })
    .join('')}</ol>`;
}

// ─── interaction ────────────────────────────────────────────────────────────

const results = new Map(); // step index → [{ prompt, answer, expected, correct }]

function currentSheet(root) {
  return sheetById(root.querySelector('[data-sheet]')?.dataset.sheet);
}

function stepAt(root, target) {
  const sheet = currentSheet(root);
  const el = target.closest('[data-step]');
  if (!sheet || !el) return {};
  const k = Number(el.dataset.step);
  return { sheet, el, k, step: stepsOf(sheet)[k] };
}

function press(btn, on) {
  btn.classList.toggle('on', on);
  btn.setAttribute('aria-pressed', String(on));
}

export function handleSheetClick(target, root) {
  const { el, k, step } = stepAt(root, target);

  if (target.closest('[data-reset]')) return 'rerender';
  if (target.closest('[data-send-results]')) {
    submitResult(root);
    return true;
  }
  if (!step) return false;

  // multiple choice: checked at once
  const opt = target.closest('.opt[data-opt]');
  if (opt && !opt.disabled) {
    const item = opt.closest('.item');
    const answer = Number(item.dataset.answer);
    const pick = Number(opt.dataset.opt);
    item.dataset.chosen = String(pick);
    item.dataset.result = pick === answer ? 'ok' : 'bad';
    item.querySelectorAll('.opt').forEach((b, i) => {
      b.disabled = true;
      if (i === answer) b.classList.add('correct');
    });
    if (pick !== answer) opt.classList.add('wrong');
    const fb = item.querySelector('[data-feedback]');
    fb.hidden = false;
    const v = fb.querySelector('.verdict');
    v.textContent = pick === answer ? 'Correct' : 'Not quite';
    v.className = `verdict ${pick === answer ? 'ok' : 'bad'}`;
    if (!el.querySelector('.item:not([data-result])')) {
      results.set(k, choiceRows(step, el));
      el.dataset.checked = '1';
    }
    updateScore(root);
    return true;
  }

  if (el.dataset.checked && !target.closest('[data-retry]')) return false; // a checked step only listens now
  if (target.closest('[data-check]')) {
    checkStep(root, el, k, step);
    return true;
  }
  if (target.closest('[data-retry]')) {
    el.outerHTML = stepSection(step, k);
    results.delete(k);
    updateScore(root);
    return true;
  }
  const ow = target.closest('.ow');
  if (ow) {
    press(ow, !ow.classList.contains('on'));
    return true;
  }
  return false;
}

function choiceRows(step, el) {
  return step.items.map((item, i) => {
    const it = el.querySelector(`[data-item="${i}"]`);
    return { prompt: item.q, answer: item.options[Number(it.dataset.chosen)] ?? '', expected: item.options[item.answer], correct: it.dataset.result === 'ok' };
  });
}

// Tapped words: each target is a point; each wrongly tapped word takes one back.
function checkTaps(step, el) {
  const strike = step.type === 'strike';
  const wrong = [...el.querySelectorAll('.ow.on[data-role="plain"]')];
  wrong.forEach((b) => b.classList.add('wrong'));
  let falseHits = wrong.length;
  el.querySelectorAll('.ow[data-role="free"]').forEach((b) => b.classList.add('free'));
  return unitsOf(step).map((u, i) => {
    const b = el.querySelector(`.ow[data-u="${i}"]`);
    const hit = b.classList.contains('on');
    b.classList.add(hit ? 'hit' : 'missed');
    let ok = hit;
    if (ok && falseHits > 0) {
      ok = false;
      falseHits--;
    }
    const line = plainText(step.lines[u.line].text);
    const mark = strike ? 'crossed out' : 'beat';
    return { prompt: `${u.line + 1}. ${line} · “${u.word}”`, answer: hit ? (ok ? mark : `${mark}, but a wrong word was tapped too`) : `not ${strike ? 'crossed out' : 'marked'}`, expected: mark, correct: ok };
  });
}

function checkStep(root, el, k, step) {
  const rows = checkTaps(step, el);
  results.set(k, rows);
  el.dataset.checked = '1';
  const right = rows.filter((r) => r.correct).length;
  const wrong = el.querySelectorAll('.ow.wrong').length;
  const what = step.type === 'strike' ? 'The weak words are crossed out in green' : 'The beats are marked in green';
  const row = el.querySelector('[data-check-row]');
  row.innerHTML = `<span class="check-score ${right === rows.length ? 'ok' : right ? 'mid' : 'bad'}">${right} / ${rows.length}</span>
    <span class="check-msg">${right === rows.length ? 'All correct!' : `${what}${wrong ? `; the red words should not be ${step.type === 'strike' ? 'crossed out' : 'marked'} (each one takes a point away)` : ''}.`} Now listen and repeat.</span>
    <button type="button" class="btn" data-retry>${icons.redo}Try again</button>`;
  updateScore(root);
}

function updateScore(root) {
  const sheet = currentSheet(root);
  if (!sheet) return;
  let total = 0;
  let answered = 0;
  let correct = 0;
  stepsOf(sheet).forEach((step, k) => {
    const pts = pointsOf(step);
    if (!pts) return;
    total += pts;
    const rows = results.get(k);
    if (rows) {
      answered += pts;
      correct += rows.filter((r) => r.correct).length;
    } else if (step.type === 'choice') {
      const el = root.querySelector(`[data-step="${k}"]`);
      answered += el.querySelectorAll('.item[data-result]').length;
      correct += el.querySelectorAll('.item[data-result="ok"]').length;
    }
  });
  const bar = root.querySelector('[data-scorebar]');
  if (!bar || !total) return;
  bar.querySelector('[data-score]').textContent = `${correct} / ${total}`;
  bar.querySelector('[data-bar]').style.width = `${(100 * answered) / total}%`;
  if (answered === total) {
    saveBest(sheet.id, correct, total);
    finish(root, sheet, correct, total);
  }
}

export function resetSheet() {
  results.clear();
}

function collectAnswers(sheet) {
  const rows = [];
  stepsOf(sheet).forEach((step, k) => {
    for (const r of results.get(k) || []) rows.push({ ...r, prompt: `${step.n} · ${r.prompt}` });
  });
  return rows.map((r, i) => ({ n: i + 1, ...r }));
}

function finish(root, sheet, correct, total) {
  const bar = root.querySelector('[data-scorebar]');
  if (bar.dataset.finished) return;
  bar.dataset.finished = '1';
  const started = Number(bar.dataset.started);
  root.rlResult = {
    id: bar.dataset.attempt,
    setId: sheet.id,
    setTitle: `${sheet.short} · ${sheet.title}`,
    correct,
    total,
    durationSec: Math.round((Date.now() - started) / 1000),
    startedAt: new Date(started).toISOString(),
    finishedAt: new Date().toISOString(),
    items: collectAnswers(sheet),
  };
  const panel = root.querySelector('[data-done]');
  panel.hidden = false;
  panel.innerHTML = `<h2>Finished: ${correct} / ${total} <span class="muted">(${Math.round((100 * correct) / total)}%)</span></h2>
    <div data-sheet-status></div>`;
  if (!sheetConfigured()) {
    panel.querySelector('[data-sheet-status]').innerHTML = '<p class="muted">Your best score is saved in this browser. (No teacher’s sheet is connected.)</p>';
    return;
  }
  if (studentName()) submitResult(root);
  else showNameForm(root);
}

function showNameForm(root) {
  const s = getSettings();
  root.querySelector('[data-sheet-status]').innerHTML = `<form class="row" data-name-form>
      <input class="dict-input" style="flex:1 1 180px;margin:0" name="student" required maxlength="80" placeholder="Your name" aria-label="Your name" value="${esc(s.student)}">
      <input class="dict-input" style="flex:0 1 140px;margin:0" name="group" maxlength="40" placeholder="Class / group" aria-label="Class or group" value="${esc(s.group)}">
      <button class="btn primary" type="submit">Send to my teacher</button>
    </form>`;
}

async function submitResult(root) {
  const status = root.querySelector('[data-sheet-status]');
  if (!status || !root.rlResult) return;
  status.innerHTML = '<p class="muted">Sending your results to your teacher…</p>';
  try {
    await sendResult(root.rlResult);
    const s = getSettings();
    status.innerHTML = `<p class="sent">✓ Sent to your teacher's sheet as <b>${esc(s.student)}</b>${s.group ? ` (${esc(s.group)})` : ''}.</p>`;
  } catch (err) {
    status.innerHTML = `<p class="muted">Couldn't send (${esc(err.message)}). It's saved and will be sent again automatically.</p>
      <button type="button" class="btn" data-send-results>Try again</button>`;
  }
}

export function handleNameForm(form, root) {
  const data = new FormData(form);
  const student = String(data.get('student') || '').trim();
  if (!student) return;
  saveSettings({ student, group: String(data.get('group') || '').trim() });
  submitResult(root);
}

// For tests and the home page.
export { unitsOf, pointsOf, isScored };
