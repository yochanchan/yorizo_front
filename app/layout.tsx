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
  description: "小規模事業者のモヤモヤを整えるAIパートナー",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${noto.className} text-slate-900 antialiased bg-gradient-to-b from-pink-50 via-purple-50 to-sky-50`}>
        <div className="min-h-screen flex flex-col items-center">
          <div className="max-w-md w-full mx-auto min-h-screen flex flex-col">{children}</div>
        </div>
      </body>
    </html>
  )
}
