import type { Metadata } from "next";
import { Inter } from "next/font/google";
import GlobalRoomsDock from "./GlobalRoomsDock";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Соревновательный филворд",
  description: "Многопользовательская игра в поиск слов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} dark`}>
        {children}
        <GlobalRoomsDock />
      </body>
    </html>
  );
}
