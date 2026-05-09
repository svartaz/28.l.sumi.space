export type DictionaryEntry = {
  token: string;
  jbo: string;
  date: string;
  klass: string;
  explanation: string;
};

export type Dictionary = Record<string, DictionaryEntry>;

export const parseDictionary = (source: string): Dictionary =>
  Object.fromEntries(
    source.split("\n").flatMap((line) => {
      if (!line) return [];

      const [token, jbo, key, date, klass, explanation] = line.split("\t");
      return [[key, { token, jbo, date, klass, explanation }]];
    }),
  );

export const translate = (text: string, dictionary: Dictionary) =>
  Object.entries(dictionary).reduce(
    (acc, [key, { token }]) => acc.replace(new RegExp(`\\b${key}\\b`, "g"), token),
    text,
  );

export const toIpa = (text: string) =>
  text
    .replace(/g/g, "ŋ")
    .replace(/c/g, "g")
    .replace(/š/g, "ɕ")
    .replace(/h/g, "ɣ")
    .replace(/ž/g, "ʑ")
    .replace(/y/g, "ɨ");
