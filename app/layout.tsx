import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Noto_Sans_JP } from "next/font/google"
import "./globals.css"

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "Yorizo",
  description: "中小企業診断士が伴走するAIパートナー「Yorizo」",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${noto.className} antialiased text-[var(--yori-ink)] bg-[var(--yori-canvas)]`}>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  )
}
