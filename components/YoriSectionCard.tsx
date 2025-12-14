import clsx from "clsx"
import type { HTMLAttributes, ReactNode } from "react"

type YoriSectionCardProps = {
  title?: string
  description?: string
  icon?: ReactNode
  tone?: "default" | "muted"
  children?: ReactNode
} & Omit<HTMLAttributes<HTMLElement>, "title">

export function YoriSectionCard({
  title,
  description,
  icon,
  tone = "default",
  children,
  className,
  ...rest
}: YoriSectionCardProps) {
  const toneClass = tone === "muted" ? "yori-card-muted" : "yori-card"

  return (
    <section className={clsx(toneClass, "p-5 md:p-6 space-y-3", className)} {...rest}>
      {(title || description || icon) && (
        <div className="flex items-start gap-3">
          {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
          <div className="space-y-1">
            {title && <h2 className="text-lg font-bold text-[var(--yori-ink-strong)]">{title}</h2>}
            {description && <p className="text-sm text-[var(--yori-ink)] leading-relaxed">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </section>
  )
}
