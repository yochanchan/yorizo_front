"use client"

import { ChevronRight } from "lucide-react"

const menuItems = [
  { label: "Yorizoについて", href: "/about" },
  { label: "よくあるご質問", href: "/faq" },
  { label: "利用規約", href: "/terms" },
  { label: "プライバシーポリシー", href: "/privacy" },
]

export default function MorePage() {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-2">
      <div className="bg-white/95 rounded-3xl shadow-sm border border-white/80 divide-y divide-slate-100">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <span>{item.label}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </a>
        ))}
      </div>
    </div>
  )
}

