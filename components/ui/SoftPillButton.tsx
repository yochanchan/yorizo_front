"use client"

import Link from "next/link"
import clsx from "clsx"
import type { ReactNode } from "react"

type SoftPillButtonProps = {
  label?: string
  href?: string
  onClick?: () => void
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children?: ReactNode
  className?: string
  type?: "button" | "submit" | "reset"
}

const baseClasses =
  "inline-flex items-center whitespace-nowrap rounded-full bg-white/70 px-3 py-1.5 text-[11px] md:text-xs font-semibold text-sky-600 shadow-sm border border-sky-100 hover:bg-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"

export function SoftPillButton({
  label,
  href,
  onClick,
  leftIcon,
  rightIcon,
  children,
  className,
  type = "button",
}: SoftPillButtonProps) {
  const content = (
    <span className="flex w-full items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        {leftIcon}
        {label && <span>{label}</span>}
      </span>
      {rightIcon}
      {children}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className={clsx(baseClasses, className)}>
        {children ?? content}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} className={clsx(baseClasses, className)}>
      {children ?? content}
    </button>
  )
}
