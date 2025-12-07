"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronRight, Loader2, Tag } from "lucide-react"

import { YoriCard } from "@/components/YoriCard"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import { getExperts, type Expert } from "@/lib/api"

const filters = ["すべて", "売上", "人材", "資金繰り", "業務改善", "補助金"]

function YorozuExpertsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  const getConversationId = () => {
    const fromUrl = searchParams.get("conversationId")
    if (fromUrl) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lastConversationId", fromUrl)
      }
      return fromUrl
    }
    if (typeof window !== "undefined") {
      const latest = window.localStorage.getItem("lastConversationId")
      if (latest) return latest
    }
    return null
  }

  const filteredExperts = useMemo(() => {
    if (activeFilter === "すべて") return experts
    return experts.filter((expert) => expert.tags.some((tag) => tag.includes(activeFilter)))
  }, [experts, activeFilter])

  return (
    <div className="flex flex-col gap-5">
      <section className="yori-card-muted p-5 md:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <YorizoAvatar mood="expert" size="sm" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">よろず相談ハブ</p>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              診断結果をもとに、ぴったりの専門家へつなぎます。オンライン・対面どちらも対応しています。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <YoriCard
              key={filter}
              variant="choiceOptional"
              title={filter}
              selected={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
              className="cursor-pointer"
            />
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
          <div key={expert.id} className="yori-card p-5 space-y-3 border border-[var(--yori-outline)]">
            <div className="flex items-start gap-3">
              <YorizoAvatar mood="expert" size="sm" />
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
              onClick={() => {
                const conversationId = getConversationId()
                const qs = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : ""
                router.push(`/yorozu/experts/${expert.id}/schedule${qs}`)
              }}
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

export default function YorozuExpertsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--yori-ink-soft)]">読み込み中...</div>}>
      <YorozuExpertsPageContent />
    </Suspense>
  )
}
