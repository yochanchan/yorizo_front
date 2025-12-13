"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import clsx from "clsx"
import type { ElementType, ReactNode } from "react"

type Variant = "primaryLink" | "link" | "info" | "choiceRequired" | "choiceOptional"

type YoriCardProps = {
  variant: Variant
  title: string
  description?: string
  href?: string
  onClick?: () => void
  icon?: ReactNode
  className?: string
  children?: ReactNode
  selected?: boolean
  disabled?: boolean
  eyebrow?: string
}

function getVariantClasses(variant: Variant, selected?: boolean) {
  const base =
    "rounded-2xl border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yori-tertiary)]"

  const sharedLink = "shadow-[var(--yori-shadow-card)]"

  if (variant === "primaryLink") {
    return clsx(
      base,
      sharedLink,
      "bg-[var(--yori-primary)] text-[var(--yori-primary-ink)] border-[var(--yori-primary)] shadow-[var(--yori-shadow-strong)]",
    )
  }
  if (variant === "link") {
    return clsx(
      base,
      sharedLink,
      "bg-[var(--yori-surface)] text-[var(--yori-ink-strong)] border-[var(--yori-outline)] border-l-4 border-l-[var(--yori-tertiary)]",
    )
  }
  if (variant === "info") {
    return clsx(base, "bg-[var(--yori-surface-muted)] text-[var(--yori-ink-soft)] border-[var(--yori-outline)] shadow-none")
  }
  if (variant === "choiceRequired") {
    return clsx(
      base,
      "text-[var(--yori-ink-strong)] shadow-none",
      selected
        ? "border-[var(--yori-primary)] bg-[rgba(255,216,3,0.14)]"
        : "border-[var(--yori-outline)] bg-white hover:border-[var(--yori-tertiary)]",
    )
  }
  return clsx(
    base,
    "shadow-none text-[var(--yori-ink)]",
    selected
      ? "border-[var(--yori-tertiary)] bg-[var(--yori-secondary)]"
      : "border-dashed border-[var(--yori-outline)] bg-white hover:border-[var(--yori-tertiary)]",
  )
}

export function YoriCard({
  variant,
  title,
  description,
  href,
  onClick,
  icon,
  className,
  children,
  selected,
  disabled,
  eyebrow,
}: YoriCardProps) {
  const isLink = variant === "primaryLink" || variant === "link"
  const isChoice = variant === "choiceRequired" || variant === "choiceOptional"
  const Component: ElementType = href && isLink ? Link : isChoice ? "button" : "div"
  const variantClasses = getVariantClasses(variant, selected)
  const padding =
    variant === "choiceRequired"
      ? "px-4 py-3"
      : variant === "choiceOptional"
        ? "px-3 py-2"
        : "px-4 py-4 md:px-5"

  const content = (
    <div className={clsx("flex items-center gap-3", variant === "info" ? "justify-start" : "justify-between")}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && <div className="mt-0.5 text-[var(--yori-ink-strong)]">{icon}</div>}
        <div className="space-y-1 flex-1 min-w-0">
          {eyebrow && <p className="text-[11px] font-semibold text-[var(--yori-ink-soft)]">{eyebrow}</p>}
          <p
            className={clsx(
              "font-semibold leading-snug",
              variant === "choiceOptional" ? "text-sm" : "text-base",
              variant === "info" ? "text-[var(--yori-ink)]" : "text-[var(--yori-ink-strong)]",
            )}
          >
            {title}
          </p>
          {variant === "link" && description && (
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">{description}</p>
          )}
          {variant === "info" && description && (
            <p className="text-sm text-[var(--yori-ink-soft)] leading-relaxed">{description}</p>
          )}
          {(variant === "choiceRequired" || variant === "choiceOptional") && description && (
            <p className="text-xs text-[var(--yori-ink-soft)] leading-relaxed">{description}</p>
          )}
          {children}
        </div>
      </div>
      {isLink && (
        <ArrowRight data-testid="yori-card-arrow" className="h-5 w-5 shrink-0 text-[var(--yori-ink-strong)]" aria-hidden />
      )}
    </div>
  )

  return (
    <Component
      href={href}
      onClick={onClick}
      type={Component === "button" ? "button" : undefined}
      className={clsx("block", variantClasses, padding, className, disabled && "opacity-60 pointer-events-none")}
      data-variant={variant}
      data-selected={selected ? "true" : "false"}
      aria-pressed={isChoice ? selected : undefined}
      aria-disabled={disabled}
    >
      {content}
    </Component>
  )
}
