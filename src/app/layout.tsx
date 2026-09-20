import type { Metadata } from 'next';
import Script from 'next/script';
import { Providers } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'LearnLive',
  description: 'Live coaching classes with automatic attendance.',
};

/**
 * Sets `data-theme` on `<html>` before React hydrates or the page paints.
 * Without this, the page would render light-by-default first and flip to
 * the saved theme a moment later — a visible flash on every load. Falls
 * back to the OS preference only when the user has never chosen explicitly.
 *
 * `suppressHydrationWarning` on `<html>` matters here: this script mutates
 * an attribute React doesn't itself render, and without it React would log
 * a (harmless, but noisy) hydration mismatch warning on every page load.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('ll-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
