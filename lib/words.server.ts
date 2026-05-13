import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseDictionary } from "./words";

export const dictionary = parseDictionary(
  readFileSync(join(process.cwd(), "vocabulary", "output", "defined.tsv"), "utf-8"),
);
