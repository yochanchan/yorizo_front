"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sprout, MessageCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      label: "ホーム",
      href: "/",
      icon: Home,
      active: pathname === "/",
    },
    {
      label: "Yorizoの記憶",
      href: "/memory",
      icon: Sprout,
      active: pathname === "/memory",
    },
    {
      label: "よろず相談",
      href: "/chat",
      icon: MessageCircle,
      active: pathname === "/chat",
      disabled: false,
    },
    {
      label: "その他",
      href: "#",
      icon: Settings,
      active: false,
      disabled: true,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-between px-6 h-16">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 w-16 transition-colors",
              item.active ? "text-[#1D3A6B]" : "text-gray-400",
              item.disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
