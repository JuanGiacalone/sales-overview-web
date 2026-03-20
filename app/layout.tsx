import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Sales Dashboard',
  description: 'Interactive sales data visualization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} antialiased`}>
      <body className="bg-stone-50 text-stone-900 font-sans min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
