import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';

import React from 'react';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { HeaderSimple } from '@/components/HeaderSimple/HeaderSimple';
import { theme } from '@/theme';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
  title: 'Ελληνικές Ομοσπονδίες',
  description: 'Πλατφόρμα για την ανάπτυξη και διαχείριση του Συντάγματος των Ελληνικών Ομοσπονδιών.',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <ModalsProvider>
            <Analytics/>
            <SpeedInsights/>
            <HeaderSimple />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
