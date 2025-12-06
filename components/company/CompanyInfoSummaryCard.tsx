"use client"

import { useRouter } from "next/navigation"
import type { CompanyProfile } from "@/lib/api"

type Props = {
  profile: CompanyProfile | null
  company?: {
    name?: string | null
    industry?: string | null
    employees?: number | null
    annual_revenue_range?: string | null
  }
  loading?: boolean
  onEdit?: () => void
}

export function CompanyInfoSummaryCard({ profile, company, loading, onEdit }: Props) {
  const router = useRouter()
  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else {
      router.push("/company")
    }
  }

  const items = [
    { label: "会社名", value: company?.name || profile?.company_name || "未設定" },
    { label: "業種", value: company?.industry || profile?.industry || "未設定" },
    {
      label: "従業員数",
      value:
        company?.employees != null ? `${company.employees}名` : profile?.employees_range || "未設定",
    },
    { label: "年商レンジ", value: company?.annual_revenue_range || profile?.annual_sales_range || "未設定" },
  ]

  return (
    <section className="yori-card p-5 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">会社情報</p>
          <h2 className="text-lg md:text-xl font-bold text-[var(--yori-ink-strong)]">経営の基本情報</h2>
          <p className="text-[11px] text-[var(--yori-ink-soft)] mt-1">
            相談に進む前に、会社の規模感や業種をさっと確認できます。
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary px-4 py-2 text-xs md:text-sm font-semibold"
          onClick={handleEdit}
        >
          会社情報を登録・更新する
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-[var(--yori-ink-soft)]">読み込み中…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex flex-col rounded-[14px] bg-[var(--yori-surface-muted)] px-3 py-2 border border-[var(--yori-outline)]/70"
            >
              <span className="text-[11px] text-[var(--yori-ink-soft)] font-semibold">{item.label}</span>
              <span className="text-sm md:text-base text-[var(--yori-ink-strong)]">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
