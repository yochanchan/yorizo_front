"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, NotebookPen, Sprout, LineChart } from "lucide-react"
import clsx from "clsx"

type NavItem = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: "ホーム", href: "/", icon: Home },
  { label: "よろず相談", href: "/yorozu", icon: MessageCircle },
  { label: "Yorizoの記憶", href: "/memory", icon: Sprout },
  { label: "宿題", href: "/homework", icon: NotebookPen },
  { label: "イマココ", href: "/report", icon: LineChart },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--yori-outline)] bg-[rgba(232,245,248,0.9)] backdrop-blur-md">
      <div className="mx-auto max-w-[820px] px-3 pb-3">
        <div className="grid grid-cols-5 items-center rounded-3xl bg-white/90 border border-[var(--yori-outline)] shadow-[0_16px_46px_rgba(39,35,67,0.12)] px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition-colors",
                  active
                    ? "bg-[var(--yori-secondary)] text-[var(--yori-ink-strong)]"
                    : "text-[var(--yori-ink-soft)] hover:text-[var(--yori-ink-strong)]",
                )}
                aria-label={item.label}
              >
                <item.icon
                  className={clsx(
                    "h-5 w-5",
                    active ? "text-[var(--yori-ink-strong)]" : "text-[var(--yori-ink-soft)]",
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
