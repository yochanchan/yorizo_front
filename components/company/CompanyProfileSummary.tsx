"use client"

import clsx from "clsx"
import type { CompanyProfile } from "@/lib/api"

type CompanyProfileSummaryProps = {
  profile: CompanyProfile | null
  loading?: boolean
  showDetails: boolean
  onToggleDetails: () => void
  onEdit?: () => void
}

const summaryFields: { label: string; key: keyof CompanyProfile }[] = [
  { label: "会社名", key: "company_name" },
  { label: "業種", key: "industry" },
  { label: "従業員数", key: "employees_range" },
  { label: "年商レンジ", key: "annual_sales_range" },
]

const detailFields: { label: string; key: keyof CompanyProfile }[] = [
  { label: "所在地（都道府県）", key: "location_prefecture" },
  { label: "設立/創業年", key: "years_in_business" },
]

export function CompanyProfileSummary({
  profile,
  loading,
  showDetails,
  onToggleDetails,
  onEdit,
}: CompanyProfileSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">会社情報</p>
          <p className="text-xs text-[var(--yori-ink-soft)]">経営の基本情報をまとめています。</p>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-semibold text-[var(--yori-ink-strong)] underline underline-offset-4"
          >
            編集
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-[var(--yori-ink-soft)]">読み込み中…</p>
      ) : profile ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {summaryFields.map((field) => (
              <div
                key={field.key}
                className="flex flex-col rounded-2xl border border-[var(--yori-outline)] bg-[var(--yori-surface-muted)] px-3 py-2"
              >
                <span className="text-[11px] text-[var(--yori-ink-soft)]">{field.label}</span>
                <span className="text-sm font-semibold text-[var(--yori-ink-strong)]">
                  {(profile as any)[field.key] || "未設定"}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onToggleDetails}
            className="text-[11px] font-semibold text-[var(--yori-ink-soft)] underline underline-offset-4"
          >
            {showDetails ? "詳細をとじる" : "詳細をひらく"}
          </button>
          <div className={clsx("grid grid-cols-1 md:grid-cols-2 gap-3 text-sm", !showDetails && "hidden")}>
            {detailFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <p className="text-[11px] text-[var(--yori-ink-soft)]">{field.label}</p>
                <p className="text-[var(--yori-ink-strong)]">
                  {field.key === "years_in_business"
                    ? profile.years_in_business !== null && profile.years_in_business !== undefined
                      ? `${profile.years_in_business}年`
                      : "未設定"
                    : (profile as any)[field.key] || "未設定"}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--yori-ink-soft)]">まだ会社情報が登録されていません。</p>
      )}
    </div>
  )
}
