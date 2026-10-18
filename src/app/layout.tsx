import type { Metadata } from "next";
import "./globals.css";
import "./amir-classic.css";

export const metadata: Metadata = {
  title: "أمير للتجارة الإلكترونية - إدارة الحجوزات والخزائن",
  description: "نظام متكامل لإدارة الحجوزات، دورة السحب، وخزائن الدينار والدولار",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
