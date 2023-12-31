import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { language } from '@/lib/dictionary';
import { usePathname } from 'next/navigation'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  return <>
    <Head>
      <link rel="icon" href={isDark ? "/favicon-white.svg" : "/favicon.svg"}></link>
    </Head>

    <header>
      <h1>{language} <img src='/favicon.svg' style={{ margin: 'auto', height: '.8em' }} /></h1>
      <a href='https://sumi.space'>sumi</a>

      <div>{
        [
          ['槪觀', '/'],
          ['音韻', '/phonology'],
          ['形式', '/syntaks'],
          ['意味', '/semantiks'],
          ['辭彙', '/leksikon'],
          ['變換', '/konvert'],
          ['用例', '/sample'],
          ['開發', '/tool'],
        ].map(([name, path]) =>
          <Link className={name == '開發' ? 'faint' : ''} data-opened={pathname == path} href={path}>{name}</Link>
        )
      }</div>
    </header>

    <main>
      {children}
    </main>
  </>
};

export default Layout;