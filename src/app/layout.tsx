import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DNS Takeover Detector",
  description: "Detect vulnerable DNS takeovers in subdomains",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
