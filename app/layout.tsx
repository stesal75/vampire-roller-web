import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vampire Roller',
  description: 'Calcola il pool di dadi per Vampire: the Masquerade',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
