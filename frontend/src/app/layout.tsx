import type { Metadata } from "next";
import "./globals.css";



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
    <html lang="vi" className="dark">
      <body className={`antialiased`}>
        {children}
      </body>
    </html>
  );
}
