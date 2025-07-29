import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';

import React from 'react';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { HeaderSimple } from '../components/HeaderSimple/HeaderSimple';
import { theme } from '../theme';

export const metadata = {
  title: 'Σύνταγμα',
  description: 'Φτιάχνωντας το Σύνταγμα της Ελλάδος με την Άμεση Δημοκρατία!',
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
            <HeaderSimple />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
