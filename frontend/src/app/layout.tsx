import type { Metadata, Viewport } from "next";
import { Italiana, Jost } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/nav/BottomNav";

const italiana = Italiana({ subsets: ["latin"], weight: "400", variable: "--font-italiana" });
const jost = Jost({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-jost" });

export const metadata: Metadata = {
  title: "MediMind — Small reminders. Big care.",
  description: "Family medicine refill reminders — upload a bill, we track and text until refilled.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#781800",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${italiana.variable} ${jost.variable} font-body antialiased pb-16 md:pb-0`}>
        <div className="max-w-5xl mx-auto px-4 pt-[max(20px,env(safe-area-inset-top))] pb-6">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
