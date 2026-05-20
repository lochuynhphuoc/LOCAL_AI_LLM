import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "GigaChat",
  description: "Smart AI assistant for agriculture and crop cultivation",
  icons: {
    icon: "/gigachat.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${inter.variable} dark`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
