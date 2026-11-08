// Site-wide defaults. The Rhythm Lab Google Apps Script web app
// (google-apps-script/Code.gs) plays the book recordings from the teacher's
// Drive, generates ElevenLabs audio without exposing the API key, and collects
// results. Visitors can change it in Settings; a student link (?sheet=…) also sets it.
export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby8n9gQQgf30I27u9xA4eOlrddRLGaSm7Ua2Xy6JarN2DZsRTt_5t1SEDBfHEn6PN_zvw/exec';

// Earlier defaults: browsers that saved one of these move to the current URL.
export const OLD_SCRIPT_URLS = [];
