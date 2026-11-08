/* ── Rhythm Lab · parte 7 de 8 ── */

/* ─── Hojas ─── */

function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create(APP_NAME + ' — Resultados');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function sheet_(ss, def) {
  return ss.getSheetByName(def.name) || ensureSheet_(ss, def);
}

function ensureSheet_(ss, def) {
  const sheet = ss.getSheetByName(def.name) || ss.insertSheet(def.name);
  sheet
    .getRange(1, 1, 1, def.headers.length)
    .setValues([def.headers])
    .setFontWeight('bold')
    .setBackground(HEADER_BG)
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  def.widths.forEach(function (w, i) {
    sheet.setColumnWidth(i + 1, w);
  });
  if (def === SHEETS.book) return sheet;
  sheet.getRange('A2:A').setNumberFormat('dd/mm/yyyy hh:mm');

  if (def === SHEETS.results) {
    sheet.getRange('H2:H').setNumberFormat('0%');
    sheet.getRange('I2:I').setNumberFormat('[m]:ss');
    if (!sheet.getConditionalFormatRules().length) {
      sheet.setConditionalFormatRules([percentScale_(sheet.getRange('H2:H'))]);
    }
  }
  if (def === SHEETS.answers) {
    /* Las casillas se agregan fila por fila al guardar: las filas vacías no llevan casilla. */
    const used = lastRowWithId_(sheet);
    const extra = sheet.getMaxRows() - used;
    if (extra > 0) sheet.getRange(used + 1, 9, extra, 1).clearDataValidations().clearContent();
    if (!sheet.getConditionalFormatRules().length) {
      sheet.setConditionalFormatRules([
        SpreadsheetApp.newConditionalFormatRule()
          .whenFormulaSatisfied('=AND($J2<>"",$I2=FALSE)')
          .setBackground('#fde2e1')
          .setRanges([sheet.getRange('A2:J')])
          .build(),
      ]);
    }
  }
  return sheet;
}

/* ─── Utilidades ─── */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Texto seguro para una celda: recortado y sin fórmulas (=, +, -, @ al principio). */
function clean_(value, max) {
  const s = String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max || MAX_TEXT);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function cleanId_(value) {
  const id = String(value || '').replace(/[^\w-]/g, '').slice(0, 64);
  if (!id) throw new Error('Falta el ID.');
  return id;
}

function num_(value) {
  const n = Number(value);
  return isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0;
}

function date_(value) {
  const d = value ? new Date(value) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Última fila con «ID intento» (columna J); las casillas vacías no cuentan. */
function lastRowWithId_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return 1;
  const ids = sheet.getRange(1, 10, last, 1).getValues();
  for (let r = ids.length - 1; r >= 1; r--) if (String(ids[r][0]).trim() !== '') return r + 1;
  return 1;
}

function exists_(sheet, column, id) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  return Boolean(sheet.getRange(2, column, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext());
}

/* ── fin de la parte 7 de 8 ── */
