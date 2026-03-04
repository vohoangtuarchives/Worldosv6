import type { Metadata } from "next";
import { Crimson_Pro, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
});

const narrative = Crimson_Pro({
  variable: "--font-narrative",
  subsets: ["latin", "vietnamese"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "WorldOS V6",
  description: "Civilizational Dynamics Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${display.variable} ${narrative.variable} ${mono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
