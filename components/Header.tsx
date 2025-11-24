"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Settings } from "lucide-react"
import { MascotIcon } from "./MascotIcon"

type HeaderProps = {
  title?: string
  showBackButton?: boolean
}

export function Header({ title, showBackButton }: HeaderProps) {
  const router = useRouter()
  return (
    <header className="px-4 pt-4 pb-2 sticky top-0 z-30 bg-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              type="button"
              onClick={() => router.back()}
              className="h-9 w-9 rounded-full bg-white/80 border border-white/60 flex items-center justify-center text-slate-600 shadow-sm"
              aria-label="戻る"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <MascotIcon size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-slate-800">Yorizo</span>
              {title ? (
                <span className="text-[11px] text-slate-500">{title}</span>
              ) : (
                <span className="text-[11px] text-slate-500">経営のモヤモヤを整える</span>
              )}
            </div>
          </Link>
        </div>
        <button
          type="button"
          className="h-10 w-10 rounded-full bg-white/80 border border-white/60 text-slate-500 flex items-center justify-center shadow-sm"
          aria-label="設定"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
