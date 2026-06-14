import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ulvik | Custom T-Shirt Printing, Garment Services & Cost Calculator",
  description: "Ulvik is a premium t-shirt printing shop based in Algiers. Buy blank t-shirts, custom DTF/screen printed garments, or bring your own clothes to print on them. Optimize your local order costs with our real-time benefit calculator.",
  keywords: "t-shirt printing Algiers, custom printing Algeria, screen print Algeria, DTF print Algeria, buy blank shirts Algiers, custom clothes Algeria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
