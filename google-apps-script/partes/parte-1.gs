/* ── Rhythm Lab · parte 1 de 8 ── */

/*
 * ── Rhythm Lab · Google Apps Script ──
 *
 * El “servidor” de la página Rhythm Lab (content words, function words y ritmo):
 *   • Entrega los audios del libro que están en la carpeta de Drive
 *     «Unit 5 Content Words & Function Words» (PAE3_U05_E4A … E8A);
 *     nunca otros archivos.
 *   • Es el motor de voz: genera el audio con ElevenLabs sin que tu API key
 *     quede a la vista. Cada frase se guarda en tu Drive y no se vuelve a pagar.
 *   • Guarda los resultados en esta planilla: Resultados (una fila por
 *     actividad terminada), Respuestas (una fila por respuesta), Grabaciones
 *     (los audios que mandan los alumnos quedan en tu Drive), Resumen y
 *     Alumno × Ejercicio (se actualizan solos).
 *
 * Instalación (una vez, unos 5 minutos):
 *   1. Creá una planilla nueva (sheets.new) → Extensiones → Apps Script.
 *   2. Borrá lo que haya, pegá todo este archivo (o las partes, en orden) y guardá.
 *   3. Elegí la función «setup» → ▶ Ejecutar → aceptá los permisos.
 *      (Si dice «Google no verificó esta app»: Configuración avanzada → Ir a … —
 *      es tu propio script.)
 *   4. Volvé a la planilla y recargala: aparece el menú «Rhythm Lab».
 *      Rhythm Lab → Revisar los audios del libro: tienen que aparecer los 11.
 *      Rhythm Lab → Guardar API key de ElevenLabs → pegá tu key (sk_…).
 *      La key queda solo en este script: no la pegues en ningún otro lado.
 *   5. Implementar → Nueva implementación → ⚙ Aplicación web ·
 *      Ejecutar como: Yo · Quién tiene acceso: Cualquier persona →
 *      Implementar → copiá la URL (termina en /exec).
 *   6. En la página: Settings → pegá la URL → Test connection → Save.
 *
 * Si cambiás este código: Implementar → Administrar implementaciones → ✏ →
 * Versión: Nueva versión → Implementar. La URL sigue siendo la misma.
 */

const APP_NAME = 'Rhythm Lab';
const VERSION = 1;
/* Vacío = la planilla que contiene el script. */
const SPREADSHEET_ID = '';
/* La carpeta de Drive con los audios del libro (y sus subcarpetas). */
const BOOK_FOLDER = '1guU4uPU29kPyFhqvpnSkc7GCVDmPJk-B'; /* Unit 5 Content Words & Function Words */
/* Cada audio de la página, por el nombre de su archivo en la carpeta. */
const TRACKS = {
  E4A: 'PAE3_U05_E4A.mp3',
  E4B: 'PAE3_U05_E4B.mp3',
  E4C: 'PAE3_U05_E4C.mp3',
  E5: 'PAE3_U05_E5.mp3',
  E6A: 'PAE3_U05_E6A.mp3',
  E6B: 'PAE3_U05_E6B.mp3',
  E6C: 'PAE3_U05_E6C.mp3',
  E6D: 'PAE3_U05_E6D.mp3',
  E6E: 'PAE3_U05_E6E.mp3',
  E7A: 'PAE3_U05_E7A.mp3',
  E8A: 'PAE3_U05_E8A.mp3',
};
const HEADER_BG = '#3346d3';
const MAX_TEXT = 1000;
const MAX_ITEMS = 400;
const MAX_AUDIO_BASE64 = 14 * 1024 * 1024;
const AUDIO_EXT = /\.(mp3|m4a|wav|ogg|aac|wma|mpeg|mp4)$/i;

const SHEETS = {
  results: {
    name: 'Resultados',
    headers: ['Fecha', 'Alumno', 'Curso', 'Hoja', 'Título', 'Correctas', 'Total', '%', 'Duración', 'ID intento'],
    widths: [135, 180, 90, 90, 300, 80, 60, 70, 80, 110],
  },
  answers: {
    name: 'Respuestas',
    headers: ['Fecha', 'Alumno', 'Curso', 'Hoja', 'N°', 'Pregunta', 'Respuesta del alumno', 'Respuesta correcta', '¿Correcta?', 'ID intento'],
    widths: [135, 180, 90, 90, 45, 380, 230, 230, 85, 110],
  },
  recordings: {
    name: 'Grabaciones',
    headers: ['Fecha', 'Alumno', 'Curso', 'Frase', 'Audio', 'Duración (s)', 'ID'],
    widths: [135, 180, 90, 340, 110, 95, 110],
  },
  book: {
    name: 'Audios del libro',
    headers: ['Audio', 'Archivo esperado', 'Encontrado', 'Tamaño (KB)', 'ID'],
    widths: [80, 220, 300, 95, 300],
  },
};
/* Tiene que coincidir con js/audio-core.js (los tests lo verifican). */
const TTS = {
  api: 'https://api.elevenlabs.io/v1',
  outputFormat: 'mp3_44100_64',
  defaultModel: 'eleven_multilingual_v2',
  models: ['eleven_multilingual_v2', 'eleven_flash_v2_5', 'eleven_turbo_v2_5', 'eleven_v3'],
  speeds: { natural: 1, slow: 0.8, words: 0.95 },
  maxChars: 400,
  dailyLimit: 20000,
  cacheSeconds: 21600,
};
const SUMMARY = 'Resumen';
const MATRIX = 'Alumno × Ejercicio';
const AUDIO_TYPES = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};

/* ── fin de la parte 1 de 8 ── */
