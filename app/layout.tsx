import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SOLVEX Analytics',
  description: 'Plataforma de análisis de datos empresariales',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
        />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
