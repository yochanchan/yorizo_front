"use client"

import Link from "next/link"
import clsx from "clsx"
import type { ReactNode } from "react"

type PrimaryCtaButtonProps = {
  label: string
  href?: string
  onClick?: () => void
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
  type?: "button" | "submit" | "reset"
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--yori-primary)] text-[var(--yori-primary-ink)] border border-[var(--yori-primary)] px-5 py-3 text-sm font-semibold shadow-[var(--yori-shadow-strong)] transition hover:brightness-[1.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yori-tertiary)]"

export function PrimaryCtaButton({
  label,
  href,
  onClick,
  leftIcon,
  rightIcon,
  className,
  type = "button",
}: PrimaryCtaButtonProps) {
  const content = (
    <span className="flex items-center gap-2">
      {leftIcon}
      <span>{label}</span>
      {rightIcon}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className={clsx(baseClasses, className)}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} className={clsx(baseClasses, className)}>
      {content}
    </button>
  )
}
