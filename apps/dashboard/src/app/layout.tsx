import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoOps Dashboard',
  description: 'Operational visibility for the AutoOps platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
