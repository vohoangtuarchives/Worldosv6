import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import { Toaster } from 'sonner';
import Shell from '@/components/layout/Shell';
import { QueryProvider } from '@/components/providers/QueryProvider';

const body = IBM_Plex_Sans({
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const heading = JetBrains_Mono({
  variable: "--font-heading",
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
        className={`${body.variable} ${heading.variable} antialiased`}
      >
        <QueryProvider>
          <Shell>
            {children}
          </Shell>
        </QueryProvider>
        <Toaster theme="light" position="top-right" richColors />
      </body>
    </html>
  );
}
