"use client";

import Head from "next/head";
import Script from "next/script";
import { replaceEach, speak, UnixDay } from "../lib/common";
import { type Dictionary, toIpa, translate } from "../lib/words";

const Ipa = (props: { children: string }) => <span className="ipa">{props.children}</span>;

const ButtonSpeak = (props: { text: string; children?: string }) => (
  <button onClick={() => speak(props.text)}>{props.children ?? props.text}</button>
);

const TokenIpa = ({ token }: { token: string }) => {
  const ipa = toIpa(token);
  return ipa === token ? null : (
    <>
      {" "}
      <Ipa>{ipa}</Ipa>
    </>
  );
};

const Highlight = ({ children }: { children: string }) => (
  <>
    {(children ?? "").split(/(@[nad])/g).map((it, key) =>
      /^@[nad]$/.test(it) ? (
        <span key={key} className="term">
          {replaceEach(it.substring(1), [
            ["n", "主"],
            ["a", "對"],
            ["d", "與"],
          ])}
        </span>
      ) : (
        it
      ),
    )}
  </>
);

const Entry = ({ dictionary, entryKey }: { dictionary: Dictionary; entryKey: string }) => {
  const { token, klass, explanation } = dictionary[entryKey];
  return (
    <span className="entry">
      <ButtonSpeak text={token} />
      <TokenIpa token={token} />: {klass}.
      <br />
      <Highlight>{explanation}</Highlight>
    </span>
  );
};

const Translate = ({ dictionary, children }: { dictionary: Dictionary; children: string }) => (
  <span className="target">
    {children.split(/(\$?[_a-z]+[*#]?)/g).map((it, key) => {
      if (it.startsWith("$"))
        return (
          <span key={key} style={{ fontStyle: "italic" }}>
            {it.substring(1)}
          </span>
        );

      if (it in dictionary)
        return (
          <span key={key} data-token={dictionary[it].token}>
            <ruby>
              {dictionary[it].token}
              <rt>{it}</rt>
            </ruby>
            <Entry dictionary={dictionary} entryKey={it} />
          </span>
        );

      return (
        <span key={key} style={{ color: "lightgray" }}>
          {it}
        </span>
      );
    })}
  </span>
);

const samples = (dictionary: Dictionary, entries: (string | [string, string])[]) => (
  <table className="samples">
    <tbody>
      {entries.map((it, key) => {
        if (typeof it === "string") {
          if (it in dictionary) {
            const { token, klass, explanation } = dictionary[it];
            const ipa = toIpa(token);
            return (
              <tr key={key}>
                <td>
                  <ButtonSpeak text={token}>🗣</ButtonSpeak>
                </td>
                <td>{klass}</td>
                <td className="target">{token}</td>
                <td className="ipa">{ipa}</td>
                <td>
                  <Highlight>{explanation}</Highlight>
                </td>
              </tr>
            );
          } else {
            return (
              <tr key={key}>
                <td></td>
                <td></td>
                <td style={{ color: "red" }}>{it}</td>
                <td></td>
                <td></td>
              </tr>
            );
          }
        } else
          return (
            <tr key={key}>
              <td>
                <ButtonSpeak text={translate(it[0], dictionary)}>🗣</ButtonSpeak>
              </td>
              <td>文</td>
              <td colSpan={2}>
                <Translate dictionary={dictionary}>{it[0]}</Translate>
              </td>
              <td>{it[1]}</td>
            </tr>
          );
      })}
    </tbody>
  </table>
);

export default function PageClient({ dictionary }: { dictionary: Dictionary }) {
  const name = "aaaa"; // dictionary._self.token;

  return (
    <>
      <Head>
        <title>sumi-lang-2024 (草案)</title>
        <meta name="author" content="sumi.space" />
        <meta name="description" content="sumi.spaceが作成する人間用の同人言語" />
      </Head>

      <Script
        async={true}
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4331089007895019"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      ></Script>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4331089007895019"
        data-ad-slot="9223173269"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      <Script strategy="afterInteractive">{`(adsbygoogle = window.adsbygoogle || []).push({});`}</Script>

      <h1>sumi-lang-2024 (草案)</h1>

      <table>
        <tbody>
          <tr>
            <th>2024_???</th>
            <td>作成 開始</td>
          </tr>
          <tr>
            <th>
              <UnixDay>2025-07-31</UnixDay>
            </th>
            <td>公開</td>
          </tr>
        </tbody>
      </table>

      <p>本稿は定義より入門として機能する.</p>

      <section>
        <h2>概要</h2>
        <p>
          {name} (假稱) は
          <a href="https://sumi.space" rel="author">
            sumi.space
          </a>
          が作成する人間言語.
          <br />
          孤立語.
          <br />
          主-述-客言語.
          <br />
          文法はjbo語を參照した. gem諸語から能記を借用した.
        </p>
      </section>

      <section>
        <h2>字と音</h2>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>軟齶</th>
              <th>硬齶</th>
              <th>舌</th>
              <th>脣</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>鼻</th>
              <td>
                g <Ipa>ŋ</Ipa>
              </td>
              <td></td>
              <td>n</td>
              <td>m</td>
            </tr>
            <tr>
              <th>有聲破裂</th>
              <td>
                c <Ipa>g</Ipa>
              </td>
              <td></td>
              <td>d</td>
              <td>b</td>
            </tr>
            <tr>
              <th>無聲破裂</th>
              <td>k</td>
              <td></td>
              <td>t</td>
              <td>p</td>
            </tr>
            <tr>
              <th>無聲摩擦</th>
              <td>x</td>
              <td>
                š <Ipa>ɕ,ʂ,ʃ</Ipa>
              </td>
              <td>s</td>
              <td>f</td>
            </tr>
            <tr>
              <th>有聲摩擦</th>
              <td></td>
              <td>
                ž <Ipa>ʑ,ʐ,ʒ</Ipa>
              </td>
              <td>z</td>
              <td>v</td>
            </tr>
            <tr>
              <th>接近</th>
              <td></td>
              <td>j</td>
              <td>
                r <Ipa>ɾ,l</Ipa>
              </td>
              <td>w</td>
            </tr>
            <tr>
              <th>狹母</th>
              <td>
                y <span className="ipa">ɨ</span>
              </td>
              <td>i</td>
              <td></td>
              <td>u</td>
            </tr>
            <tr>
              <th>廣母</th>
              <td>
                a <span className="ipa">ǝ,a</span>
              </td>
              <td>e</td>
              <td></td>
              <td>o</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>動詞</h2>
        <p>
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              動詞<rt>verb</rt>
            </ruby>
          </dfn>
          の意味は空欄を持つ.
          <br />
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              格<rt>case</rt>
            </ruby>
          </dfn>
          は空欄の區別なる.
        </p>

        <p>
          一個の動詞は述部を構成し, 一個の述部は文を構成する.
          <br />
          この時に, 動詞の空欄に適當な項が入ると解釋する.
        </p>
        {samples(dictionary, [
          "cat",
          "see",
          ["cat", "(何かが) 猫"],
          ["see", "(何かが) (何かを) 見る"],
        ])}
        <pre>
          {`
see┬n─(something)
   └a─(something)`.trim()}
        </pre>
      </section>

      <section>
        <h2>法と時制と時相</h2>
        <p>
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              助動詞<rt>preverb</rt>
            </ruby>
          </dfn>
          が法と時制と時相を指す.
        </p>
        <p>
          現實を指す
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              叙實法<rt>realis</rt>
            </ruby>
          </dfn>
          と非現實 (假定, 命令, 想像, 婉曲など) を指す
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              叙想法<rt>irrealis</rt>
            </ruby>
          </dfn>
          が有る.
        </p>
        <p>
          時間に依らず成立する傾向を指す習慣時制と, 時間に依る過去時制, 現在時制, 未來時制が有る.
          <br />
          習慣時制と それ以外は自然言語の名詞と動詞に それぞれ似る.
        </p>
        <p>動詞は陰に叙實法 習慣時制 進行相を指す.</p>

        {samples(dictionary, [
          "did",
          "do",
          "will",

          "if_be",
          "if_did",
          "if_do",
          "if_will",

          ["see", "見る物 (gazer) だ"],
          ["do see", "見てゐる"],
          ["if_did see", "見たなら…"],

          "yet",
          "begin",
          "keep",
          "end",
          "already",
          "rest",
          "pause#",
          "resume#",
          "live",

          ["live", "生物"],
          ["did begin live", "生き始めた\n→生まれた"],
          ["will end live", "生き終はらう\n→死なう"],
        ])}
      </section>

      <section>
        <h2>同格</h2>
        <p>
          隣接する動詞は主格を共有して兩立する.
          <br />
          これを
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              同格<rt>apposition</rt>
            </ruby>
          </dfn>{" "}
          と呼ぶ.
        </p>

        <p>同格は主格 ‹何かが› を具體化する.</p>
        {samples(dictionary, [["cat&(do see)", "何かが猫であり, 見てゐる\n→猫が見てゐる"]])}

        <p>同格は形容する.</p>
        {samples(dictionary, [
          "black",
          ["cat&black&(do see)", "何かが猫であり, 黑く, 見てゐる\n→黑猫が見てゐる"],
        ])}

        <pre>
          {`
  cat─n┐
black─n┤
  see┬n┘
     └a─`.substring(1)}
        </pre>
      </section>

      <section>
        <h2>前置詞</h2>
        <p>
          格に對應する
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              前置詞<rt>preposition</rt>
            </ruby>
          </dfn>
          が有る.
        </p>
        {samples(dictionary, ["by", "him", "to", "at", "because", "with", "ly"])}

        <p>
          二個の動詞の主格が等しい事を同格が指す樣に, 非主格と主格が等しい事を前置詞が指す.
          <br />
          これが ‹何かを›, ‹何かへ›, … を具體化する.
        </p>
        {samples(dictionary, [
          "i",
          "water",
          "give",
          ["i&(do give him=water)", "我が水を與へてゐる"],
          ["i&(do give him=water to=cat)", "我が猫へ水を與へてゐる"],
        ])}

        <p>前置詞は同格を一個の動詞として扱ふ.</p>
        {samples(dictionary, [
          ["did give to=cat", "猫へ與へてゐた"],
          ["did give to=(cat&black)", "黑い猫へ與へてゐた"],
        ])}

        <pre>
          {`
give┬n─n─i
    ├a─n─water
    └d┬n─cat
      └n─black`.substring(1)}
        </pre>
      </section>

      <section>
        <h2>受動態</h2>
        <p>
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              受動態<rt>passive</rt>
            </ruby>
          </dfn>
          は前置詞を用ゐて非主格を同格の對象に指定する.
        </p>
        {samples(dictionary, [
          "done",
          ["i&(did give him=water to=cat)", "我は水を猫へ與へてゐた"],
          ["water&(did done give by=i to=cat)", "水を我は猫へ與へてゐた"],
          ["cat&(did done to give by=i him=water)", "猫へ我は水を與へてゐた"],
        ])}
      </section>

      <section>
        <h2>作用域</h2>
        <p>ここまでの文法では, 空欄を埋めた動詞で別の動詞の空欄を埋め得ない.</p>
        {samples(dictionary, [
          "eat",
          ["i&(do see him=cat)", "我が猫を見てゐる"],
          ["cat&(do eat him=water)", "猫が水を飲んでゐる"],
          ["i&(do see him=(cat&(do eat)))", "我が, 飲む猫を見てゐる"],
          ["? i&(do see him=(cat&(do eat)) him=water)", "? 我が, 飲む猫を水を見てゐる"],
          ["?", "我が, 水を飲む猫を見てゐる"],
        ])}
        <p>
          この例で<Translate dictionary={dictionary}>water</Translate>は
          <Translate dictionary={dictionary}>eat</Translate>
          の對格を埋めたいが, 文の全體が<Translate dictionary={dictionary}>see</Translate>の
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              作用域<rt>scope</rt>
            </ruby>
          </dfn>{" "}
          なる故に叶はない.
          <br />
          <Translate dictionary={dictionary}>eat</Translate>の作用域を開き回避する.
        </p>
        {samples(dictionary, [
          "which",
          "_close",
          ["i&(do see him=(cat&(do eat which him=water)))", "我が, 水を飲む猫を見てゐる"],
        ])}

        <pre>
          {`
    i──n┐
  see─┬n┘
      ├a┬n──cat
      │ └n──eat
     !└a─n──water

    i──n┐
  see─┬n┘
      └a┬n──cat
        └n┬─eat
water──n-a┘`.substring(1)}
        </pre>
      </section>

      <section>
        <h2>複文</h2>
        <p>
          己格の受動態を用ゐては文 ‹…である› から動詞 ‹<Highlight>$nは…である事である</Highlight>›
          を作り得る.
        </p>
        {samples(dictionary, [
          "know",
          ["cat&(do see him=sun)", "猫が星を見てゐる"],
          ["do see by=cat him=sun", "(同)"],
          [
            "i&(do know him=(done ly do see which by=cat him=sun))",
            "猫が星を見てゐる事を我は知ってゐる",
          ],
        ])}
      </section>

      <section>
        <h2>逐次と同期</h2>
        <p>
          二個の動詞が指す事象の始點が前後する事を
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              逐次<rt>consecution</rt>
            </ruby>
          </dfn>
          が指す
        </p>
        {samples(dictionary, [
          "afterwards",
          "go",
          ["(did go)&(afterwards eat)", "往ってから食った\n→食ひに往った"],
        ])}

        <p>
          二個の動詞が指す事象が時間に共有點を持つ事を
          <dfn>
            <ruby style={{ rubyPosition: "under" }}>
              同期<rt>synchronisation</rt>
            </ruby>
          </dfn>
          が指す.
        </p>
        {samples(dictionary, [
          "while",
          "_comma",
          ["he&(while did end go) _comma i&(while least wake)", "彼が來た時, 我は寢てゐた"],
        ])}
      </section>

      <section>
        <h2>程度</h2>
        <p>
          動詞に前置する數詞は動詞が指す關係の<dfn>程度 (degree)</dfn> を指す.
        </p>
        <p>動詞は程度を陰に豫め持ち, 數詞は それを上書く.</p>

        {samples(dictionary, [
          "least",
          "little",
          "much",
          ["live", "生きてゐる度が初期値\n→生きてゐる"],
          ["least live", "生きてゐる度が最低\n→生きてゐない (死んでゐる)"],
          ["little live", "生きてゐる度が低い\n→死にかけてゐる"],
        ])}
      </section>

      <section>
        <h2>基數</h2>
        <p>
          數詞を用ゐ, 關係を滿たす事物の<dfn>基數 (cardinality)</dfn> を指す.
        </p>

        {samples(dictionary, [
          "of",
          "zero",
          "one",
          ["(zero of)&cat", "零個の猫"],
          ["(one of)&cat", "一個の猫"],
          ["(much of)&cat", "多い猫"],
          ["did see him=(much of)&cat", "多い猫を見た"],
        ])}
      </section>

      <section>
        <h2>名</h2>
        <p>
          言語外の字列を<dfn>借用 (loan)</dfn>して動詞化する.
        </p>

        {samples(dictionary, [
          "_loan",
          [
            "person _loan $sumi do make him done speak _loan _self",
            `人sumiは言語${name}を作ってゐる`,
          ],
        ])}
      </section>

      <Script
        async={true}
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4331089007895019"
        crossOrigin="anonymous"
      ></Script>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4331089007895019"
        data-ad-slot="2969805857"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      <Script>{`(adsbygoogle = window.adsbygoogle || []).push({});`}</Script>

      <section>
        <h2>詞彙 ({Object.entries(dictionary).length})</h2>
        <div className="words">
          {[...Object.keys(dictionary)].map((key, i) => (
            <Entry key={i} dictionary={dictionary} entryKey={key} />
          ))}
        </div>
      </section>

      <section>
        <h2>管理</h2>

        {(() => {
          const dateToKeys: Record<string, string[]> = {};
          for (const k in dictionary) {
            const { date } = dictionary[k];
            if (date in dateToKeys) dateToKeys[date].push(k);
            else dateToKeys[date] = [k];
          }

          let sum = 0;
          for (const date in dateToKeys) {
            dateToKeys[date] = dateToKeys[date].filter(
              (k, i, self) =>
                (!k.endsWith("*") || !self.includes(k.replace(/\*$/, ""))) &&
                (!k.endsWith("#") || !self.includes(k.replace(/\#$/, ""))),
            );
            sum += dateToKeys[date].length;
          }

          const date0 = Object.keys(dateToKeys).reduce(
            (acc, current) => (current < acc ? current : acc),
            "9999-99-99",
          );

          let acc = 0;
          return (
            <table className="progress">
              <tbody>
                {Object.keys(dateToKeys)
                  .sort()
                  .map((date) => {
                    acc += dateToKeys[date].length;
                    const percent = (acc / sum) * 100;
                    return (
                      <tr key={date}>
                        <th style={{ textWrap: "nowrap" }}>
                          {new Date(date).getTime() / 1000 / 60 / 60 / 24}
                        </th>
                        <td>
                          {(new Date(date).getTime() - new Date(date0).getTime()) /
                            1000 /
                            60 /
                            60 /
                            24}
                        </td>
                        <td
                          style={{
                            background: `linear-gradient(to right, gainsboro 0%, gainsboro ${percent}%, transparent ${percent}%, transparent 100%)`,
                          }}
                        >
                          {dateToKeys[date].map((key) => dictionary[key].token).join(" ")}
                        </td>
                        <td style={{ textWrap: "nowrap" }}>+{dateToKeys[date].length}</td>
                        <td style={{ textWrap: "nowrap" }}>{acc}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          );
        })()}
      </section>
    </>
  );
}
