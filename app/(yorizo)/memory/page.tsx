import Link from "next/link"
import { ChevronRight, Folder, Sprout } from "lucide-react"

import { MascotIcon } from "@/components/MascotIcon"
import { CompanyInfoSummaryCard } from "@/components/company/CompanyInfoSummaryCard"
import {
  getCompanyProfile,
  getConversations,
  listDocuments,
  listHomework,
  type CompanyProfile,
  type ConversationSummary,
  type HomeworkTask,
} from "@/lib/api"
import { cleanConversationTitle } from "@/lib/utils"

import { RefreshMemoryButton } from "./RefreshMemoryButton"

const USER_ID = "demo-user"

type MemoryData = {
  profile: CompanyProfile | null
  conversations: ConversationSummary[]
  pendingHomework: HomeworkTask[]
  documentsCount: number
}

async function loadMemoryData(): Promise<MemoryData> {
  const [conversations, pendingHomework, documents, profile] = await Promise.all([
    getConversations(USER_ID, 5, 0).catch(() => [] as ConversationSummary[]),
    listHomework(USER_ID, "pending").catch(() => [] as HomeworkTask[]),
    listDocuments(USER_ID).catch(() => []),
    getCompanyProfile(USER_ID).catch(() => null),
  ])

  return {
    conversations,
    pendingHomework,
    documentsCount: documents.length,
    profile,
  }
}

function formatConversations(conversations: ConversationSummary[]) {
  return conversations.map((conversation) => {
    const dateLabel = conversation.date ? conversation.date.replace(/-/g, "/") : ""
    return { ...conversation, title: cleanConversationTitle(conversation.title), dateLabel }
  })
}

export default async function MemoryPage() {
  const { profile, conversations, pendingHomework, documentsCount } = await loadMemoryData()
  const formattedConversations = formatConversations(conversations)
  const latestConversation = formattedConversations[0]

  const stats = [
    { label: "相談回数", value: `${conversations.length}件` },
    { label: "未完了の宿題", value: `${pendingHomework.length}件` },
    { label: "保存資料", value: `${documentsCount}件` },
  ]

  return (
    <div className="flex flex-col gap-5">
      <section className="yori-card-muted p-5 md:p-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <MascotIcon size="lg" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">Yorizoの記憶</p>
              <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
                これまでの相談内容や会社の情報、宿題をまとめて振り返ることができます。
              </p>
            </div>
          </div>
          <Link
            href="/report"
            className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
          >
            企業向けレポートを見る
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/chat" className="btn-primary px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
            Yorizoと話す
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/homework"
            className="btn-secondary px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            宿題を確認
            <ChevronRight className="h-4 w-4" />
          </Link>
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

      <CompanyInfoSummaryCard profile={profile} />

      <section className="yori-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-[var(--yori-ink-strong)]" />
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">最新の診断</p>
        </div>
        {!latestConversation && (
          <p className="text-sm text-[var(--yori-ink-soft)]">まだ診断はありません。まずはYorizoと話してみましょう。</p>
        )}
        {latestConversation && (
          <div className="yori-card bg-[var(--yori-surface-muted)] p-4 space-y-2">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{latestConversation.title}</p>
            <p className="text-xs text-[var(--yori-ink-soft)]">{latestConversation.dateLabel}</p>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Link
                href={`/report/${latestConversation.id}`}
                className="btn-secondary inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold md:text-base flex-shrink-0 whitespace-nowrap"
              >
                レポートを見る
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/chat?conversationId=${latestConversation.id}`}
                className="btn-ghost inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold md:text-base flex-shrink-0 whitespace-nowrap"
              >
                チャットを開く
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="yori-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-[var(--yori-ink-strong)]" />
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">会社の資料</p>
        </div>
        <p className="text-sm text-[var(--yori-ink)]">保存済み: {documentsCount}件</p>
        <Link href="/documents" className="btn-ghost px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
          資料を管理する
          <ChevronRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="yori-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">これまで相談したこと（最新5件）</p>
        </div>
        <div className="space-y-1">
          {!formattedConversations.length && (
            <div className="flex items-center gap-2 text-xs text-[var(--yori-ink-soft)] px-2 py-3">
              <span>まだ相談履歴がありません。</span>
            </div>
          )}
          {formattedConversations.map((item) => (
            <Link
              key={item.id}
              href={`/chat?conversationId=${item.id}`}
              className="w-full text-left flex items-center justify-between px-2 py-3 border-b border-[var(--yori-outline)] last:border-0 hover:bg-[var(--yori-surface-muted)] rounded-lg transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{item.title}</p>
                <p className="text-xs text-[var(--yori-ink-soft)]">{item.dateLabel}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--yori-ink-soft)]" />
            </Link>
          ))}
        </div>
        <div className="pt-2">
          <Link
            href="/memory/history"
            className="btn-secondary px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            もっと見る
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="text-center text-xs text-[var(--yori-ink-soft)] pb-4">
        <RefreshMemoryButton />
      </div>
    </div>
  )
}
