import Link from "next/link"
import { ChevronRight, Folder, LineChart, MessageCircle, NotebookPen, Sprout } from "lucide-react"

import { YoriCard } from "@/components/YoriCard"
import { YorizoAvatar } from "@/components/YorizoAvatar"
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
    { label: "相談数", value: `${conversations.length}件` },
    { label: "未完了のToDo", value: `${pendingHomework.length}件` },
    { label: "保存ドキュメント", value: `${documentsCount}件` },
  ]

  return (
    <div className="flex flex-col gap-5">
      <section className="yori-card-muted p-5 md:p-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <YorizoAvatar size="lg" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">Yorizo の記録</p>
              <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
                これまでの相談内容や会社の情報、ToDoをまとめて振り返れます。次に進む前に「どこまで話したか」を整理しましょう。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <YoriCard variant="primaryLink" title="チャットを再開する" href="/chat" icon={<MessageCircle className="h-5 w-5" />} />
        <YoriCard
          variant="link"
          title="ToDoを確認"
          description="未完了タスクをチェックして次の一歩を決める"
          href="/homework"
          icon={<NotebookPen className="h-5 w-5" />}
        />
        <YoriCard
          variant="link"
          title="イマココレポート"
          description="診断と相談メモをまとめて俯瞰"
          href="/report"
          icon={<LineChart className="h-5 w-5" />}
        />
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
          <YoriCard
            variant="info"
            title="まだ診断がありません"
            description="まずは Yorizo と話して、相談メモを作成しましょう。"
          />
        )}
        {latestConversation && (
          <YoriCard
            variant="info"
            title={latestConversation.title}
            description={latestConversation.dateLabel || "最新の相談"}
            icon={<LineChart className="h-5 w-5" />}
          >
            <p className="text-xs text-[var(--yori-ink-soft)]">相談メモとToDoのまとめを開きます。</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/chat?conversationId=${latestConversation.id}`}
                className="btn-ghost inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold md:text-sm"
              >
                チャットを開く
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/report/${latestConversation.id}`}
                className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold md:text-sm"
              >
                レポートを見る
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </YoriCard>
        )}
      </section>

      <section className="yori-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-[var(--yori-ink-strong)]" />
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">会社のドキュメント</p>
        </div>
        <p className="text-sm text-[var(--yori-ink)]">保存済み: {documentsCount}件</p>
        <YoriCard
          variant="link"
          title="ドキュメントを管理する"
          description="決算書や試算表などをアップロードできます。"
          href="/documents"
          icon={<Folder className="h-5 w-5" />}
        />
      </section>

      <section className="yori-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">これまで相談したこと（最新 5 件）</p>
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
