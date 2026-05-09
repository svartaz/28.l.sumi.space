export const replaceEach = (s: string, replacements: [string | RegExp, string][]): string =>
  replacements.reduce((s, [regex, to]) => s.replace(regex, to), s);

export const unixDay = (date: Date): number => date.getTime() / (24 * 60 * 60 * 1000);

export const UnixDay = (props: { children: string }) => <>ud{unixDay(new Date(props.children))}</>;

export const speak = (text) => {
  const spoken = replaceEach(text, [
    [/(?<=[b-df-hj-np-tv-xz]) *(?=[aiyueo])/g, ""],
    [/(?<=[b-df-hj-np-tv-xz])(?= [b-df-hj-np-tv-xz]|$)/g, "ъ"],
    //[/(?<=[fhkpstx])ъ$/g, ''],

    [/a/g, "а"],
    [/b/g, "б"],
    [/c/g, "г"],
    [/d/g, "д"],
    [/e/g, "е"],
    [/f/g, "ф"],
    [/g/g, "нг"],
    [/h/g, "х"],
    [/i/g, "и"],
    [/j/g, "ь"],
    [/k/g, "к"],
    [/l/g, "л"],
    [/m/g, "м"],
    [/n/g, "н"],
    [/o/g, "о"],
    [/p/g, "п"],
    [/q/g, ""],
    [/r/g, "р"],
    [/s/g, "с"],
    [/t/g, "т"],
    [/u/g, "у"],
    [/v/g, "в"],
    [/w/g, "у"],
    [/x/g, "ш"],
    [/y/g, "ю"],
    [/z/g, "з"],
    [/ʒ/g, "ж"],

    [/ьа/, "я"],
    [/ьу/, "ю"],
    [/ьо/, "ё"],
  ]);

  const u = new SpeechSynthesisUtterance(spoken);
  u.lang = "bg";
  u.rate = 0.75;
  u.voice =
    speechSynthesis
      .getVoices()
      .filter(
        (it) =>
          it.lang.startsWith(u.lang) &&
          (it.voiceURI.startsWith("com.apple.voice") || it.name.includes("Google")),
      )[0] ?? speechSynthesis.getVoices().filter((it) => it.lang === u.lang)[0];
  window.speechSynthesis.speak(u);
};
