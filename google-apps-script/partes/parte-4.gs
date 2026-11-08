/* ── Rhythm Lab · parte 4 de 8 ── */

/* ─── Motor de voz (ElevenLabs) ─── */

/** Texto que se envía a ElevenLabs para cada modo (igual que ttsTextFor en la página). */
function ttsText_(text, mode, model) {
  if (mode !== 'words') return text;
  const joiner = model.indexOf('eleven_v3') === 0 ? ' ... ' : ' <break time="0.35s"/> ';
  return text.split(/\s+/).filter(Boolean).join(joiner);
}

function ttsBody_(text, mode, model) {
  return {
    text: ttsText_(text, mode, model),
    model_id: model,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
      use_speaker_boost: true,
      speed: TTS.speeds[mode],
    },
  };
}

function tts_(d) {
  const key = elevenKey_();
  const text = String(d.text || '').replace(/\s+/g, ' ').trim();
  if (!text) throw new Error('Falta el texto.');
  if (text.length > TTS.maxChars) throw new Error('El texto es demasiado largo (máx. ' + TTS.maxChars + ' caracteres).');
  const mode = Object.prototype.hasOwnProperty.call(TTS.speeds, d.mode) ? d.mode : 'natural';
  const model = TTS.models.indexOf(d.model) >= 0 ? d.model : TTS.defaultModel;
  const voiceId = String(d.voiceId || '');
  if (!/^[A-Za-z0-9]{8,40}$/.test(voiceId)) throw new Error('Voz inválida.');

  const name = 'tts_' + digest_([voiceId, model, mode, text].join('|'));
  const cache = CacheService.getScriptCache();
  const hit = cache.get(name);
  if (hit) return { ok: true, audio: hit, mime: 'audio/mpeg', cached: true };

  const folder = audioFolder_();
  const files = folder.getFilesByName(name + '.mp3');
  if (files.hasNext()) {
    const saved = Utilities.base64Encode(files.next().getBlob().getBytes());
    putCache_(cache, name, saved);
    return { ok: true, audio: saved, mime: 'audio/mpeg', cached: true };
  }

  reserveChars_(text.length);
  const res = UrlFetchApp.fetch(
    TTS.api + '/text-to-speech/' + encodeURIComponent(voiceId) + '?output_format=' + TTS.outputFormat,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { 'xi-api-key': key, Accept: 'audio/mpeg' },
      payload: JSON.stringify(ttsBody_(text, mode, model)),
      muteHttpExceptions: true,
    }
  );
  if (res.getResponseCode() !== 200) throw new Error(elevenError_(res));
  const blob = res.getBlob().setName(name + '.mp3');
  folder.createFile(blob);
  const audio = Utilities.base64Encode(blob.getBytes());
  putCache_(cache, name, audio);
  return { ok: true, audio: audio, mime: 'audio/mpeg', cached: false };
}

function dailyLimit_() {
  const n = Number(PropertiesService.getScriptProperties().getProperty('ELEVENLABS_DAILY_LIMIT'));
  return n > 0 ? n : TTS.dailyLimit;
}

function today_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function usage_() {
  const raw = PropertiesService.getScriptProperties().getProperty('TTS_USAGE');
  const u = raw ? JSON.parse(raw) : {};
  return { today: u.day === today_() ? u.chars : 0, limit: dailyLimit_() };
}

/** Suma los caracteres de hoy; corta si se pasa del límite diario. */
function reserveChars_(n) {
  withLock_(function () {
    const props = PropertiesService.getScriptProperties();
    const used = usage_().today;
    if (used + n > dailyLimit_()) throw new Error('Se alcanzó el límite diario de voz. Probá mañana.');
    props.setProperty('TTS_USAGE', JSON.stringify({ day: today_(), chars: used + n }));
  });
}

function putCache_(cache, name, base64) {
  if (base64.length < 100000) cache.put(name, base64, TTS.cacheSeconds);
}

function digest_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) {
      return ('0' + (b & 255).toString(16)).slice(-2);
    })
    .join('');
}

/* ── fin de la parte 4 de 8 ── */
