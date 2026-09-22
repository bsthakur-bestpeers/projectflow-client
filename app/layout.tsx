import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/constants";
import Providers from "@/app/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: `${APP_NAME} — Agile project management for high-velocity software teams.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans bg-slate-50/70 text-slate-800 antialiased min-h-screen selection:bg-indigo-500/20 selection:text-indigo-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
