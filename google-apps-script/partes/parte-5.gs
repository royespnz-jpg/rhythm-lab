/* ── Rhythm Lab · parte 5 de 8 ── */

function voices_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('voices_v1');
  let voices = hit ? JSON.parse(hit) : null;
  if (!voices) {
    const key = elevenKey_();
    let res = UrlFetchApp.fetch(TTS.api + '/voices', { headers: { 'xi-api-key': key }, muteHttpExceptions: true });
    if (res.getResponseCode() === 404 || res.getResponseCode() === 410) {
      res = UrlFetchApp.fetch(TTS.api.replace('/v1', '/v2') + '/voices?page_size=100', {
        headers: { 'xi-api-key': key },
        muteHttpExceptions: true,
      });
    }
    if (res.getResponseCode() !== 200) throw new Error(elevenError_(res));
    voices = (JSON.parse(res.getContentText()).voices || []).map(function (v) {
      const labels = v.labels || {};
      return {
        id: v.voice_id,
        name: v.name,
        accent: labels.accent || '',
        gender: labels.gender || '',
        age: labels.age || '',
        description: labels.description || labels.descriptive || '',
        category: v.category || '',
        preview: v.preview_url || '',
      };
    });
    const json = JSON.stringify(voices);
    if (json.length < 100000) cache.put('voices_v1', json, TTS.cacheSeconds);
  }
  return { ok: true, voices: voices, usage: usage_() };
}

function elevenKeyOrNull_() {
  return PropertiesService.getScriptProperties().getProperty('ELEVENLABS_API_KEY');
}

function elevenKey_() {
  const key = elevenKeyOrNull_();
  if (!key) throw new Error('El motor de voz no tiene API key de ElevenLabs (menú Rhythm Lab → Guardar API key de ElevenLabs).');
  return key;
}

function elevenError_(res) {
  let detail = '';
  try {
    const body = JSON.parse(res.getContentText());
    detail = (body.detail && (body.detail.message || body.detail.status)) || (typeof body.detail === 'string' ? body.detail : '');
  } catch (err) {
    detail = res.getContentText().slice(0, 200);
  }
  return 'ElevenLabs ' + res.getResponseCode() + (detail ? ': ' + detail : '');
}

/* ─── Carpetas de Drive ─── */

function audioFolder_() {
  return folder_('AUDIO_FOLDER_ID', APP_NAME + ' — Audio de ElevenLabs');
}

function recordingsFolder_() {
  return folder_('FOLDER_ID', APP_NAME + ' — Grabaciones');
}

function folder_(property, name) {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(property);
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (err) {
      /* la carpeta se borró: se crea otra */
    }
  }
  const folder = DriveApp.createFolder(name);
  props.setProperty(property, folder.getId());
  return folder;
}

/* ── fin de la parte 5 de 8 ── */
