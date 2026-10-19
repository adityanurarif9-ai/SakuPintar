import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SakuPintar — Uang saku, tertata.",
  description: "Catat uang saku, rencanakan tabungan, dan bangun kebiasaan baik.",
  icons: {
    icon: "/app/icon.svg",
    shortcut: "/app/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
