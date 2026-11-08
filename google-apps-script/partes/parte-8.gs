/* ── Rhythm Lab · parte 8 de 8 ── */

function ensureSummary_(ss) {
  const sheet = ss.getSheetByName(SUMMARY) || ss.insertSheet(SUMMARY, 0);
  sheet.getRange('A1').setValue('Promedio por alumno').setFontWeight('bold').setFontSize(13);
  sheet
    .getRange('A2')
    .setFormula(
      '=IFERROR(QUERY(Resultados!A:J,"select B, C, count(J), avg(H), max(H), max(A) where G is not null ' +
        "group by B, C order by B label count(J) 'Intentos', avg(H) 'Promedio', max(H) 'Mejor', max(A) 'Último' " +
        "format avg(H) '0%', max(H) '0%', max(A) 'dd/MM/yyyy'\",1),\"Todavía no hay resultados.\")"
    );
  sheet.getRange('I1').setValue('Promedio por actividad').setFontWeight('bold').setFontSize(13);
  sheet
    .getRange('I2')
    .setFormula(
      '=IFERROR(QUERY(Resultados!A:J,"select E, count(J), avg(H), min(H), max(H) where G is not null ' +
        "group by E order by E label count(J) 'Intentos', avg(H) 'Promedio', min(H) 'Peor', max(H) 'Mejor' " +
        "format avg(H) '0%', min(H) '0%', max(H) '0%'\",1),\"\")"
    );
  sheet.getRange('A2:N2').setFontWeight('bold');
  sheet.setFrozenRows(2);
  [180, 90, 75, 85, 75, 95, 30, 30, 300, 75, 85, 75, 75].forEach(function (w, i) {
    sheet.setColumnWidth(i + 1, w);
  });
  if (!sheet.getConditionalFormatRules().length) {
    sheet.setConditionalFormatRules([percentScale_(sheet.getRange('D3:E')), percentScale_(sheet.getRange('K3:M'))]);
  }
  return sheet;
}

function ensureMatrix_(ss) {
  const sheet = ss.getSheetByName(MATRIX) || ss.insertSheet(MATRIX);
  sheet
    .getRange('A1')
    .setFormula(
      '=IFERROR(QUERY(Resultados!A:J,"select B, max(H) where G is not null group by B pivot D",1),' +
        '"Acá aparece la mejor nota de cada alumno en cada actividad.")'
    );
  sheet.getRange('A1:Z1').setFontWeight('bold').setWrap(true);
  sheet.getRange('B2:Z').setNumberFormat('0%');
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  sheet.setColumnWidth(1, 180);
  if (!sheet.getConditionalFormatRules().length) {
    sheet.setConditionalFormatRules([percentScale_(sheet.getRange('B2:Z'))]);
  }
  return sheet;
}

function removeEmptyDefaultSheets_(ss) {
  ss.getSheets().forEach(function (sheet) {
    const name = sheet.getName();
    if (/^(Sheet|Hoja|Página|Folha)\s?1$/i.test(name) && sheet.getLastRow() === 0 && ss.getSheets().length > 1) {
      ss.deleteSheet(sheet);
    }
  });
}

function percentScale_(range) {
  return SpreadsheetApp.newConditionalFormatRule()
    .setGradientMinpointWithValue('#f4c7c3', SpreadsheetApp.InterpolationType.NUMBER, '0')
    .setGradientMidpointWithValue('#fce8b2', SpreadsheetApp.InterpolationType.NUMBER, '0.6')
    .setGradientMaxpointWithValue('#b7e1cd', SpreadsheetApp.InterpolationType.NUMBER, '1')
    .setRanges([range])
    .build();
}

/* ── fin de la parte 8 de 8 ── */
