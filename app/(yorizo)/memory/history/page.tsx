import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { YorizoAvatar } from "@/components/YorizoAvatar"
import { getConversations, type ConversationSummary } from "@/lib/api"
import { cleanConversationTitle } from "@/lib/utils"

const USER_ID = "demo-user"
const HISTORY_LIMIT = 50

function formatItems(conversations: ConversationSummary[]) {
  return conversations.map((conversation) => {
    const dateLabel = conversation.date ? conversation.date.replace(/-/g, "/") : ""
    return { ...conversation, title: cleanConversationTitle(conversation.title), dateLabel }
  })
}

export default async function ChatHistoryPage() {
  let items: ReturnType<typeof formatItems> = []
  let error: string | null = null

  try {
    const conversations = await getConversations(USER_ID, HISTORY_LIMIT, 0)
    items = formatItems(conversations)
  } catch (err) {
    console.error(err)
    error = "チャット履歴を取得できませんでした。"
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="yori-card-muted p-5 md:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <YorizoAvatar mood="satisfied" size="sm" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">チャット履歴</p>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              これまで乗り越えてきたことも思い出されますね
            </p>
          </div>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </section>

      <section className="yori-card p-5 space-y-3">
        {!error && items.length === 0 && (
          <div className="text-sm text-[var(--yori-ink-soft)]">まだチャット履歴がありません。</div>
        )}

        {!!items.length && (
          <div className="divide-y divide-[var(--yori-outline)]">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/chat?conversationId=${encodeURIComponent(item.id)}`}
                className="flex items-center justify-between gap-3 px-2 py-3 hover:bg-[var(--yori-surface-muted)] rounded-lg transition-colors"
                aria-label={`${item.title} を開く`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--yori-ink-strong)] truncate">{item.title}</p>
                  <p className="text-xs text-[var(--yori-ink-soft)]">{item.dateLabel}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--yori-ink-soft)]" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
