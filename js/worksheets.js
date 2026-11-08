// The Rhythm Lab: the key ideas of Unit 5 "Content Words and Function Words"
// (Gertrude F. Orion, Pronouncing American English) and four activities, all
// with the book's own recordings.
//
// The recordings are the 3rd edition's (PAE3_U05_E4A … E8A). Every sentence
// here was checked against them, word by word (three speech recognizers and a
// forced alignment). Where the PDF of the unit (an earlier edition) says
// something else, the text follows the recording: Exercise 5 (sentences 4, 5
// and 8), Exercise 4C (Molly and Linda) and the whole dialogue of Exercise 8A.
//
// A clip is [track, start, end]: seconds in the book's recording (js/book.js
// plays it). Steps without a clip use the app's voice (ElevenLabs).
//
// Worksheet: { id, short, title, intro, parts: [{ label, title, text, steps }] }
// Step: { key, n, track, task, type, note, … fields of its type }
// Types (js/views/sheet.js):
//   table    – rows of words to listen to (app voice): { label, words }
//   forms    – function words: the strong form alone, then a sentence with the weak form
//   lines    – sentences to listen to and repeat (text markup below)
//   rhythm   – sentences with their beats (*men*) and how long each one takes
//   reduce   – conversational spelling, what it means, and an example
//   choice   – items: { q, clip, options, answer, explain, after }
//   strike   – tap the unstressed function words: {weak} must be crossed out,
//              (word) may be, every other word must not
//   beats    – tap the content words that carry the beats: *word*
//   dialogue – the conversation: each line as it sounds and as it is written
//
// Text markup: {word} crossed out (unstressed, reduced) · [word] underlined
// (strong at the end of a sentence) · **syl** a stressed syllable or word,
// in colour · *word* a beat.

export const BOOKS = {
  pae: {
    short: 'Pronouncing American English',
    long: 'Gertrude F. Orion, Pronouncing American English, Unit 5 “Content Words and Function Words” (recordings of the 3rd edition)',
  },
};

// The book's recordings, in the teacher's Google Drive folder "Unit 5 Content
// Words & Function Words" (google-apps-script/Code.gs sends each one by its
// file name). seconds: the length of the file.
export const TRACKS = {
  E4A: { title: 'Exercise 4A', file: 'PAE3_U05_E4A.mp3', seconds: 30.86 },
  E4B: { title: 'Exercise 4B', file: 'PAE3_U05_E4B.mp3', seconds: 173.21 },
  E4C: { title: 'Exercise 4C', file: 'PAE3_U05_E4C.mp3', seconds: 115.3 },
  E5: { title: 'Exercise 5', file: 'PAE3_U05_E5.mp3', seconds: 70.99 },
  E6A: { title: 'Exercise 6A', file: 'PAE3_U05_E6A.mp3', seconds: 135.58 },
  E6B: { title: 'Exercise 6B', file: 'PAE3_U05_E6B.mp3', seconds: 135.79 },
  E6C: { title: 'Exercise 6C', file: 'PAE3_U05_E6C.mp3', seconds: 120.12 },
  E6D: { title: 'Exercise 6D', file: 'PAE3_U05_E6D.mp3', seconds: 102.48 },
  E6E: { title: 'Exercise 6E', file: 'PAE3_U05_E6E.mp3', seconds: 78.27 },
  E7A: { title: 'Exercise 7A', file: 'PAE3_U05_E7A.mp3', seconds: 72.69 },
  E8A: { title: 'Exercise 8A', file: 'PAE3_U05_E8A.mp3', seconds: 216.4 },
};

// ─── Key ideas ──────────────────────────────────────────────────────────────

const IDEAS = {
  id: 'ideas',
  short: 'Key ideas',
  title: 'Content words, function words and rhythm',
  intro: 'The four ideas of the unit, short: which words carry the message, how function words get weak, how English keeps its beat, and what happens to all this in fast conversation.',
  parts: [
    {
      label: '1',
      title: 'Content words and function words',
      text: `<p>When we speak, we <b>stress the most important words</b> of a sentence. These are usually <b>nouns, main verbs, adjectives and adverbs</b>. They are called <b>content words</b> because they carry the message.</p>
        <p>The other words are <b>function words</b>: <b>articles, pronouns and possessives, prepositions, auxiliary verbs and conjunctions</b>. They connect the content words into grammatical sentences, and they are usually <b>not stressed</b>.</p>
        <p>A listener gets the message from the content words alone: <i>Kathy lost … handbag … restaurant … careless.</i> So say the content words clearly, and the function words quickly and weakly.</p>`,
      steps: [
        {
          key: 'kinds',
          n: 'The two kinds of words',
          type: 'table',
          task: 'Tap a word to hear it. The content words carry the stress; the function words connect them.',
          groups: [
            {
              title: 'Content words · stressed',
              rows: [
                { label: 'Nouns', words: ['Marie', 'book', 'pencil', 'chair', 'bookcase', 'floor'] },
                { label: 'Main verbs', words: ['runs', 'teach', 'speak', 'remind', 'can’t', 'apologize'] },
                { label: 'Adjectives', words: ['sick', 'simple', 'green', 'hot', 'happy', 'big'] },
                { label: 'Adverbs', words: ['really', 'certainly', 'almost', 'slowly', 'today', 'very'] },
              ],
            },
            {
              title: 'Function words · usually unstressed',
              rows: [
                { label: 'Articles', words: ['a', 'an', 'the'] },
                { label: 'Pronouns and possessives', words: ['you', 'your', 'him', 'she', 'he', 'it', 'we', 'our', 'them'] },
                { label: 'Prepositions', words: ['for', 'from', 'by', 'of', 'to', 'at', 'in'] },
                { label: 'Auxiliary verbs', words: ['am', 'can', 'have', 'were', 'was', 'had', 'has', 'will'] },
                { label: 'Conjunctions', words: ['and', 'as', 'or', 'but', 'if', 'that', 'than'] },
              ],
            },
          ],
          note: 'Negatives such as can’t and don’t are stressed: the “not” is important to the message.',
        },
      ],
    },
    {
      label: '2',
      title: 'Strong and weak forms',
      text: `<p>Many function words have <b>two pronunciations</b>. The <b>strong form</b> (stressed) is the one you hear when the word is said alone. In a sentence, the <b>weak form</b> (reduced) is the normal one: its vowel is cut down to <span class="ipa">/ə/</span>, as in <i>a</i> <span class="ipa">/ə/</span>, <i>can</i> <span class="ipa">/kən/</span> and <i>to</i> <span class="ipa">/tə/</span>, or it disappears, as in <i>and</i> <span class="ipa">/n̩/</span> and <i>him</i> <span class="ipa">/m̩/</span>.</p>
        <p>Pronouns and possessives reduce too: <i>you</i> <span class="ipa">/jə/</span>, <i>your</i> <span class="ipa">/jɚ/</span>, <i>he</i> <span class="ipa">/i/</span>, <i>him</i> <span class="ipa">/əm/</span>, <i>her</i> <span class="ipa">/ɚ/</span>. So do <i>at</i> <span class="ipa">/ət/</span> and <i>am</i> <span class="ipa">/əm/</span>.</p>
        <p>Use the <b>strong form</b> only:</p>
        <ul><li>when you say the word <b>by itself</b>;</li>
        <li>at the <b>end of a sentence</b>: <i>Yes, you can.</i> · <i>What are you looking for?</i></li>
        <li>when the function word is <b>important to the meaning</b>: <i>I can do it!</i> (Did you think I couldn’t?)</li></ul>`,
      steps: [
        {
          key: 'can',
          n: 'One sentence, two meanings',
          track: 'E4A',
          type: 'lines',
          task: 'Listen and repeat. The stressed words are in colour; the crossed-out words are unstressed.',
          lines: [
            { text: '{You} **can** go {to} {the} **park**.', clip: ['E4A', 19.99, 21.85], note: '“Can” is stressed: you are able, or you have permission, to go to the park.' },
            { text: '{You} {can} **go** {to} {the} **park**.', clip: ['E4A', 26.06, 27.67], note: '“Can” is unstressed: the park is one place you can go.' },
          ],
        },
        {
          key: 'forms',
          n: 'Strong form, weak form',
          track: 'E4B',
          type: 'forms',
          task: 'First you hear the function word alone: its strong form. Then you hear a sentence with its weak form. Listen and repeat.',
          rows: [
            { w: 'a', strong: '/eɪ/', weak: '/ə/', word: ['E4B', 18.21, 18.99], ex: 'Did you read {a} good book?', clip: ['E4B', 20.98, 22.47] },
            { w: 'an', strong: '/æn/', weak: '/ən/, /n̩/', word: ['E4B', 26.79, 27.59], ex: 'Have {an} orange.', clip: ['E4B', 29.61, 30.72] },
            { w: 'and', strong: '/ænd/', weak: '/ənd/, /ən/, /n̩/', word: ['E4B', 35.02, 35.87], ex: 'We saw Jack {and} Jill.', clip: ['E4B', 37.84, 39.47] },
            { w: 'are', strong: '/ɑr/', weak: '/ɚ/', word: ['E4B', 43.67, 44.48], ex: 'Mary and June {are} sisters.', clip: ['E4B', 46.47, 48.34] },
            { w: 'as', strong: '/æz/', weak: '/əz/', word: ['E4B', 52.73, 53.62], ex: 'You’re {as} sweet {as} sugar.', clip: ['E4B', 55.61, 57.18] },
            { w: 'because', strong: '/bɪˈkɔz/', weak: '/bɪˈkəz/', word: ['E4B', 61.58, 62.7], ex: 'I like it {because} it’s nice.', clip: ['E4B', 64.71, 66.55] },
            { w: 'can', strong: '/kæn/', weak: '/kən/', word: ['E4B', 70.93, 71.8], ex: 'I {can} do it.', clip: ['E4B', 73.81, 74.88] },
            { w: 'for', strong: '/fɔr/', weak: '/fɚ/', word: ['E4B', 79.07, 79.83], ex: 'Is this {for} me?', clip: ['E4B', 81.85, 83.05] },
            { w: 'from', strong: '/frʌm/', weak: '/frəm/', word: ['E4B', 87.44, 88.25], ex: 'This is {from} my brother.', clip: ['E4B', 90.25, 91.7] },
            { w: 'had', strong: '/hæd/', weak: '/həd/', word: ['E4B', 96.0, 96.84], ex: 'He {had} been there.', clip: ['E4B', 98.88, 100.0] },
            { w: 'has', strong: '/hæz/', weak: '/həz/, /əz/', word: ['E4B', 104.32, 105.25], ex: 'He {has} nine brothers.', clip: ['E4B', 107.28, 108.88] },
            { w: 'have', strong: '/hæv/', weak: '/həv/, /əv/', word: ['E4B', 113.26, 114.17], ex: 'We should {have} waited longer.', clip: ['E4B', 116.18, 117.89] },
            { w: 'of', strong: '/ʌv/', weak: '/əv/', word: ['E4B', 122.46, 123.3], ex: 'I’m thinking {of} you.', clip: ['E4B', 125.22, 126.57] },
            { w: 'or', strong: '/ɔr/', weak: '/ɚ/', word: ['E4B', 131.17, 131.96], ex: 'I want three {or} four.', clip: ['E4B', 133.96, 135.37] },
            { w: 'that', strong: '/ðæt/', weak: '/ðət/', word: ['E4B', 139.99, 140.79], ex: 'It’s the one {that} got away.', clip: ['E4B', 142.73, 144.4] },
            { w: 'than', strong: '/ðæn/', weak: '/ðən/', word: ['E4B', 149.01, 149.9], ex: 'It’s nicer {than} yours.', clip: ['E4B', 151.89, 153.58] },
            { w: 'to', strong: '/tu/', weak: '/tə/', word: ['E4B', 158.29, 159.06], ex: 'Go {to} school.', clip: ['E4B', 160.96, 162.05] },
            { w: 'was', strong: '/wʌz/', weak: '/wəz/', word: ['E4B', 166.52, 167.47], ex: 'It {was} good.', clip: ['E4B', 169.34, 170.37] },
          ],
        },
        {
          key: 'end',
          n: 'At the end of a sentence',
          type: 'lines',
          task: 'At the end of a sentence, a function word keeps its strong form (underlined). Listen and repeat.',
          lines: [
            { text: 'Yes, you [can].', clip: ['E6D', 92.79, 93.96] },
            { text: 'Yes, it [was].', clip: ['E6D', 63.54, 64.73] },
            { text: 'I think I [am].', clip: ['E6D', 32.21, 33.4] },
            { text: 'Does he have [to]?', clip: ['E6C', 56.65, 58.06] },
            { text: 'What’s he looking [at]?', clip: ['E6C', 85.71, 87.29] },
            { text: 'What are you looking [for]?', clip: ['E6C', 109.76, 111.38] },
          ],
        },
      ],
    },
    {
      label: '3',
      title: 'The rhythm of English',
      text: `<p>Every language has its own rhythm. In English, the <b>stressed syllables of the content words are the beats</b>, and they come at fairly regular intervals. The unstressed words between the beats are said quickly and weakly so that they fit in.</p>
        <p>So a sentence takes about as long as its <b>number of beats</b>, not its number of words. Stressed content words are held longer than the unstressed function words around them.</p>`,
      steps: [
        {
          key: 'beat',
          n: 'Same beat, more words',
          track: 'E7A',
          type: 'rhythm',
          task: 'These four sentences take about the same time to say. Tap a beat for each of the three content words, <i>men, fight, wars</i>, and keep the same beat for all four sentences. Listen and repeat.',
          lines: [
            { text: '*Men* *fight* *wars*.', clip: ['E7A', 50.29, 51.94], seconds: 1.31 },
            { text: 'The *men* *fight* *wars*.', clip: ['E7A', 56.06, 57.77], seconds: 1.37 },
            { text: 'The *men* will *fight* *wars*.', clip: ['E7A', 61.93, 63.74], seconds: 1.47 },
            { text: 'The *men* will *fight* the *wars*.', clip: ['E7A', 67.88, 69.6], seconds: 1.38 },
          ],
          note: 'Three words or six: in the recording each sentence takes about one and a half seconds, because each one has three beats.',
        },
        {
          key: 'phrases',
          n: 'Longer sentences',
          type: 'lines',
          task: 'Longer sentences are divided into phrases (/). Each phrase takes about the same time to say; the stressed syllables are in colour. Listen and repeat.',
          lines: [
            { text: '**Us**ing the com**pu**ter / I can co**rrect** / all my **spell**ing **err**ors.' },
            { text: 'The **oth**er day / I saw my **cous**in / who is **ver**y sick.' },
          ],
        },
      ],
    },
    {
      label: '4',
      title: 'Reductions in conversation',
      text: `<p>In fast, informal conversation, function words are reduced even more, and they run into the words around them. People write these forms only to show how they sound: they are not used in written English. They are not careless speech, either. They are normal in informal conversation.</p>
        <p>You don’t have to use them, but you need to <b>recognize them</b> when you hear them.</p>`,
      steps: [
        {
          key: 'red',
          n: 'What you hear, what it means',
          type: 'reduce',
          task: 'Tap an example to hear it said naturally, as in conversation.',
          rows: [
            { heard: 'didja', means: 'did you', ex: 'Did you eat breakfast?' },
            { heard: 'dincha', means: 'didn’t you', ex: 'Didn’t you eat lunch?' },
            { heard: 'whatcha', means: 'what are you', ex: 'What are you going to eat?' },
            { heard: 'wanna', means: 'want to', ex: 'Do you want to meet me?' },
            { heard: 'gonna', means: 'going to', ex: 'I guess I’m going to pay it.' },
            { heard: 'hafta', means: 'have to', ex: 'I have to eat something.' },
            { heard: 'lotsa', means: 'lots of, a lot of', ex: 'There’s a lot of food here.' },
            { heard: 'dunno', means: 'don’t know', ex: 'I don’t know.' },
            { heard: '’n', means: 'and', ex: 'I’d like bacon and eggs.' },
            { heard: 'ta', means: 'to', ex: 'Would you like to come?' },
          ],
        },
      ],
    },
  ],
};

// ─── Activity 1 · Check your listening (Exercise 5) ─────────────────────────

const A1 = {
  id: 'listen',
  short: 'Activity 1',
  title: 'Check your listening',
  intro: 'Listen to ten sentences and draw a line through the unstressed function words you hear.',
  parts: [
    {
      label: '1',
      title: 'Cross out the weak words',
      text: `<p>Function words are usually unstressed: you hear them as quick, weak syllables between the beats. Tap a word to draw a line through it, and tap it again to take the line away. Subject pronouns such as <i>I</i>, <i>you</i>, <i>he</i> and <i>it</i> are short too: crossing them out is not counted either way.</p>`,
      steps: [
        {
          key: 'e5',
          n: 'Exercise 5',
          track: 'E5',
          type: 'strike',
          task: 'As you listen to the sentences, draw a line through the unstressed function words you hear.',
          lines: [
            { text: '(I) think Tom {and} Lee went home.', clip: ['E5', 12.43, 14.56] },
            { text: '{The} party {was} fun.', clip: ['E5', 18.65, 20.11] },
            { text: '(You) {can} pass {the} test.', clip: ['E5', 24.3, 26.08] },
            { text: '(I) read {the} play today.', clip: ['E5', 30.35, 32.15] },
            { text: '(I) like {him} very much.', clip: ['E5', 36.35, 37.98] },
            { text: 'Do {as} (I) say, not {as} (I) do.', clip: ['E5', 42.42, 44.72] },
            { text: '(I) think {of} (you) all {the} time.', clip: ['E5', 49.0, 50.79] },
            { text: 'Register {for} {the} class.', clip: ['E5', 54.88, 56.46] },
            { text: '(He) {was} {a} good teacher.', clip: ['E5', 60.69, 62.07] },
            { text: '(I) eat (it) {because} (it’s) healthy.', clip: ['E5', 66.27, 67.97] },
          ],
        },
      ],
    },
  ],
};

// ─── Activity 2 · Strong or weak? (Exercise 4C) ─────────────────────────────

const pair = (sentence, weak, strong) => ({ sentence, weak, strong });
const P = {
  jill: pair('We saw Jack and Jill.', ['/n̩/', 'We saw both Jack and Jill.'], ['/ænd/', 'Jill was there too, but we didn’t expect to see her.']),
  sisters: pair('Molly and Linda are sisters.', ['/ɚ/', 'Simple information.'], ['/ɑr/', 'They are sisters, but we thought they weren’t.']),
  food: pair('The food was good.', ['/wəz/', 'A simple statement of opinion.'], ['/wʌz/', 'It was good, and I was rather surprised.']),
  can: pair('I can do it.', ['/kən/', 'A simple statement of fact.'], ['/kæn/', 'Of course I can do it. Did you think I couldn’t?']),
  had: pair('He had been here.', ['/həd/', 'He was here at an earlier time.'], ['/hæd/', 'A surprise: he was here. Or an accusation: you told me he hadn’t been here, but that wasn’t true.']),
};

// One item: the sentence as recorded with the weak (0) or the strong (1) form.
function sw(p, form, clip) {
  const [wIpa, wMean] = p.weak;
  const [sIpa, sMean] = p.strong;
  return {
    q: p.sentence,
    clip,
    options: [`Weak form ${wIpa} · ${wMean}`, `Strong form ${sIpa} · ${sMean}`],
    answer: form,
    explain: form ? `Strong form ${sIpa}: ${sMean}` : `Weak form ${wIpa}: ${wMean}`,
  };
}

const A2 = {
  id: 'strong-weak',
  short: 'Activity 2',
  title: 'Strong or weak?',
  intro: 'The same sentence with the weak or the strong form of a function word. Listen, decide which one you hear, and see how the meaning changes.',
  parts: [
    {
      label: '2',
      title: 'Which form do you hear?',
      text: `<p>A function word is stressed only when it is important to the meaning. Then you hear its <b>strong form</b>, with a full vowel, and the meaning changes: surprise, insistence, or the correction of what someone believed.</p>`,
      steps: [
        {
          key: 'e4c',
          n: 'Exercise 4C',
          track: 'E4C',
          type: 'choice',
          listenOnly: true,
          task: 'Listen to each sentence. Do you hear the weak form or the strong form of the function word? The book records each sentence twice, once with each form.',
          items: [
            sw(P.jill, 0, ['E4C', 26.94, 28.75]),
            sw(P.sisters, 1, ['E4C', 55.34, 57.78]),
            sw(P.food, 1, ['E4C', 74.56, 76.25]),
            sw(P.can, 0, ['E4C', 83.83, 84.87]),
            sw(P.had, 1, ['E4C', 110.55, 112.25]),
            sw(P.jill, 1, ['E4C', 36.33, 38.29]),
            sw(P.sisters, 0, ['E4C', 45.8, 48.0]),
            sw(P.can, 1, ['E4C', 92.45, 93.92]),
            sw(P.food, 0, ['E4C', 65.39, 66.86]),
            sw(P.had, 0, ['E4C', 101.62, 102.95]),
          ],
        },
      ],
    },
  ],
};

// ─── Activity 3 · Find the beats (Exercise 6) ───────────────────────────────

const A3 = {
  id: 'beats',
  short: 'Activity 3',
  title: 'Find the beats',
  intro: 'Ten short sentences from the book. Tap the content words: they carry the beats. Then listen to the recording and say them with the same rhythm.',
  parts: [
    {
      label: '3',
      title: 'Content words carry the beat',
      text: `<p>Nouns, main verbs, adjectives and adverbs are the content words: they are stressed, and their stressed syllables are the beats of the sentence. The function words between them (articles, pronouns, prepositions, auxiliaries, conjunctions) are squeezed in, quickly and weakly.</p>`,
      steps: [
        {
          key: 'e6',
          n: 'Exercise 6',
          type: 'beats',
          task: 'Tap the content words in each sentence. Check, then listen to the book’s recording and repeat with the same beat.',
          lines: [
            { text: 'It’s a *lot* of *money*.', clip: ['E6C', 26.54, 27.86] },
            { text: 'A *cup* of *coffee*.', clip: ['E6C', 32.0, 33.29] },
            { text: 'He *went* to *college*.', clip: ['E6C', 45.43, 46.93] },
            { text: 'They’re *sister* and *brother*.', clip: ['E6E', 21.16, 22.86] },
            { text: 'It’s as *white* as *snow*.', clip: ['E6E', 43.88, 45.59] },
            { text: '*Take* it or *leave* it.', clip: ['E6E', 62.34, 63.64] },
            { text: '*Give* him a *break*.', clip: ['E6B', 100.43, 101.56] },
            { text: 'He *took* your *place*.', clip: ['E6B', 58.02, 59.29] },
            { text: '*Ask* for *change*.', clip: ['E6C', 104.15, 105.58] },
            { text: '*Boil* an *egg*.', clip: ['E6A', 57.71, 59.13] },
          ],
        },
      ],
    },
  ],
};

// ─── Activity 4 · Decode the conversation (Exercise 8A) ─────────────────────

// The dialogue as the recording has it (3rd edition): A is the man, B the
// woman. said: as it sounds (the book's conversational spelling); written: the
// written English the recording reads after it.
export const DIALOGUE = [
  { who: 'A', said: 'Hi, howarya?', written: 'Hi, how are you?', clip: ['E8A', 16.59, 17.89], wclip: ['E8A', 21.09, 22.42] },
  { who: 'B', said: 'Ahm starved.', written: 'I am hungry.', clip: ['E8A', 25.52, 26.68], wclip: ['E8A', 29.77, 30.99] },
  { who: 'A', said: 'Dincha eat lunch?', written: 'Did you not eat lunch?', clip: ['E8A', 34.1, 35.22], wclip: ['E8A', 38.3, 39.65] },
  { who: 'B', said: 'No, didja?', written: 'No, did you?', clip: ['E8A', 42.77, 44.44], wclip: ['E8A', 47.54, 49.26] },
  { who: 'A', said: 'Yeah, I hadda pizza, but I’m still hungry.', written: 'Yes, I had a pizza, but I am still hungry.', clip: ['E8A', 52.4, 54.92], wclip: ['E8A', 59.18, 61.89] },
  { who: 'B', said: 'Wanna meet me at the diner in ten minutes? We’ll have lunch.', written: 'Do you want to meet me at the diner in ten minutes? We will have lunch.', clip: ['E8A', 66.16, 69.75], wclip: ['E8A', 75.67, 79.82] },
  { who: 'A', said: 'Great. I’ll meetcha there.', written: 'Great! I will meet you there.', clip: ['E8A', 85.77, 87.46], wclip: ['E8A', 90.56, 92.53] },
  { scene: 'Later, at the diner', clip: ['E8A', 95.66, 97.11] },
  { who: 'A', said: 'Whatcha gonna eat?', written: 'What are you going to eat?', clip: ['E8A', 97.97, 98.93], wclip: ['E8A', 102.03, 103.37] },
  { who: 'B', said: 'Ahdunno. I hafta eat something.', written: 'I do not know. I have to eat something.', clip: ['E8A', 106.46, 109.28], wclip: ['E8A', 113.47, 116.78] },
  { who: 'A', said: 'Cantcha find anything on the menu?', written: 'Can you not find anything on the menu?', clip: ['E8A', 121.15, 122.91], wclip: ['E8A', 127.16, 129.42] },
  { who: 'B', said: 'Gee, that’s the problem. Lotsa food ta choose from. I can’t decide.', written: 'Well, that is the problem. There is a lot of food to choose from. I cannot decide.', clip: ['E8A', 133.71, 139.0], wclip: ['E8A', 145.49, 151.04] },
  { who: 'A', said: 'Well, wouldja like soupersalad?', written: 'Well, would you like soup or salad?', clip: ['E8A', 157.54, 159.56], wclip: ['E8A', 163.79, 166.22] },
  { who: 'B', said: 'What’s a soupersalad?', written: 'What is a soupersalad?', clip: ['E8A', 170.46, 172.23], wclip: ['E8A', 176.44, 178.26] },
  { who: 'A', said: 'There’s no soupersalad. I said soup or salad.', written: 'There is no soupersalad. I said soup or salad.', clip: ['E8A', 182.5, 185.77], wclip: ['E8A', 191.7, 195.06] },
  { who: 'B', said: 'Oh, is that whatcha mean? I’llava salad.', written: 'Oh, is that what you mean? I will have a salad.', clip: ['E8A', 200.98, 204.78], wclip: ['E8A', 209.04, 212.5] },
];

const line = (said) => DIALOGUE.find((l) => l.said === said);
// A line of the dialogue as a question: what does it mean in written English?
function decode(said, options, answer) {
  const l = line(said);
  if (!l || options[answer] !== l.written) throw new Error(`decode: the answer to “${said}” is not its written form`);
  return { q: l.said, clip: l.clip, after: l.wclip, options, answer, explain: `Written English: ${l.written}` };
}

const A4 = {
  id: 'decode',
  short: 'Activity 4',
  title: 'Decode the conversation',
  intro: 'Two friends meet and go to lunch, in fast, informal speech. Listen to each line and choose what it means in written English. Then listen to the whole conversation and repeat it.',
  parts: [
    {
      label: '4',
      title: 'What does it mean?',
      text: `<p>In conversation, the function words almost disappear: <i>didja</i>, <i>whatcha</i>, <i>gonna</i>, <i>hafta</i>, <i>lotsa</i>. The content words still carry the message, so listen for the beats and rebuild the rest.</p>`,
      steps: [
        {
          key: 'e8a',
          n: 'Exercise 8A',
          track: 'E8A',
          type: 'choice',
          listenOnly: true,
          task: 'Listen to each line as it sounds in conversation. What does it mean in written English?',
          items: [
            decode('Hi, howarya?', ['Hi, how are you?', 'Hi, who are you?', 'Hi, how old are you?'], 0),
            decode('Dincha eat lunch?', ['Did you eat lunch?', 'Did you not eat lunch?', 'Do you eat lunch?'], 1),
            decode('Yeah, I hadda pizza, but I’m still hungry.', ['Yes, I have to eat pizza, but I am still hungry.', 'Yes, I had the pizza, but I am still hungry.', 'Yes, I had a pizza, but I am still hungry.'], 2),
            decode(
              'Wanna meet me at the diner in ten minutes? We’ll have lunch.',
              [
                'Do you want to meet me at the diner in ten minutes? We will have lunch.',
                'Do you want me to meet you at the diner in ten minutes? We will have lunch.',
                'Do you want to meet me at the diner in ten minutes? We would have lunch.',
              ],
              0,
            ),
            decode('Great. I’ll meetcha there.', ['Great! I met you there.', 'Great! I will meet you there.', 'Great! I will meet her there.'], 1),
            decode('Whatcha gonna eat?', ['What do you want to eat?', 'What did you eat?', 'What are you going to eat?'], 2),
            decode('Ahdunno. I hafta eat something.', ['I do not know. I have to eat something.', 'I do not know. I have eaten something.', 'I do know. I have to eat something.'], 0),
            decode('Cantcha find anything on the menu?', ['Can you find anything on the menu?', 'Can you not find anything on the menu?', 'Can I find anything on the menu?'], 1),
            decode(
              'Gee, that’s the problem. Lotsa food ta choose from. I can’t decide.',
              [
                'Well, that is the problem. There is not a lot of food to choose from. I cannot decide.',
                'Well, that is the problem. There is a lot of food to choose from. I can decide.',
                'Well, that is the problem. There is a lot of food to choose from. I cannot decide.',
              ],
              2,
            ),
            decode('Oh, is that whatcha mean? I’llava salad.', ['Oh, is that what you mean? I will have a salad.', 'Oh, is that what you mean? I would have a salad.', 'Oh, is that what you meant? I will have the salad.'], 0),
          ],
        },
        {
          key: 'talk',
          n: 'The whole conversation',
          type: 'dialogue',
          task: 'Listen to each line as it sounds and as it is written. Then record yourself saying the line as it sounds.',
          lines: DIALOGUE,
        },
      ],
    },
  ],
};

export const WORKSHEETS = [IDEAS, A1, A2, A3, A4];

export const GROUPS = [
  { title: 'Key ideas', ids: ['ideas'] },
  { title: 'Activities', ids: ['listen', 'strong-weak', 'beats', 'decode'] },
];

export const sheetById = (id) => WORKSHEETS.find((w) => w.id === id);

// The steps of a worksheet, in order, each knowing its part.
export function stepsOf(sheet) {
  return sheet.parts.flatMap((part) => part.steps.map((step) => ({ ...step, part })));
}
