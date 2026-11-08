import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { API_BASE, DEFAULT_MODEL, MODELS, MODES, OUTPUT_FORMAT } from '../js/audio-core.js';
import { TRACKS } from '../js/worksheets.js';
import { MAX_LINES, splitCode, stripMarkers } from '../scripts/split-gs.mjs';

const DIR = new URL('../google-apps-script/', import.meta.url);
const code = readFileSync(new URL('Code.gs', DIR), 'utf8');
const BOOK = '1guU4uPU29kPyFhqvpnSkc7GCVDmPJk-B';

// A pretend Google: one spreadsheet; in Drive, the book folder (with a
// subfolder, a PDF and the recordings) and a private file somewhere else.
function google({ missing = [] } = {}) {
  const props = {};
  const sheets = {};
  const iter = (a) => {
    let i = 0;
    return { hasNext: () => i < a.length, next: () => a[i++] };
  };
  const folder = (id, name, files = [], subs = []) => ({ getId: () => id, getName: () => name, getFiles: () => iter(files), getFolders: () => iter(subs) });
  let n = 0;
  const file = (name, mime = 'audio/mpeg') => {
    const id = `f${String(++n).padStart(24, '0')}`;
    return {
      getId: () => id,
      getName: () => name,
      getMimeType: () => mime,
      getSize: () => 2048,
      getBlob: () => ({ getContentType: () => mime, getBytes: () => [...Buffer.from(name)] }),
    };
  };
  const names = Object.values(TRACKS).map((t) => t.file).filter((f) => !missing.includes(f));
  const recordings = names.map((f) => file(f));
  // One recording sits in a subfolder, as teachers sometimes keep them.
  const sub = folder('sub00000000000000000000000', 'Audios', recordings.slice(-1));
  const book = folder(BOOK, 'Unit 5 Content Words & Function Words', [...recordings.slice(0, -1), file('Unit 5.pdf', 'application/pdf')], [sub]);
  const secret = file('private.mp3');
  const all = [...recordings, secret];
  // Formatting calls (setFontWeight, setColumnWidth…) do nothing and chain.
  const chain = (obj) => new Proxy(obj, { get: (o, k) => (k in o ? o[k] : () => chain(o)) });
  const sheet = (name) => {
    const rows = [];
    return chain({
      rows,
      name,
      appendRow: (r) => rows.push(r),
      getLastRow: () => rows.length + 1,
      getMaxRows: () => 1000,
      getConditionalFormatRules: () => [],
      getRange: (r) =>
        chain({
          setValues: (v) => {
            if (typeof r === 'number' && r >= 2) v.forEach((row, i) => (rows[r - 2 + i] = row));
            return chain({});
          },
          getValues: () => [['ID intento'], ...rows.map((row) => [row[9]])],
          createTextFinder: (t) => ({ matchEntireCell: () => ({ findNext: () => rows.some((row) => row.includes(t)) || null }) }),
        }),
    });
  };
  const ss = { getName: () => 'Rhythm Lab results', getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => (sheets[n] = sheet(n)), getSpreadsheetTimeZone: () => 'America/Costa_Rica' };
  const ctx = {
    sheets,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => (props[k] = v) }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) },
    DriveApp: {
      getFolderById: (id) => [book, sub].find((f) => f.getId() === id) || (() => { throw new Error('No folder'); })(),
      getFileById: (id) => all.find((f) => f.getId() === id) || (() => { throw new Error('No file'); })(),
    },
    SpreadsheetApp: chain({ getActiveSpreadsheet: () => ss, getUi: () => { throw new Error('no UI in tests'); }, InterpolationType: { NUMBER: 'n' } }),
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (body) => ({ body, setMimeType() { return this; } }) },
    Utilities: { base64Encode: (b) => Buffer.from(b).toString('base64') },
    Logger: { log() {} },
    props,
    secret,
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx;
}
const post = (g, data) => JSON.parse(g.doPost({ postData: { contents: JSON.stringify(data) } }).body);

test('the code still works if the editor joins its lines (only block comments)', () => {
  assert.doesNotThrow(() => new vm.Script(code.replace(/\n/g, ' ')));
});

test('the parts are the whole Code.gs, in order, each short enough to paste', () => {
  const names = readdirSync(new URL('partes/', DIR)).filter((f) => f.endsWith('.gs')).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)));
  const files = names.map((n) => readFileSync(new URL(`partes/${n}`, DIR), 'utf8'));
  const parts = files.map(stripMarkers);
  assert.deepEqual(parts, splitCode(code), 'run: node scripts/split-gs.mjs');
  for (const p of parts) assert.doesNotThrow(() => new vm.Script(p), 'each part is complete code');
  for (const [i, f] of files.entries()) {
    const lines = f.replace(/\n$/, '').split('\n').length;
    assert.ok(lines <= 120, `parte-${i + 1}.gs has ${lines} lines (the editor takes 120)`);
    assert.ok(parts[i].split('\n').length <= MAX_LINES, `parte-${i + 1}.gs`);
  }
});

test('the voice engine settings match the page', () => {
  const g = google();
  const TTS = vm.runInContext('TTS', g);
  assert.equal(TTS.api, API_BASE);
  assert.equal(TTS.defaultModel, DEFAULT_MODEL);
  assert.equal(TTS.outputFormat, OUTPUT_FORMAT);
  assert.deepEqual([...TTS.models], MODELS.map((m) => m.id));
  for (const [mode, { speed }] of Object.entries(MODES)) assert.equal(TTS.speeds[mode], speed);
});

test('doGet says it is the Rhythm Lab script', () => {
  const g = google();
  const info = JSON.parse(g.doGet().body);
  assert.equal(info.app, 'Rhythm Lab');
  assert.equal(info.book, true);
  assert.equal(info.tts, false);
  g.props.ELEVENLABS_API_KEY = 'sk_test';
  assert.equal(JSON.parse(g.doGet().body).tts, true);
});

test('the script and the page name the same 11 recordings', () => {
  const g = google();
  const names = vm.runInContext('TRACKS', g);
  assert.deepEqual(JSON.parse(JSON.stringify(names)), Object.fromEntries(Object.entries(TRACKS).map(([k, t]) => [k, t.file])));
  assert.equal(vm.runInContext('BOOK_FOLDER', g), BOOK, 'the folder of the unit in Drive');
});

test('the book recordings: found by name in the folder (and its subfolders), sent only from it', () => {
  const g = google();
  const list = post(g, { type: 'book-list' });
  assert.equal(list.ok, true);
  assert.equal(list.tracks.length, 11);
  assert.ok(list.tracks.every((t) => t.found === t.file), 'all 11 found');
  const audio = post(g, { type: 'book-audio', track: 'E8A' });
  assert.equal(audio.ok, true);
  assert.equal(Buffer.from(audio.audio, 'base64').toString(), 'PAE3_U05_E8A.mp3', 'the file in the subfolder');
  assert.equal(Buffer.from(post(g, { type: 'book-audio', track: 'E5' }).audio, 'base64').toString(), 'PAE3_U05_E5.mp3');
  // Nothing but the 11 recordings: no IDs, no other names.
  assert.match(post(g, { type: 'book-audio', track: 'private' }).error, /No hay un audio/);
  assert.match(post(g, { type: 'book-audio', id: g.secret.getId() }).error, /No hay un audio/);
  assert.match(post(g, { type: 'book-audio', track: 'toString' }).error, /No hay un audio/);
});

test('a recording missing from the folder says so', () => {
  const g = google({ missing: ['PAE3_U05_E4C.mp3'] });
  const list = post(g, { type: 'book-list' });
  assert.deepEqual(list.tracks.filter((t) => !t.found).map((t) => t.track), ['E4C']);
  assert.match(post(g, { type: 'book-audio', track: 'E4C' }).error, /no está en la carpeta/);
  assert.equal(vm.runInContext('listarAudios()', g), 10);
  assert.equal(g.sheets['Audios del libro'].rows.length, 11);
});

test('voices need the key; unknown requests are refused', () => {
  const g = google();
  assert.match(post(g, { type: 'tts', text: 'Men fight wars.', voiceId: 'EXAVITQu4vr4xnSDxMaL' }).error, /Guardar API key/);
  assert.match(post(g, { type: 'nope' }).error, /desconocido/);
});

test('results: one row per activity, one per answer, no duplicates', () => {
  const g = google();
  const result = {
    type: 'result',
    id: 'attempt-1',
    student: 'Ana',
    group: '10-1',
    setId: 'listen',
    setTitle: 'Activity 1 · Check your listening',
    correct: 2,
    total: 3,
    durationSec: 90,
    finishedAt: '2026-11-08T15:00:00Z',
    items: [
      { n: 1, prompt: '1. I think Tom and Lee went home.', answer: 'and', expected: 'and', correct: true },
      { n: 2, prompt: '=HYPERLINK("x")', answer: '', expected: 'The', correct: false },
    ],
  };
  assert.deepEqual(post(g, result), { ok: true, saved: 2 });
  assert.deepEqual(post(g, result), { ok: true, duplicate: true });
  const res = g.sheets.Resultados.rows;
  assert.equal(res.length, 1);
  assert.equal(res[0][1], 'Ana');
  assert.equal(res[0][7], 2 / 3);
  const ans = g.sheets.Respuestas.rows;
  assert.equal(ans.length, 2);
  assert.equal(ans[1][5], '\'=HYPERLINK("x")', 'no formulas from students');
});
