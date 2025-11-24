import type { ReactNode } from "react"
import { Header } from "@/components/Header"
import { BottomNav } from "@/components/BottomNav"

export default function YorizoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 via-purple-50 to-sky-50">
      <Header />
      <main className="flex-1 flex flex-col pb-24 px-0">{children}</main>
      <BottomNav />
    </div>
  )
}
