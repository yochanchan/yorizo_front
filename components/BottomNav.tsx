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
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-[760px] px-4 pb-3">
        <div className="grid grid-cols-4 items-center bg-[rgba(255,254,254,0.96)] backdrop-blur-xl border border-[var(--yori-outline)] shadow-[0_16px_46px_rgba(39,35,67,0.16)] rounded-t-3xl px-1 py-1">
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
                  "flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[11px] font-semibold transition-colors",
                  isActive
                    ? "bg-[var(--yori-secondary)] text-[var(--yori-ink-strong)]"
                    : "text-[var(--yori-ink-soft)] hover:text-[var(--yori-ink-strong)]",
                  item.disabled && "opacity-60 pointer-events-none",
                )}
                aria-label={item.label}
              >
                <item.icon
                  className={clsx(
                    "h-5 w-5",
                    isActive ? "text-[var(--yori-ink-strong)]" : "text-[var(--yori-ink-soft)]",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
