import type { Metadata } from "next"
import { Geist_Mono, Noto_Sans, Playfair_Display } from "next/font/google"

import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const playfairDisplayHeading = Playfair_Display({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "skill evals — instrument panel",
  description:
    "Trajectory dashboard for Anthropic skill-creator eval runs: portfolio overview, per-skill pass-rate evolution, and per-run breakdowns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", notoSans.variable, playfairDisplayHeading.variable)}
    >
      <body className="min-h-svh bg-background text-foreground">
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
