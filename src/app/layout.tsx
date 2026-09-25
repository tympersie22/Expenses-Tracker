import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Expenses Tracker — Your money, made clear",
  description: "Personal accounts, spending and plans, in one clear picture.",
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
