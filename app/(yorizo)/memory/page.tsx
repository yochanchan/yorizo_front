"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronRight, Loader2, RefreshCcw, Sprout, Folder } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  getConversations,
  listDocuments,
  listHomework,
  type ConversationSummary,
  type HomeworkTask,
} from "@/lib/api"
import { MascotIcon } from "@/components/MascotIcon"
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile"
import { CompanyInfoSummaryCard } from "@/components/company/CompanyInfoSummaryCard"

const USER_ID = "demo-user"

export default function MemoryPage() {
  const router = useRouter()
  const { data: profile, isLoading: loadingProfile, refetch: refetchProfile } = useCompanyProfile(USER_ID)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [pendingHomework, setPendingHomework] = useState<HomeworkTask[]>([])
  const [documentsCount, setDocumentsCount] = useState<number>(0)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations(USER_ID, 5, 0)
        setConversations(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingConversations(false)
      }
    }
    fetchConversations()
  }, [])

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const tasks = await listHomework(USER_ID, "pending")
        setPendingHomework(tasks)
      } catch (err) {
        console.error(err)
      }
    }
    fetchHomework()
  }, [])

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const items = await listDocuments(USER_ID)
        setDocumentsCount(items.length)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingDocs(false)
      }
    }
    fetchDocs()
  }, [])

  const formattedConversations = useMemo(() => {
    return conversations.map((c) => {
      const dateLabel = c.date ? c.date.replace(/-/g, "/") : ""
      return { ...c, dateLabel }
    })
  }, [conversations])

  const latestConversation = formattedConversations[0]

  const stats = [
    { label: "相談回数", value: `${conversations.length}件` },
    { label: "未完了の宿題", value: `${pendingHomework.length}件` },
    { label: "保存資料", value: loadingDocs ? "読み込み中" : `${documentsCount}件` },
  ]

  return (
    <div className="flex flex-col gap-5">
      <section className="yori-card-muted p-5 md:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <MascotIcon size="lg" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">Yorizoの記憶</p>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              これまでの相談内容や宿題、会社の資料をあとから落ち着いて見返せます。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="btn-primary px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            Yorizoと話す
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push("/homework")}
            className="btn-secondary px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            宿題を確認
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        {stats.map((card) => (
          <div key={card.label} className="yori-card p-4 text-center space-y-1">
            <p className="text-[11px] text-[var(--yori-ink-soft)]">{card.label}</p>
            <p className="text-xl font-bold text-[var(--yori-ink-strong)]">{card.value}</p>
          </div>
        ))}
      </section>

      <CompanyInfoSummaryCard profile={profile} loading={loadingProfile} onEdit={() => router.push("/company")} />

      <section className="yori-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-[var(--yori-ink-strong)]" />
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">最新の診断</p>
        </div>
        {loadingConversations && (
          <div className="flex items-center gap-2 text-xs text-[var(--yori-ink-soft)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            読み込み中…
          </div>
        )}
        {!loadingConversations && !latestConversation && (
          <p className="text-sm text-[var(--yori-ink-soft)]">まだ診断はありません。</p>
        )}
        {latestConversation && (
          <div className="yori-card bg-[var(--yori-surface-muted)] p-4 space-y-2">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{latestConversation.title}</p>
            <p className="text-xs text-[var(--yori-ink-soft)]">{latestConversation.dateLabel}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/report/${latestConversation.id}`)}
                className="btn-secondary px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
              >
                レポートを見る
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push(`/chat?conversationId=${latestConversation.id}`)}
                className="btn-ghost px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
              >
                チャットを開く
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="yori-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-[var(--yori-ink-strong)]" />
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">会社の資料</p>
        </div>
        <p className="text-sm text-[var(--yori-ink)]">保存済み: {loadingDocs ? "読み込み中" : `${documentsCount}件`}</p>
        <button
          type="button"
          onClick={() => router.push("/documents")}
          className="btn-ghost px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
        >
          資料を管理する
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      <section className="yori-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">これまで相談したこと（最新5件）</p>
        </div>
        <div className="space-y-1">
          {loadingConversations && (
            <div className="flex items-center gap-2 text-xs text-[var(--yori-ink-soft)] px-2 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              読み込み中…
            </div>
          )}
          {!loadingConversations &&
            formattedConversations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/chat?conversationId=${item.id}`)}
                className="w-full text-left flex items-center justify-between px-2 py-3 border-b border-[var(--yori-outline)] last:border-0 hover:bg-[var(--yori-surface-muted)] rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{item.title}</p>
                  <p className="text-xs text-[var(--yori-ink-soft)]">{item.dateLabel}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--yori-ink-soft)]" />
              </button>
            ))}
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => router.push("/memory/history")}
            className="btn-secondary px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            もっと見る
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div className="text-center text-xs text-[var(--yori-ink-soft)] pb-4">
        <button
          type="button"
          onClick={() => {
            refetchProfile()
            setLoadingConversations(true)
            setLoadingDocs(true)
            getConversations(USER_ID, 5, 0)
              .then((data) => setConversations(data))
              .finally(() => setLoadingConversations(false))
            listDocuments(USER_ID)
              .then((items) => setDocumentsCount(items.length))
              .finally(() => setLoadingDocs(false))
          }}
          className="inline-flex items-center gap-1 text-[var(--yori-ink-strong)] font-semibold"
        >
          最新を確認
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
