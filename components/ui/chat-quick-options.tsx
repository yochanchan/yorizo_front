"use client"

import clsx from "clsx"
import type { ChatOption } from "@/lib/api"

type ChatQuickOptionsProps = {
  options: ChatOption[]
  onSelect: (option: ChatOption) => void
  disabled?: boolean
  title?: string
  className?: string
}

export function ChatQuickOptions({
  options,
  onSelect,
  disabled,
  title = "気になるテーマを選んでください",
  className,
}: ChatQuickOptionsProps) {
  if (!options.length) return null

  return (
    <div className={clsx("rounded-2xl border border-white/70 bg-white/80 px-4 pb-3 pt-2 shadow-sm sm:px-6", className)}>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--yori-ink-soft)] sm:text-sm">
        <span className="text-base">⭐</span>
        <span>{title}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="inline-flex items-center rounded-full border border-[var(--yori-outline)] bg-[var(--yori-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--yori-ink-strong)] shadow-sm transition-colors hover:bg-[var(--yori-secondary)] sm:text-sm disabled:opacity-50 disabled:cursor-default"
            onClick={() => onSelect(opt)}
            disabled={disabled}
            data-testid="chat-quick-option"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
