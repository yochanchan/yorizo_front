"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CalendarDays, ChevronRight, FileText, Loader2, RefreshCcw } from "lucide-react"
import {
  getConversationDetail,
  getConversationReport,
  type ConversationDetail,
  type ConversationReport,
} from "@/lib/api"
import { cleanConversationTitle } from "@/lib/utils"

export default function ConsultationMemoPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const router = useRouter()
  const [report, setReport] = useState<ConversationReport | null>(null)
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [notExists, setNotExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!conversationId) return
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [reportEnvelope, conversationDetail] = await Promise.all([
          getConversationReport(conversationId),
          getConversationDetail(conversationId),
        ])
        if (!mounted) return
        const responseReport = (reportEnvelope as any)?.report ?? reportEnvelope
        if ((reportEnvelope as any)?.exists === false || !responseReport) {
          setNotExists(true)
          setReport(null)
        } else {
          setReport(responseReport as ConversationReport)
        }
        setConversation(conversationDetail)
      } catch (err) {
        console.error(err)
        if (!mounted) return
        setError("相談メモを取得できませんでした。時間をおいて再試行してください。")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [conversationId, refreshKey])

  const memoTitle = useMemo(() => {
    const title = conversation?.title ?? report?.title ?? ""
    return cleanConversationTitle(title)
  }, [conversation, report])

  const memoDate = useMemo(() => {
    const raw = conversation?.ended_at ?? conversation?.started_at ?? report?.created_at
    if (!raw) return ""
    return new Date(raw).toLocaleDateString("ja-JP")
  }, [conversation, report])

  const pendingTasks = useMemo(
    () =>
      (report?.homework ?? []).filter((task) => {
        if (!task.status) return true
        return task.status === "pending"
      }),
    [report],
  )

  const expertPoint = useMemo(() => {
    const parts: string[] = []
    if (memoTitle) parts.push(`主な関心事は「${memoTitle}」です`)
    const categoryLabel = conversation?.category ?? report?.category
    if (categoryLabel) parts.push(`カテゴリは${categoryLabel}`)
    if (conversation?.step) parts.push(`ステップ${conversation.step}まで回答済みです`)
    if (parts.length === 0) return null
    return `${parts.join("。")}。`
  }, [conversation, memoTitle, report])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="w-full flex flex-col gap-5 pb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--yori-ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> 戻る
        </button>
        <div className="text-xs font-semibold text-[var(--yori-ink-soft)] bg-[var(--yori-secondary)] px-3 py-1 rounded-full border border-[var(--yori-outline)]">
          相談メモ
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--yori-ink-soft)] underline underline-offset-4"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          メモを再生成
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[var(--yori-ink-soft)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>相談メモを読み込み中…</span>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {notExists && !loading && (
        <div className="yori-card p-5 space-y-2">
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">相談メモはまだ作成されていません。</p>
          <p className="text-sm text-[var(--yori-ink)]">チャットを進めて、整理が完了したら相談メモが確認できます。</p>
          <button
            type="button"
            onClick={() => router.push(`/chat?conversationId=${conversationId ?? ""}`)}
            className="btn-primary w-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            チャットに戻る
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {report && (
        <>
          <header className="yori-card p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--yori-secondary)] border border-[var(--yori-outline)] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--yori-ink-strong)]" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-[var(--yori-ink-soft)]">今回の相談メモ</p>
                <h1 className="text-xl font-bold text-[var(--yori-ink-strong)]">{memoTitle}</h1>
                <div className="flex items-center gap-2 text-xs text-[var(--yori-ink-soft)]">
                  <CalendarDays className="h-4 w-4" />
                  <span>{memoDate}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              今回のチャットで整理された内容をまとめています。次に何をすべきかを明確にし、よろず専門家に相談する際にも使えます。
            </p>
          </header>

          <section className="yori-card p-5 space-y-2">
            <p className="text-base font-semibold text-[var(--yori-ink-strong)]">会話の中で整理された課題</p>
            <p className="text-sm text-[var(--yori-ink)]">{memoTitle || "課題はまだ整理されていません。"}</p>
          </section>

          <section className="yori-card p-5 space-y-3">
            <p className="text-base font-semibold text-[var(--yori-ink-strong)]">今取り組むべきこと</p>
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-[var(--yori-ink)]">今すぐ取り組むべき課題はありません。</p>
            ) : (
              <ul className="list-disc list-inside space-y-2 text-sm text-[var(--yori-ink)]">
                {pendingTasks.map((task) => (
                  <li key={`${task.id ?? task.title}`}>{task.title}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="yori-card p-5 space-y-3">
            <p className="text-base font-semibold text-[var(--yori-ink-strong)]">専門家に相談する際に伝えるべきポイント</p>
            {expertPoint ? (
              <p className="text-sm text-[var(--yori-ink)] leading-relaxed">{expertPoint}</p>
            ) : (
              <p className="text-sm text-[var(--yori-ink)]">特別に伝えるポイントはまだありません。</p>
            )}
          </section>

          <div className="yori-card p-5 space-y-3">
            <p className="text-base font-semibold text-[var(--yori-ink-strong)]">よろず支援に相談する</p>
            <p className="text-sm text-[var(--yori-ink)]">整理された内容をもとに、専門家と次の一歩を決めましょう。</p>
            <button
              type="button"
              onClick={() => router.push("/yorozu")}
              className="btn-primary w-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              よろず支援に相談する
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="yori-card p-5 space-y-3">
            <p className="text-base font-semibold text-[var(--yori-ink-strong)]">もう一度診断する</p>
            <p className="text-sm text-[var(--yori-ink)]">状況が変わったら、チャットで再度整理してみましょう。</p>
            <button
              type="button"
              onClick={() => router.push("/chat?reset=true")}
              className="btn-ghost w-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              もう一度診断する
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
