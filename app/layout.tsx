import type { Metadata } from "next"
import { Nunito, Space_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-display",
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Brickr",
  description:
    "Turn any image into LEGO-style pixel art — right in your browser.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(nunito.variable, spaceMono.variable)}
      suppressHydrationWarning
    >
      <body className="bg-sand-100 antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
