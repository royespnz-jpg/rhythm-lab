/* ── Rhythm Lab · parte 3 de 8 ── */

/** Escribe en la hoja «Audios del libro» qué archivo usa cada audio de la página. */
function listarAudios() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.book.name) || ss.insertSheet(SHEETS.book.name);
  sheet.clear();
  ensureSheet_(ss, SHEETS.book);
  const list = trackList_(true);
  const rows = list.map(function (t) {
    return [t.track, t.file, t.found ? '✓ ' + t.found : '✗ no está en la carpeta', t.size ? Math.round(t.size / 1024) : '', t.id || ''];
  });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  const found = list.filter(function (t) { return t.found; }).length;
  Logger.log(found + ' de ' + list.length + ' audios encontrados.');
  try {
    SpreadsheetApp.getUi().alert(found + ' de ' + list.length + ' audios del libro encontrados. Están en la hoja «' + SHEETS.book.name + '».');
  } catch (err) {
    /* ejecutado desde el editor: sin interfaz */
  }
  return found;
}

/* ─── Aplicación web ─── */

/** La página usa esto para «Test connection». */
function doGet() {
  const ss = getSpreadsheet_();
  return json_({ ok: true, app: APP_NAME, sheet: ss.getName(), tts: Boolean(elevenKeyOrNull_()), book: true, version: VERSION });
}

/** La página envía acá los resultados, las grabaciones y los pedidos de voz y de audios. */
function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.type === 'tts') return json_(tts_(data));
    if (data.type === 'voices') return json_(voices_());
    if (data.type === 'book-list') return json_({ ok: true, tracks: trackList_(false) });
    if (data.type === 'book-audio') return json_(bookAudio_(data));
    if (data.type === 'result') return json_(withLock_(function () { return saveResult_(data); }));
    if (data.type === 'recording') return json_(withLock_(function () { return saveRecording_(data); }));
    if (data.type === 'ping') return json_({ ok: true });
    return json_({ ok: false, error: 'Pedido desconocido: ' + String(data.type) });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('La planilla está ocupada, probá de nuevo.');
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/* ─── Audios del libro ─── */

function bookFolderId_() {
  return PropertiesService.getScriptProperties().getProperty('BOOK_FOLDER_ID') || BOOK_FOLDER;
}

/** Los audios de la carpeta y sus subcarpetas, por nombre: { nombre: { id, name, size } }. */
function bookFiles_(fresh) {
  const cache = CacheService.getScriptCache();
  if (!fresh) {
    const hit = cache.get('book_v1');
    if (hit) return JSON.parse(hit);
  }
  const out = {};
  walk_(DriveApp.getFolderById(bookFolderId_()), 0, out);
  const json = JSON.stringify(out);
  if (json.length < 90000) cache.put('book_v1', json, 600);
  return out;
}

function walk_(folder, depth, out) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (/^audio\//.test(f.getMimeType()) || AUDIO_EXT.test(f.getName())) {
      out[f.getName().toLowerCase()] = { id: f.getId(), name: f.getName(), size: f.getSize() };
    }
  }
  if (depth >= 3) return;
  const subs = folder.getFolders();
  while (subs.hasNext()) walk_(subs.next(), depth + 1, out);
}

/** Qué archivo de la carpeta usa cada audio de la página. */
function trackList_(fresh) {
  const files = bookFiles_(fresh);
  return Object.keys(TRACKS).map(function (track) {
    const f = files[TRACKS[track].toLowerCase()];
    return { track: track, file: TRACKS[track], found: f ? f.name : '', size: f ? f.size : 0, id: f ? f.id : '' };
  });
}

function bookAudio_(data) {
  const track = String(data.track || '');
  if (!Object.prototype.hasOwnProperty.call(TRACKS, track)) throw new Error('No hay un audio llamado «' + track + '».');
  let f = bookFiles_(false)[TRACKS[track].toLowerCase()];
  if (!f) f = bookFiles_(true)[TRACKS[track].toLowerCase()];
  if (!f) throw new Error('El archivo ' + TRACKS[track] + ' no está en la carpeta del libro.');
  const blob = DriveApp.getFileById(f.id).getBlob();
  const mime = blob.getContentType();
  return { ok: true, track: track, audio: Utilities.base64Encode(blob.getBytes()), mime: /^audio\//.test(mime) ? mime : 'audio/mpeg' };
}

/* ── fin de la parte 3 de 8 ── */
