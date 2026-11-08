import { MODELS } from '../audio-core.js?v=202611080415';
import { getSettings, scriptStatus, voiceName } from '../tts.js?v=202611080415';
import { esc, playButton } from '../ui.js?v=202611080415';
import { isSheetUrl, pendingCount, studentLink } from '../sheets.js?v=202611080415';
import { TRACKS } from '../worksheets.js?v=202611080415';

export function renderSettings() {
  const s = getSettings();
  const st = scriptStatus();
  const engineText =
    s.engine === 'browser'
      ? 'Browser voice (ElevenLabs is off).'
      : s.apiKey
        ? 'ElevenLabs with your personal key.'
        : st.status === 'ok'
          ? `ElevenLabs through the Google Script${st.sheet ? ` of “${esc(st.sheet)}”` : ''}. The key stays in the script.`
          : st.status === 'other'
            ? 'The Google Script at this URL is not the Rhythm Lab script (maybe the Stress Lab or Connected Speech one). Use the URL of the Rhythm Lab script.'
            : st.status === 'no-tts'
              ? 'The Google Script is connected but has no ElevenLabs key yet (in the sheet: Rhythm Lab → Guardar API key de ElevenLabs).'
              : st.status === 'offline'
                ? isSheetUrl(s.sheetUrl)
                  ? `Can't reach the Google Script: ${esc(st.error || 'offline')}.`
                  : 'No Google Script is connected yet: the browser voice is used. Paste the script URL below.'
                : 'Checking the Google Script…';
  return `<header class="topic-head">
      <div class="eyebrow">Settings</div>
      <h1>Voice, recordings &amp; <em>results</em></h1>
      <p class="lede">Connect the teacher's Google Script (book recordings, voices and results), pick the ElevenLabs voices, and check that the script finds every recording of the book.</p>
    </header>

    <div class="settings-stack">
      ${sheetForm(s)}

      <section class="card form">
        <h2>Voice engine</h2>
        <p class="muted" style="margin:0">${engineText}</p>
        <div class="row">
          <div class="field" style="flex:1 1 180px"><label>Main voice</label><div class="vp-tab" aria-hidden="true" style="pointer-events:none"><span>${esc(voiceName('A'))}</span></div></div>
          <div class="field" style="flex:1 1 180px"><label>Second speaker</label><div class="vp-tab" aria-hidden="true" style="pointer-events:none"><span>${esc(voiceName('B'))}</span></div></div>
        </div>
        <div class="row">
          <button type="button" class="btn primary" data-open-voices>Choose voices</button>
          ${playButton('Using the computer, I can correct all my spelling errors.', { label: 'Main voice' })}
          ${playButton('The other day I saw my cousin, who is very sick.', { voice: 'B', label: 'Second speaker' })}
        </div>
        <div class="field">
          <label for="model">ElevenLabs model</label>
          <select id="model" data-model>${MODELS.map((o) => `<option value="${o.id}"${o.id === s.model ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>
          <div class="hint">Multilingual v2 sounds best. Flash and Turbo cost half the credits.</div>
        </div>
      </section>

      <section class="card form" id="book-audio">
        <h2>Book recordings</h2>
        <p class="muted" style="margin:0">The ${Object.keys(TRACKS).length} recordings of the unit (PAE3_U05_E4A … E8A) stay in the teacher's Google Drive,
          in the folder <i>Unit 5 Content Words &amp; Function Words</i>. The Google Script finds each one by its file name and sends it to the page,
          which plays one sentence at a time.</p>
        <p class="muted" style="margin:0">${bookStatus(st)}</p>
        <div class="row"><button type="button" class="btn" data-book-check${st.status === 'ok' || st.status === 'no-tts' ? '' : ' disabled'}>Check the recordings</button></div>
        <div id="book-out"></div>
      </section>

      <details class="card">
        <summary>Your own ElevenLabs key <span class="muted" style="font-size:1rem">(optional)</span></summary>
        <form class="form" id="settings-form" autocomplete="off">
          <p class="muted" style="margin:0">Normally the Google Script generates the voices and keeps the key private. Add a key
            here only to use your own ElevenLabs account from this browser.</p>
          <div class="field">
            <label for="api-key">ElevenLabs API key</label>
            <div class="row">
              <input id="api-key" name="apiKey" type="password" value="${esc(s.apiKey)}" placeholder="sk_…" style="flex:1 1 240px" spellcheck="false" autocomplete="off">
              <button type="button" class="btn" data-toggle-key>Show</button>
            </div>
            <div class="hint">Saved only in this browser and sent only to api.elevenlabs.io. Don't use it on a shared computer.</div>
          </div>
          <div class="row">
            <button type="submit" class="btn primary">Save</button>
            <button type="button" class="btn" data-check-credits>Check credits</button>
            <button type="button" class="btn" data-clear-cache>Clear audio cache</button>
          </div>
          <div id="credits-out"></div>
        </form>
      </details>
    </div>`;
}

function bookStatus(st) {
  if (st.status === 'ok' || st.status === 'no-tts') return st.book ? '✓ The Google Script can send the book recordings.' : 'The Google Script doesn’t send book recordings: is it the Rhythm Lab script?';
  if (st.status === 'checking' || st.status === 'unknown') return 'Checking the Google Script…';
  return 'Connect the Google Script first (above): the book recordings come through it.';
}

// Which file of the teacher's folder each recording uses, for the teacher to verify.
export function bookTableHtml(tracks) {
  const missing = tracks.filter((t) => !t.found).length;
  const rows = tracks
    .map(
      (t) => `<tr class="${t.found ? '' : 'miss'}">
        <td>${esc(TRACKS[t.track]?.title || t.track)}</td>
        <td>${esc(t.file)}</td>
        <td>${t.found ? `✓ ${esc(t.found)}${t.size ? ` <small class="muted">(${Math.round(t.size / 1024)} KB)</small>` : ''}` : '<b>not in the folder</b>'}</td>
      </tr>`,
    )
    .join('');
  return `<p class="${missing ? 'warn-text' : 'sent'}">${tracks.length - missing} of ${tracks.length} recordings found${missing ? ` · ${missing} missing` : ' ✓'}.</p>
    <div class="table-wrap book-table"><table>
      <thead><tr><th scope="col">Recording</th><th scope="col">File name</th><th scope="col">In the folder</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

export function renderCredits(sub) {
  const out = document.getElementById('credits-out');
  if (!out) return;
  const used = sub.character_count ?? 0;
  const limit = sub.character_limit ?? 0;
  const pct = limit ? Math.min(100, (100 * used) / limit) : 0;
  const reset = sub.next_character_count_reset_unix ? new Date(sub.next_character_count_reset_unix * 1000).toLocaleDateString() : '—';
  out.innerHTML = `<div style="margin-top:6px"><b>${esc(sub.tier || 'plan')}</b>: ${used.toLocaleString()} of ${limit.toLocaleString()} credits used
    <div class="meter"><span style="width:${pct}%"></span></div>
    <small class="muted">${(limit - used).toLocaleString()} left · resets ${esc(reset)}</small></div>`;
}

function sheetForm(s) {
  const connected = isSheetUrl(s.sheetUrl);
  const pending = pendingCount();
  return `<form class="card form" id="sheet-form" autocomplete="off">
      <h2>Google Script → results</h2>
      <p class="muted" style="margin:0">Finished activities (and recordings you choose to send) go to your teacher's Google
        Sheet. Teachers: set up the sheet with <code>google-apps-script/Code.gs</code> from the repository.</p>
      <div class="row">
        <div class="field" style="flex:1 1 200px"><label for="student">Your name</label>
          <input id="student" name="student" type="text" maxlength="80" value="${esc(s.student)}"></div>
        <div class="field" style="flex:0 1 160px"><label for="group">Class / group</label>
          <input id="group" name="group" type="text" maxlength="40" value="${esc(s.group)}"></div>
      </div>
      <div class="field">
        <label for="sheet-url">Google Script URL (book recordings, voices and results)</label>
        <input id="sheet-url" name="sheetUrl" type="text" spellcheck="false" value="${esc(s.sheetUrl)}"
          placeholder="https://script.google.com/macros/s/…/exec">
        <div class="hint">${connected ? '✓ Saved. ' : ''}Students: your teacher gives you this (or a link that fills it in).</div>
      </div>
      <div class="row">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" data-test-sheet>Test connection</button>
        ${pending ? `<button type="button" class="btn" data-flush-sheet>Send pending (${pending})</button>` : ''}
      </div>
      ${
        connected
          ? `<div class="field"><label for="student-link">Student link</label>
          <div class="row"><input id="student-link" type="text" readonly value="${esc(studentLink(s.sheetUrl))}" style="flex:1 1 240px">
            <button type="button" class="btn" data-copy-link>Copy</button></div>
          <div class="hint">Share it with your students: it opens the lab already connected to your sheet.</div></div>`
          : ''
      }
    </form>`;
}
