"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AlertCircle } from "lucide-react"

import { ThinkingRow } from "@/components/ThinkingRow"
import { YoriCard } from "@/components/YoriCard"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import { getConsultationMemo, type ConsultationMemo } from "@/lib/api"

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

  return (
    <main className="w-full">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col flex-1 pb-24 pt-6 space-y-5">
        <YoriCard
          variant="info"
          title="相談メモをまとめました"
          description="チャット内容から自動生成します。初回は少し時間がかかります。"
          icon={<YorizoAvatar size="sm" mood="satisfied" />}
          className="!bg-white"
          data-testid="memo-hero-card"
        />

        <YoriCard variant="info" title="最新の相談メモ" className="!bg-white" data-testid="memo-latest-card">
          <div className="mt-3 space-y-3">
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
        </YoriCard>

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
