import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const manropeSans = Manrope({
  variable: "--font-manrope-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dazzler's Den Admin Panel",
  description: "Customer management system for Dazzler's Den",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
          rel="stylesheet" />
      </head>

      <body
        className={`${manropeSans.variable} font-sans antialiased bg-background-light dark:bg-background-dark`}
      >
        {children}
        <Toaster
          position="top-center"
          swipeDirections={["right", "left"]}
          richColors
          closeButton />
      </body>
    </html>
  );
}
