export const replaceEach = (s: string, replacements: [string | RegExp, string][]): string =>
  replacements.reduce((s, [regex, to]) => s.replace(regex, to), s);

export const unixDay = (date: Date): number => date.getTime() / (24 * 60 * 60 * 1000);

export const UnixDay = (props: { children: string }) => <>ud{unixDay(new Date(props.children))}</>;

export const toArab = (text) =>
  replaceEach(text, [
    [/a/g, "ا"],
    [/b/g, "ب"],
    [/c/g, "گ"],
    [/d/g, "د"],
    [/e/g, "\u0650"],
    [/f/g, "ف"],
    [/g/g, "ݣ"],
    [/h/g, "غ"],
    [/i/g, "ی"],
    [/j/g, "ج"],
    [/k/g, "ک"],
    [/l/g, "ش"],
    [/m/g, "م"],
    [/n/g, "ن"],
    [/o/g, "\u064F"],
    [/p/g, "پ"],
    [/q/g, "\u0657"],
    [/r/g, "ر"],
    [/s/g, "س"],
    [/t/g, "ت"],
    [/u/g, "و"],
    [/v/g, "ڤ"],
    [/w/g, "\u064E"],
    [/x/g, "خ"],
    [/y/g, "ۏ"],
    [/z/g, "ز"],
  ]);

export const speak = (text) => {
  const spoken = replaceEach(text, [
    [/[^a-z]+/g, " "],

    [/a/g, "а"],
    [/b/g, "б"],
    [/c/g, "ґ"],
    [/d/g, "д"],
    [/e/g, "е"],
    [/f/g, "ф"],
    [/g/g, "нґ"],
    [/h/g, "г"],
    [/i/g, "і"],
    [/j/g, "ж"],
    [/k/g, "к"],
    [/l/g, "ш"],
    [/m/g, "м"],
    [/n/g, "н"],
    [/o/g, "о"],
    [/p/g, "п"],
    [/q/g, "ьо"],
    [/r/g, "р"],
    [/s/g, "с"],
    [/t/g, "т"],
    [/u/g, "у"],
    [/v/g, "в"],
    [/w/g, "и"],
    [/x/g, "х"],
    [/y/g, "ю"],
    [/z/g, "з"],
  ]);

  const u = new SpeechSynthesisUtterance(spoken);
  console.log(spoken);
  u.lang = "uk";
  u.rate = 1;
  const voices = speechSynthesis.getVoices().filter((it) => it.lang.startsWith(u.lang));
  const voicesBetter = voices.filter(({ voiceURI }) =>
    ["google", "apple"].some((it) => voiceURI.toLowerCase().includes(it)),
  );
  console.log(voices);
  if (voicesBetter.length !== 0) u.voice = voicesBetter[0];
  else if (voices.length !== 0) u.voice = voices[0];
  console.log(u.voice);
  window.speechSynthesis.speak(u);
};
