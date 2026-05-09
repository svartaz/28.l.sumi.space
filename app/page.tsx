import PageClient from "./page-client";
import { dictionary } from "../lib/words.server";

export default function Page() {
  return <PageClient dictionary={dictionary} />;
}
