'use client';

import Script from 'next/script';
import dic, { acronymToWord, Formation, translate, Value } from '../lib/words';
import { glidise, letters, toIpa } from '../lib/write';
import { dateToObject } from '../submodules/shared/date';
import Head from 'next/head';
import { replaceEach } from '../submodules/shared/string';

const name = dic.get('_self').token;

const speak = (text) => {
  const spoken = replaceEach(glidise(text), [
    [/(?<=[b-df-hj-np-tv-xz]) *(?=[aiueo])/g, ''],
    [/(?<=[b-df-hj-np-tv-xz])(?= [b-df-hj-np-tv-xz]|$)/g, 'ъ'],
    //[/(?<=[fhkpstx])ъ$/g, ''],

    [/a/g, 'а'],
    [/b/g, 'б'],
    [/c/g, 'г'],
    [/d/g, 'д'],
    [/e/g, 'е'],
    [/f/g, 'ф'],
    [/g/g, 'нг'],
    [/h/g, 'х'],
    [/i/g, 'и'],
    [/j/g, 'ь'],
    [/k/g, 'к'],
    [/l/g, 'л'],
    [/m/g, 'м'],
    [/n/g, 'н'],
    [/o/g, 'о'],
    [/p/g, 'п'],
    [/q/g, ''],
    [/r/g, 'р'],
    [/s/g, 'с'],
    [/t/g, 'т'],
    [/u/g, 'у'],
    [/v/g, 'в'],
    [/w/g, 'у'],
    [/x/g, 'ш'],
    [/y/g, ''],
    [/z/g, 'з'],
    [/ʒ/g, 'ж'],

    [/ьа/, 'я'],
    [/ьу/, 'ю'],
    [/ьо/, 'ё'],
  ]);
  console.log(spoken);

  const u = new SpeechSynthesisUtterance(spoken);
  u.lang = 'bg';
  u.rate = 0.75;
  u.voice =
    speechSynthesis
      .getVoices()
      .filter(
        (it) =>
          it.lang.startsWith(u.lang) &&
          (it.voiceURI.startsWith('com.apple.voice') ||
            it.name.includes('Google'))
      )[0] ?? speechSynthesis.getVoices().filter((it) => it.lang === u.lang)[0];
  window.speechSynthesis.speak(u);
};

const Button = (props: { children: string }) => (
  <button onClick={() => speak(props.children)}>🗣</button>
);

const Translate = (props: { children: string }) => {
  return (
    <span className="target">
      {props.children
        .split(/(?<![$_a-z*#])(?=[$_a-z])|(?<=[$_a-z*#]?)(?![$_a-z])/g)
        .map((it, key) => {
          return dic.has(it) ? (
            <span key={key} data-token={dic.get(it).token}>
              <ruby>
                {dic.get(it).token}
                <rt>{it}</rt>
              </ruby>
              {entry(it)}
            </span>
          ) : it.startsWith('$') ? (
            <span key={key} style={{ fontStyle: 'italic' }}>
              {it.substring(1)}
            </span>
          ) : (
            <span key={key} style={{ color: 'lightgray' }}>
              {it}
            </span>
          );
        })}
    </span>
  );
};

const highlight = (meant: string) =>
  meant.split(/(?=@[nad])|(?<=@[nad])/g).map((it, key) =>
    /^@[nad]$/.test(it) ? (
      <span key={key} className="term">
        {it.substring(1)}
      </span>
    ) : (
      it
    )
  );

const samples = (entries: (string | [string, string])[]) => (
  <table className="samples">
    <tbody>
      {entries.map((it, key) => {
        if (typeof it === 'string') {
          const { token, klass, formation, ja, en } = dic.get(it);
          return (
            <tr key={key}>
              <td>
                <Button>{token}</Button>
              </td>
              <td>
                {klass
                  .replace(/^/, formation === Formation.Complex ? '複合' : '')
                  .replace(/詞$/, formation === Formation.Idiom ? '句' : '詞')}
              </td>
              <td className="target">{token}</td>
              <td className="ipa">{toIpa(token)}</td>
              <td>{highlight(ja ?? en)}</td>
            </tr>
          );
        } else
          return (
            <tr>
              <td>
                <Button>{translate(it[0])}</Button>
              </td>{' '}
              <td>文</td>
              <td colSpan={2}>
                <Translate>{it[0]}</Translate>
              </td>
              <td>{it[1]}</td>
            </tr>
          );
      })}
    </tbody>
  </table>
);

const entry = (key) => {
  const { token, klass, formation, ja, en } = dic.get(key);
  return (
    <span className="entry">
      <button onClick={() => speak(token)}>{token}</button>{' '}
      {toIpa(token) === token ? (
        ''
      ) : (
        <>
          {' '}
          <span className="ipa">{toIpa(token)}</span>
        </>
      )}
      :{' '}
      {klass
        .replace(/^/, formation === Formation.Complex ? '複合' : '')
        .replace(/詞$/, formation === Formation.Idiom ? '句' : '詞')}
      <br />
      {highlight(ja ?? en ?? '')}
    </span>
  );
};

export default () => (
  <>
    <Head>
      <title>sumi-lang-2024 (草案)</title>
    </Head>

    <Script
      async={true}
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4331089007895019"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    ></Script>
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
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
          <th>{dateToObject(new Date('2025-07-31')).text}</th>
          <td>公開</td>
        </tr>
      </tbody>
    </table>

    <p>本稿は定義よりは入門として機能する.</p>

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
        s-v-o言語.
        <br />
        jbo語が統語に, gem語が能記に影響した.
      </p>
    </section>

    <section>
      <h2>字と音</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>聲門</th>
            <th>軟齶</th>
            <th>硬齶</th>
            <th>舌</th>
            <th>脣</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>鼻</th>
            <td></td>
            <td>
              g <span className="ipa">ŋ</span>
            </td>
            <td></td>
            <td>n</td>
            <td>m</td>
          </tr>
          <tr>
            <th>有聲破裂</th>
            <td></td>
            <td>
              c <span className="ipa">g</span>
            </td>
            <td></td>
            <td>d</td>
            <td>b</td>
          </tr>
          <tr>
            <th>無聲破裂</th>
            <td>
              q <span className="ipa">ʔ</span>
            </td>
            <td>k</td>
            <td></td>
            <td>t</td>
            <td>p</td>
          </tr>
          <tr>
            <th>無聲摩擦</th>
            <td></td>
            <td>
              h <span className="ipa">h,x</span>
            </td>
            <td>
              x <span className="ipa">ɕ,ʂ,ʃ</span>
            </td>
            <td>s</td>
            <td>
              f <span className="ipa">f,φ</span>
            </td>
          </tr>
          <tr>
            <th>有聲摩擦</th>
            <td></td>
            <td></td>
            <td rowSpan={2}>
              j <span className="ipa">ʑ,ʐ,ʒ,j</span>
            </td>
            <td>z</td>
            <td rowSpan={2}>
              v <span className="ipa">v,β,ʋ,w</span>
            </td>
          </tr>
          <tr>
            <th>接近</th>
            <td></td>
            <td></td>
            <td>
              r <span className="ipa">ɾ</span>
              <br />l
            </td>
          </tr>
          <tr>
            <th>非中母</th>
            <td></td>
            <td>a</td>
            <td>i</td>
            <td>y</td>
            <td>u</td>
          </tr>
          <tr>
            <th>中母</th>
            <td></td>
            <td>
              <span className="ipa">ǝ</span>
            </td>
            <td>e</td>
            <td></td>
            <td>o</td>
          </tr>
        </tbody>
      </table>

      {/*<p>‹j›, ‹v› は詞頭と母音間で摩擦音, それ以外で接近音を指す.</p>*/}

      <p>
        <span className="ipa">ǝ</span>を指す字は無い.
        <br />
        詞末子音に陰に後置する.
      </p>
    </section>

    <section>
      <h2>字の名</h2>
      <div className="letters">
        {'aäbcgdeǝfzhijklmnoöpqrstuvywx'.split('').map((l, key) => (
          <div key={key}>
            {letters.includes(l)
              ? `‹${l}›`
              : l
                  .replace(/ä/, 'ä æ')
                  .replace(/g/, 'g ŋ')
                  .replace(/ö/, 'ö œ ø')
                  .replace(/y/, 'y ü')
                  .replace(/[^ ]/g, (it) => `‹${it}›`)
                  .replace(/.+/, (it) => '(' + it + ')')}
            <span className="target">{acronymToWord(l.toUpperCase())}</span>
          </div>
        ))}
      </div>
      <p>丸括弧の中の字は使はれないが互換性の為に有る.</p>
    </section>

    <section>
      <h2>動詞と格</h2>
      <p>
        主に<dfn>動詞 (verb)</dfn> が文を構成する.
        <br />
        動詞は事物の關係を指す.
      </p>
      <p>
        jpn語文 ‹猫が星を見る› では主要な關係 ‹…が…を見る› が事物 猫と星を結ぶ.
      </p>
      <p>
        ‹猫が星を見る› と ‹星が猫を見る› が指す物は違ふ.
        <br />
        關係の中の空欄は固有の機能を持ち, 一般には交換しない.
        <br />
        空欄の, 他の空欄と區別される機能を<dfn>格 (case)</dfn> と呼ぶ.
      </p>

      {samples(['cat', 'see', 'give'])}
    </section>

    <section>
      <h2>最も單純な文</h2>
      <p>一個の動詞は文を構成する.</p>
      {samples([
        ['cat', '(何かが) 猫'],
        ['see', '(何かが) (何かを) 見る'],
      ])}
      <p>空欄には適當な事物 (何か) が入るとして解釋する.</p>

      <pre>
        {`
see┬n─(something)
   └a─(something)`.trim()}
      </pre>
    </section>

    <section>
      <h2>法と時制と時相</h2>
      <p>
        <dfn>助動詞 (preverb)</dfn> が法と時制と時相を指す.
      </p>
      <p>
        現實を指す<dfn>叙實法 (realis)</dfn> と非現實 (假定, 命令, 想像,
        婉曲など) を指す<dfn>叙想法 (irrealis)</dfn> が有る.
      </p>
      <p>
        時間に依らず成立する傾向を指す不變時制と, 時間に依る過去時制, 現在時制,
        未來時制が有る.
        <br />
        不變時制と それ以外は自然言語の名詞と動詞に それぞれ似る.
      </p>

      <p>動詞は陰に叙實法 不變時制 進行相を指す.</p>

      {samples([
        'did',
        'do',
        'will',

        'if_be',
        'if_did',
        'if_do',
        'if_will',

        ['see', '見る物 (gazer) だ'],
        ['do see', '見てゐる'],
        ['if_did see', '見たなら…'],

        'begin',
        'keep',
        'end',
        'rest',
        'pause#',
        'resume#',
        'live',

        ['live', '生物'],
        ['did begin live', '生き始めた\n→生まれた'],
        ['will end live', '生き終はらう\n→死なう'],
      ])}
    </section>

    <section>
      <h2>同格</h2>
      <p>
        隣接する動詞は主格を共有して兩立する.
        <br />
        これを<dfn>同格 (apposition)</dfn> と呼ぶ.
      </p>

      <p>同格は主格 ‹何かが› を具體化する.</p>
      {samples([['cat&(do see)', '何かが猫であり, 見てゐる\n→猫が見てゐる']])}

      <p>同格は形容する.</p>
      {samples([
        'black',
        [
          'cat&black&(do see)',
          '何かが猫であり, 黑く, 見てゐる\n→黑猫が見てゐる',
        ],
      ])}

      <pre>
        {`
  cat──n┐
black──n┤
  see─┬n┘
      └a─`.substring(1)}
      </pre>
    </section>

    <section>
      <h2>前置詞</h2>
      <p>
        格に對應する<dfn>前置詞 (preposition)</dfn>が有る.
      </p>
      {samples(['by', 'him', 'to', 'at', 'because', 'with', 'ly'])}

      <p>
        二個の動詞の主格が等しい事を同格が指す樣に,
        非主格と主格が等しい事を前置詞が指す.
        <br />
        これが ‹何かを›, ‹何かへ›, … を具體化する.
      </p>
      {samples([
        'i',
        'water',
        'give',
        ['i&(do give him=water)', '我が水を與へてゐる'],
        ['i&(do give him=water to=cat)', '我が猫へ水を與へてゐる'],
      ])}

      <p>前置詞は同格を一個の動詞として扱ふ.</p>
      {samples([
        ['did give to=cat', '猫へ與へてゐた'],
        ['did give to=(cat&black)', '黑い猫へ與へてゐた'],
      ])}

      <pre>
        {`
give─┬n─n──i
     ├a─n──water
     └d┬n──cat
       └n──black`.substring(1)}
      </pre>
    </section>

    <section>
      <h2>受動態</h2>
      <p>
        <dfn>受動態 (passive)</dfn>{' '}
        は前置詞を用ゐて非主格を同格の對象に指定する.
      </p>
      {samples([
        'done',
        ['i&(did give him=water to=cat)', '我は水を猫へ與へてゐた'],
        ['water&(did done give by=i to=cat)', '水を我は猫へ與へてゐた'],
        ['cat&(did done to give by=i him=water)', '猫へ我は水を與へてゐた'],
      ])}
    </section>

    <section>
      <h2>作用域</h2>
      <p>ここまでの文法では, 空欄を埋めた動詞で別の動詞の空欄を埋め得ない.</p>
      {samples([
        'eat',
        ['i&(do see him=cat)', '我が猫を見てゐる'],
        ['cat&(do eat him=water)', '猫が水を飲んでゐる'],
        ['i&(do see him=(cat&(do eat)))', '我が, 飲む猫を見てゐる'],
        [
          '? i&(do see him=(cat&(do eat)) him=water)',
          '? 我が, 飲む猫を水を見てゐる',
        ],
        ['?', '我が, 水を飲む猫を見てゐる'],
      ])}
      <p>
        この例で<Translate>water</Translate>は<Translate>eat</Translate>
        の對格を埋めたいが, 文の全體が<Translate>see</Translate>の
        <dfn>作用域 (scope)</dfn> なる故に叶はない.
        <br />
        <Translate>eat</Translate>の作用域を開き回避する.
      </p>
      {samples([
        'which',
        '_close',
        [
          'i&(do see him=(cat&(do eat which him=water)))',
          '我が, 水を飲む猫を見てゐる',
        ],
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
        己格の受動態を用ゐては文 ‹…である› から動詞 ‹
        {highlight('@nは…である事である')}› を作り得る.
      </p>
      {samples([
        'know',
        ['cat&(do see him=sun)', '猫が星を見てゐる'],
        ['do see by=cat him=sun', '(同)'],
        [
          'i&(do know him=(done ly do see which by=cat him=sun))',
          '猫が星を見てゐる事を我は知ってゐる',
        ],
      ])}
    </section>

    <section>
      <h2>逐次と同期</h2>
      <p>
        二個の動詞が指す事象の始點が前後する事を<dfn>逐次 (consecution)</dfn>{' '}
        が指す
      </p>
      {samples([
        'sequentially',
        'go',
        ['(did go)&(sequentially eat)', '往ってから食った\n→食ひに往った'],
      ])}

      <p>
        二個の動詞が指す事象が時間に共有點を持つ事を
        <dfn>同期 (synchronisation)</dfn> が指す.
      </p>
      {samples([
        'concurrently',
        '_comma',
        [
          'he&(concurrently did end go) _comma i&(concurrently least wake)',
          '彼が來た時, 我は寢てゐた',
        ],
      ])}
    </section>

    <section>
      <h2>程度</h2>
      <p>
        動詞に前置する數詞は動詞が指す關係の<dfn>程度 (degree)</dfn> を指す.
      </p>
      <p>動詞は程度を陰に豫め持ち, 數詞は それを上書く.</p>

      {samples([
        'least',
        'little',
        'much',
        ['live', '生きてゐる度が初期値\n→生きてゐる'],
        ['least live', '生きてゐる度が最低\n→生きてゐない (死んでゐる)'],
        ['little live', '生きてゐる度が低い\n→死にかけてゐる'],
      ])}
    </section>

    <section>
      <h2>基數</h2>
      <p>
        數詞を用ゐ, 關係を滿たす事物の<dfn>基數 (cardinality)</dfn> を指す.
      </p>

      {samples([
        'of',
        'zero',
        'one',
        ['(zero of)&cat', '零個の猫'],
        ['(one of)&cat', '一個の猫'],
        ['(much of)&cat', '多い猫'],
        ['did see him=(much of)&cat', '多い猫を見た'],
      ])}
    </section>

    <section>
      <h2>名</h2>
      <p>
        言語外の字列を<dfn>借用 (loan)</dfn>して動詞化する.
      </p>

      {samples([
        '_loan',
        [
          'person _loan $sumi do make him done speak _loan _self',
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
      style={{ display: 'block' }}
      data-ad-client="ca-pub-4331089007895019"
      data-ad-slot="2969805857"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
    <Script>{`(adsbygoogle = window.adsbygoogle || []).push({});`}</Script>

    <section>
      <h2>詞彙 ({dic.size})</h2>
      <div className="words">{[...dic.keys()].map((key) => entry(key))}</div>
    </section>

    <section>
      <h2>造詞</h2>

      {(() => {
        const dateToKeys = {};
        for (const k of dic.keys()) {
          const { date } = dic.get(k);
          if (date in dateToKeys) dateToKeys[date].push(k);
          else dateToKeys[date] = [k];
        }

        let sum = 0;
        for (const date in dateToKeys) {
          dateToKeys[date] = dateToKeys[date].filter(
            (k, i, self) =>
              (!k.endsWith('*') || !self.includes(k.replace(/\*$/, ''))) &&
              (!k.endsWith('#') || !self.includes(k.replace(/\#$/, '')))
          );
          sum += dateToKeys[date].length;
        }

        const date0 = Object.keys(dateToKeys).reduce(
          (acc, current) => (current < acc ? current : acc),
          '9999-99-99'
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
                      <th style={{ textWrap: 'nowrap' }}>
                        {dateToObject(new Date(date)).text}
                      </th>
                      <td>
                        {(new Date(date).getTime() -
                          new Date(date0).getTime()) /
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
                        {dateToKeys[date]
                          .map((key) => dic.get(key).token)
                          .join(' ')}
                      </td>
                      <td style={{ textWrap: 'nowrap' }}>
                        +{dateToKeys[date].length}
                      </td>
                      <td style={{ textWrap: 'nowrap' }}>{acc}</td>
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
