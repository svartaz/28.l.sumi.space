export type DictionaryEntry = {
  token: string;
  jbo: string;
  date: string;
  klass: string;
  description: string;
};

export type Dictionary = Record<string, DictionaryEntry>;

export const parseDictionary = (source: string): Dictionary =>
  Object.fromEntries(
    source.split("\n").flatMap((line) => {
      if (!line) return [];

      const [token, jbo, key, date, klass, description] = line.split("\t");
      if (token === "token" && jbo === "jbo" && key === "en") return [];
      return [[key, { token, jbo, date, klass, description }]];
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
    .replace(/l/g, "ɕ")
    .replace(/h/g, "ɣ")
    .replace(/j/g, "ʑ")
    .replace(/r/g, "ɾ")
    .replace(/w/g, "ɨ")
    .replace(/q/g, "ø");
