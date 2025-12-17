"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AlertCircle } from "lucide-react"

import { ThinkingRow } from "@/components/ThinkingRow"
import { YoriCard } from "@/components/YoriCard"
import { YoriSectionCard } from "@/components/YoriSectionCard"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import { getConsultationMemo, type ConsultationMemo } from "@/lib/api"

function formatYyyyMmDd(iso?: string) {
  if (!iso) return "--"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "--"
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}/${m}/${day}`
}

export default function ConsultationMemoPage() {
  const params = useParams<{ conversationId: string }>()
  const conversationId = params?.conversationId

  const [memo, setMemo] = useState<ConsultationMemo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMemo = async () => {
      if (!conversationId) {
        setIsLoading(false)
        setMemo(null)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const data = await getConsultationMemo(conversationId)
        setMemo(data)
      } catch (err) {
        console.error(err)
        setError("相談メモを取得できませんでした。時間をおいて再試行してください。")
        setMemo(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemo()
  }, [conversationId])

  const bookingHref = conversationId ? `/yorozu?conversationId=${conversationId}` : "/yorozu"
  const createdAtLabel = memo ? formatYyyyMmDd(memo.created_at) : "--"

  return (
    <main className="w-full">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col flex-1 pb-24 pt-6 space-y-5">
        <YoriSectionCard
          tone="muted"
          title="相談メモをまとめました"
          description="課題をクリアになったら、専門家への相談も検討しましょう。話題を変えて、もう一度整理するのもいいかもしれませんね。"
          icon={<YorizoAvatar size="sm" mood="satisfied" />}
          data-testid="memo-hero-card"
        />

        <YoriSectionCard title={`相談メモ（作成日：${createdAtLabel}）`} data-testid="memo-latest-card">
          <div className="space-y-3">
            {isLoading && (
              <div data-testid="memo-thinking">
                <ThinkingRow text="相談メモを生成しています..." className="py-2" />
              </div>
            )}

            {error && (
              <div className="yori-card p-4 flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-100">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div className="text-sm leading-relaxed">{error}</div>
              </div>
            )}

            {!isLoading && !error && memo && (
              <div className="space-y-3">
                <YoriCard variant="info" title="今回気になっていること" data-testid="memo-current-points">
                  <ul className="list-disc list-inside text-sm text-[var(--yori-ink)] space-y-1 leading-relaxed">
                    {memo.current_points.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </YoriCard>

                <YoriCard variant="info" title="専門家に伝えたい大事なポイント" data-testid="memo-important-points">
                  <ul className="list-disc list-inside text-sm text-[var(--yori-ink)] space-y-1 leading-relaxed">
                    {memo.important_points.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </YoriCard>
              </div>
            )}

            {!isLoading && !error && !memo && (
              <div className="yori-card p-4 text-sm text-[var(--yori-ink)]" data-testid="memo-empty">
                まだ相談メモがありません。チャットから話し始めてみてください。
              </div>
            )}
          </div>
        </YoriSectionCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <YoriCard
            variant="primaryLink"
            title="相談予約をする"
            description="よろず支援などの窓口につなげます。"
            href={bookingHref}
            data-testid="memo-cta-booking"
          />
          <YoriCard
            variant="link"
            title="もう一度チャットで整理する"
            description="新しいチャットを最初から始めます。"
            href="/chat?reset=true"
            data-testid="memo-cta-rechat"
          />
        </div>
      </div>
    </main>
  )
}
