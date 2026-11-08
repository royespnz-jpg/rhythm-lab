# Word timings for every clip of the page: forced alignment (pocketsphinx) of
# its text with its stretch of the book recording.
# usage: python3 -I align-clips.py PYLIB WAV_DIR to-align.json out.json
import sys, json, re, wave
sys.path.insert(0, sys.argv[1])
from pocketsphinx import Decoder
WAV, SRC, OUT = sys.argv[2], sys.argv[3], sys.argv[4]
# The book's conversational spellings (Exercise 8A), in CMU phones.
EXTRA = {
    'howarya': 'HH AW ER Y AH', 'ahm': 'AA M', 'dincha': 'D IH N CH AH', 'didja': 'D IH JH AH',
    'hadda': 'HH AE D AH', 'wanna': 'W AA N AH', 'meetcha': 'M IY CH AH', 'whatcha': 'W AH CH AH',
    'gonna': 'G AA N AH', 'ahdunno': 'AA D AH N OW', 'hafta': 'HH AE F T AH', 'cantcha': 'K AE N CH AH',
    'lotsa': 'L AA T S AH', 'ta': 'T AH', 'wouldja': 'W UH JH AH', 'soupersalad': 'S UW P ER S AE L AH D',
    "i'llava": 'AY L AH V AH',
}
words_of = lambda t: re.findall(r"[A-Za-z’']+", t)
norm = lambda w: w.lower().replace('’', "'")
dec = Decoder(samprate=16000, logfn='/dev/null')
for w, ph in EXTRA.items():
    if dec.lookup_word(w) is None:
        dec.add_word(w, ph, True)
cache = {}
def audio(track):
    if track not in cache:
        w = wave.open(f'{WAV}/PAE3_U05_{track}.wav')
        cache[track] = (w.getframerate(), w.readframes(w.getnframes()))
    return cache[track]
out, bad = {}, []
for c in json.load(open(SRC)):
    rate, data = audio(c['track'])
    chunk = data[int(c['a'] * rate) * 2:int(c['b'] * rate) * 2]
    words = words_of(c['text'])
    missing = [w for w in words if dec.lookup_word(norm(w)) is None]
    if missing:
        bad.append((c['key'], 'not in the dictionary: ' + ', '.join(missing)))
        continue
    try:
        dec.set_align_text(' '.join(norm(w) for w in words))
        dec.start_utt(); dec.process_raw(chunk, full_utt=True); dec.end_utt()
        segs = [s for s in dec.seg() if s.word not in ('<s>', '</s>', '<sil>', '[NOISE]', '[noise]')]
    except Exception as e:
        bad.append((c['key'], f'alignment failed: {e}'))
        continue
    if len(segs) != len(words):
        bad.append((c['key'], f'{len(segs)} words aligned of {len(words)}'))
        continue
    out[c['key']] = [[round(s.start_frame / 100, 2), round((s.end_frame + 1) / 100, 2)] for s in segs]
json.dump(out, open(OUT, 'w'), indent=0)
print(len(out), 'aligned ·', len(bad), 'failed')
for k, why in bad: print('  ✗', k, why)
