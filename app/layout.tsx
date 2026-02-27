import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#662b62",
};

export const metadata: Metadata = {
  title: "AI Study Assistant | Bata Learner",
  description: "Upload materials, view summaries, and take practice quizzes.",
  icons: {
    icon: [{ url: "/handoutlogo.png", type: "image/png" }],
    shortcut: ["/handoutlogo.png"],
    apple: [{ url: "/handoutlogo.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-pt-16">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:border focus:border-trust-blue focus:px-3 focus:py-2 focus:rounded-intermediate focus:outline-none"
        >
          Skip to main content
        </a>
        <SessionProvider>
          <div className="min-h-screen bg-slate-100 flex justify-center w-full">
            <LayoutWrapper>{children}</LayoutWrapper>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
