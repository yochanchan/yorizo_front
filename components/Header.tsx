"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Settings } from "lucide-react"

import { YorizoAvatar } from "./YorizoAvatar"

type HeaderProps = {
  title?: string
  showBackButton?: boolean
}

export function Header({ title, showBackButton }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--yori-outline)]/60 bg-[rgba(255,254,254,0.78)] backdrop-blur-lg">
      <div className="yori-shell flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              type="button"
              onClick={() => router.back()}
              className="h-10 w-10 rounded-full bg-[var(--yori-secondary)] border border-[var(--yori-outline)] text-[var(--yori-ink)] flex items-center justify-center shadow-sm"
              aria-label="戻る"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <Link href="/" className="flex items-center gap-3 group">
            <YorizoAvatar size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-[var(--yori-ink-soft)]">経営コンシェルジュ</span>
              <Image
                src="/logos/YorizoLogo.png"
                alt="Yorizo"
                width={271}
                height={82}
                className="h-6 w-auto max-w-[80px] origin-top-left transition-opacity"
                priority
              />
              {title && <span className="text-[11px] text-[var(--yori-ink-soft)]">{title}</span>}
            </div>
          </Link>
        </div>
        <button
          type="button"
          className="h-10 w-10 rounded-full bg-[var(--yori-secondary)] border border-[var(--yori-outline)] text-[var(--yori-ink-soft)] flex items-center justify-center shadow-sm"
          aria-label="会社設定"
          onClick={() => router.push("/company")}
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
