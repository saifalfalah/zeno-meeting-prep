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
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
