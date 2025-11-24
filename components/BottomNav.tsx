"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sprout, MessageCircle, BookOpen } from "lucide-react"
import clsx from "clsx"

const NAV_ITEMS = [
  { label: "ホーム", href: "/", icon: Home, disabled: false },
  { label: "Yorizoの記憶", href: "/memory", icon: Sprout, disabled: false },
  { label: "よろず相談", href: "/yorozu", icon: MessageCircle, disabled: false },
  { label: "コラム", href: "/column", icon: BookOpen, disabled: false },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 shadow-sm backdrop-blur z-40">
      <div className="max-w-md mx-auto grid grid-cols-4 text-xs">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-[#1d3a6b]" : "text-slate-400",
                item.disabled && "opacity-60 pointer-events-none",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
