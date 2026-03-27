import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import { Toaster } from 'sonner';
import Shell from '@/components/layout/Shell';
import { QueryProvider } from '@/components/providers/QueryProvider';

const display = Fira_Sans({
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const mono = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
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
        className={`${display.variable} ${mono.variable} antialiased`}
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
