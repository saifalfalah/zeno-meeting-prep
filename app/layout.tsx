import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zeno Meeting Prep",
  description: "Pre-Call Intelligence Dashboard for Sales Professionals",
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
