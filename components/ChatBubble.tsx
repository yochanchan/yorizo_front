"use client"

import { ReactNode } from "react"
import clsx from "clsx"

type ChatBubbleProps = {
  role: "assistant" | "user" | "system"
  children: ReactNode
  timestamp?: string
  className?: string
  bubbleClassName?: string
}

export function ChatBubble({ role, children, timestamp, className, bubbleClassName }: ChatBubbleProps) {
  const isUser = role === "user"
  const isSystem = role === "system"

  return (
    <div className={clsx("flex w-full", isUser ? "justify-end" : "justify-start", className)}>
      <div
        className={clsx(
          "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          "border shadow-sm",
          isUser && "bg-[var(--yori-surface)] border-black/5 text-[var(--yori-ink-strong)]",
          !isUser && !isSystem && "bg-[var(--yori-secondary)] border-[var(--yori-outline)] text-[var(--yori-ink)]",
          isSystem && "bg-[var(--yori-surface-muted)] border-[var(--yori-outline)] text-[var(--yori-ink-soft)] mx-auto",
          bubbleClassName,
        )}
      >
        <div className="whitespace-pre-wrap">{children}</div>
        {timestamp && (
          <span className="mt-2 block text-[10px] text-[var(--yori-ink-soft)] opacity-80">{timestamp}</span>
        )}
      </div>
    </div>
  )
}
