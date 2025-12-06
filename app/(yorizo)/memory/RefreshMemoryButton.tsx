"use client"

import { RefreshCcw } from "lucide-react"
import { useRouter } from "next/navigation"

type Props = { label?: string }

export function RefreshMemoryButton({ label = "最新を確認" }: Props) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="inline-flex items-center gap-1 text-[var(--yori-ink-strong)] font-semibold"
    >
      {label}
      <RefreshCcw className="h-4 w-4" />
    </button>
  )
}
