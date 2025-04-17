import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import MainContent from '@/components/MainContent';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your daily, weekly, and monthly expenses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <MainContent>
          {children}
        </MainContent>
      </body>
    </html>
  );
} 