import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beacon',
  description:
    'Secure early access to the future of autonomous hackathon intelligence.',
  icons: {
    icon: '/logo-opaque.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}