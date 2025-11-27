import type { ReactNode } from "react"
import { Header } from "@/components/Header"
import { BottomNav } from "@/components/BottomNav"

export default function YorizoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="yori-shell w-full pb-[calc(var(--yori-nav-height)+32px)] pt-3 md:pt-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  )
}
