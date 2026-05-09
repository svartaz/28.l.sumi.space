import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { type Dictionary, parseDictionary } from "./words";

const parseSpecialEntries = (source: string): Dictionary =>
  Object.fromEntries(
    source.split("\n").flatMap((line) => {
      if (!line || line.startsWith("#")) return [];

      const [word, key, date, klass, explanation] = line.split("\t");
      if (word || !key || !explanation) return [];

      return [[key, { token: key, jbo: "", date, klass, explanation }]];
    }),
  );

export const dictionary = {
  ...parseSpecialEntries(
    readFileSync(join(process.cwd(), "vocabulary", "input", "gismu_to_definition.tsv"), "utf-8"),
  ),
  ...parseDictionary(readFileSync(join(process.cwd(), "vocabulary", "output", "defined.tsv"), "utf-8")),
};
