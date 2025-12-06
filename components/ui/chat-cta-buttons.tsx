"use client"

import clsx from "clsx"
import type { ChatCTAButton } from "@/lib/api"

type ChatCTAButtonsProps = {
  buttons: ChatCTAButton[]
  onSelect: (button: ChatCTAButton) => void
  className?: string
}

export function ChatCTAButtons({ buttons, onSelect, className }: ChatCTAButtonsProps) {
  if (!buttons.length) return null

  return (
    <div className={clsx("rounded-2xl border border-white/40 bg-white/80 px-3 py-2 shadow-sm", className)}>
      <div className="flex flex-wrap gap-2 text-xs text-[var(--yori-ink-soft)]">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => onSelect(btn)}
            className="inline-flex items-center rounded-full border border-[var(--yori-outline)] bg-white/90 px-3 py-1 text-xs sm:text-sm text-[var(--yori-ink-strong)] shadow-sm transition hover:bg-[var(--yori-secondary)]"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
