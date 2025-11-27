"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Tag, Loader2, MessageSquare, ChevronRight } from "lucide-react"
import { getExperts, type Expert } from "@/lib/api"

const filters = ["すべて", "売上", "人材", "資金繰り", "業務改善", "補助金"]

export default function YorozuExpertsPage() {
  const router = useRouter()
  const [experts, setExperts] = useState<Expert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState("すべて")

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const data = await getExperts()
        setExperts(data)
      } catch (err) {
        console.error(err)
        setError("専門家の情報を取得できませんでした。")
      } finally {
        setIsLoading(false)
      }
    }
    fetchExperts()
  }, [])

  const filteredExperts = useMemo(() => {
    if (activeFilter === "すべて") return experts
    return experts.filter((expert) => expert.tags.some((tag) => tag.includes(activeFilter)))
  }, [experts, activeFilter])

  return (
    <div className="flex flex-col gap-5">
      <section className="yori-card-muted p-5 md:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-6 w-6 text-[var(--yori-ink-strong)]" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">よろず相談</p>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              診断結果をもとに、ぴったりの専門家へつなぎます。オンライン・対面どちらも対応。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`yori-chip ${activeFilter === filter ? "bg-[var(--yori-secondary)] border-[var(--yori-tertiary)]" : ""}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[var(--yori-ink-soft)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>読み込み中...</span>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {filteredExperts.map((expert) => (
          <div
            key={expert.id}
            className="yori-card p-5 space-y-3 border border-[var(--yori-outline)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-[var(--yori-secondary)] border border-[var(--yori-outline)] flex items-center justify-center text-sm font-semibold text-[var(--yori-ink-strong)]">
                {expert.name.slice(0, 2)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-base font-semibold text-[var(--yori-ink-strong)]">{expert.name}</p>
                {expert.organization && (
                  <p className="text-xs font-semibold text-[var(--yori-ink)]">{expert.organization}</p>
                )}
                {expert.title && <p className="text-xs text-[var(--yori-ink-soft)]">{expert.title}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {expert.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-[var(--yori-outline)] text-[11px] text-[var(--yori-ink)] px-3 py-1"
                >
                  <Tag className="h-3 w-3 text-[var(--yori-ink-soft)]" />
                  {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => router.push(`/yorozu/experts/${expert.id}/schedule`)}
              className="btn-primary w-full px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              相談を申し込む
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
