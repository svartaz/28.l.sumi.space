import { Klass } from "./words";

export const consonants = "gnmcdbktphxsfjzvrl";
export const vowels = "iueoa";
export const letters = consonants + vowels;

export const wordToIpa = (word: string): string =>
  word
    .toUpperCase()
    .replace(/G/g, "ŋ")
    .replace(/C/g, "g")
    .replace(/X/g, "ʃ")
    .replace(/J/g, "ʒ")
    .toLowerCase();

export const phraseToIpa = (phraseToIpa: string): string =>
  phraseToIpa.replace(new RegExp(`[${letters}]+`, "g"), (word) => wordToIpa(word));

const checkSonority = (word: string): boolean => {
  const clusterGin = /^[hxsfjzv]?[cdbktp]?[hxsfjzv]?[gnm]?[rl]?[jv]?$/;
  const clusterEnd = /^[rl]?[gnm]?[hxsfjzv]?[cdbktp]?[hxsfjzv]?$/;
  const clusterMid =
    /^[hxsfjzv]?[cdbktp]?[hxsfjzv]?[gnm]?[rl]?[gnm]?[hxsfjzv]?[cdbktp]?[hxsfjzv]?$/;

  return word
    .split(/[iueoa]/g)
    .every((cluster, i, self) =>
      i === 0
        ? clusterGin.test(cluster)
        : i === self.length - 1
          ? clusterEnd.test(cluster)
          : clusterMid.test(cluster),
    );
};

const state = {
  g: "ckiueoa",
  n: "dtliueoa",
  m: "bpiueoa",
  c: "rliueoa",
  d: "iueoa",
  b: "rliueoa",
  k: "nmtpxsfrliueoa",
  t: "gmkpxsfiueoa",
  p: "gnktxsfrliueoa",
  h: "iueoa",
  x: "gnmktpfliueoa",
  s: "gnmktpfliueoa",
  f: "gnmktpxsrliueoa",
  j: "iueoa",
  z: "iueoa",
  v: "iueoa",
  r: "gnmktpfiueoa",
  l: "gnmktpfiueoa",
  a: "gnmcdbktphxsfjzvrl",
  i: "gnmcdbktphxsfjzvrl",
  y: "gnmcdbktphxsfjzvrl",
  u: "gnmcdbktphxsfjzvrl",
  e: "gnmcdbktphxsfjzvrl",
  o: "gnmcdbktphxsfjzvrl",
};

export const wordIsInvalid = (word: string, klass?: Klass): string | undefined => {
  if (word === "") return "empty";
  for (const [name, pattern] of [
    ["empty", /^$/],
    ["repeat", /(.)\1/],
    ["non-alphabet", /[^gnmcdbktphxsfjzvrliueoa]/],
    ["0 vowel", /^[^iueoa]+$/],
    ["2 vowels", /[eao]{2,}/],
    ["3 vowels", /[iueoa]{3,}/],
    ["4 consonants", /[gnmcdbktphxsfjzvrl]{4,}/],

    ["beginner vowel", /^[ieaou]/],
    ["g", /g[gnmdbtphxsfzrl]/],
    ["n", /n[gnmcbkpr]/],
    ["m", /m[gnmcdkthxsfzvrl]/],
    ["c", /c([gnmcdbktphxsfz])/],
    ["d", /d([gnmcdbktphxsfl])/],
    ["b", /b([gnmcdbktphxsfzv])/],
    ["k", /k[gcdbkhz]/],
    ["t", /t[ncdbthzl]/],
    ["p", /p[mcdbphzv]/],
    ["h", /h[gnmcdbktphxsfzrl]/],
    ["x", /x[cdbhxsjzr]/],
    ["s", /s[cdbhxszr]/],
    ["f", /f[cdbhfzv]/],
    ["j", /j([gnmcdbktphxsfjzrl])/],
    ["z", /z([gnmcdbktphxsfjzvrl])/],
    ["v", /v([gnmcdbktphxsfzvrl])/],
    ["r", /r[hxsrl]/],
    ["l", /l[hxszrl]/],
  ] as [string, RegExp][])
    if (pattern.test(word)) return name;

  if (!checkSonority(word)) return "sonority";

  if (klass === Klass.Verb && /[aiuyeo]$/.test(word)) return "verb ending in vowel";

  return undefined;
};

export const phraseIsInvalid = (phrase: string): string | undefined =>
  phrase
    .split(/\s+/g)
    .map((word) => wordIsInvalid(word))
    .find((reason) => reason !== undefined);
