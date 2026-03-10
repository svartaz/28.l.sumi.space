import "./layout.sass";
import { Zen_Maru_Gothic, Noto_Sans, Noto_Emoji } from "next/font/google";

const zenMaruGothic = Zen_Maru_Gothic({
  weight: ["300", "400", "500", "700"],
  variable: "--font-zen-maru-gothic",
});

const notoSans = Noto_Sans({
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans",
});

const notoEmoji = Noto_Emoji({
  weight: ["300", "400"],
  variable: "--font-noto-emoji",
});

export default ({ children }: { children: React.ReactNode }) => (
  <html
    lang="ja"
    className={[zenMaruGothic.variable, notoSans.variable, notoEmoji.variable].join(" ")}
  >
    <body>{children}</body>
  </html>
);
