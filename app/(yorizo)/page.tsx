import Image from "next/image"
import Link from "next/link"
import { CheckSquare, FileText, LineChart, MessageCircle } from "lucide-react"

import { YoriCard } from "@/components/YoriCard"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import { UseGuideAccordion } from "./components/UseGuideAccordion"
import { getConversations, type ConversationSummary } from "@/lib/api"

const USER_ID = "demo-user"

async function fetchLatestConversation(): Promise<ConversationSummary | null> {
  try {
    const conversations = await getConversations(USER_ID, 1, 0)
    return conversations?.[0] ?? null
  } catch (err) {
    console.error("latest conversation fetch failed", err)
    return null
  }
}

export default async function HomePage() {
  const latestConversation = await fetchLatestConversation()
  const memoLink = latestConversation ? `/memory/${latestConversation.id}/memo` : null
  const pastConversationLink = "/memory/history"

  return (
    <div className="flex flex-col gap-6 md:gap-8 py-4 pb-4">
      <section className="yori-card-muted p-5 md:p-6">
        <div className="flex items-start gap-4">
          <YorizoAvatar mood="thinking" size="lg" className="shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">今日はどんな気分？</p>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              小さなモヤモヤもそのまま話してOKです。気軽に一言から始めてみましょう。
            </p>
          </div>
        </div>
      </section>

      <section className="yori-card p-5 md:p-6 space-y-3">
        <YoriCard
          variant="primaryLink"
          title="Yorizoとチャットで話す"
          href="/chat?reset=true"
          icon={<MessageCircle className="h-5 w-5" />}
          className="block w-full"
        />
        <div className="flex justify-end">
          <Link
            href={pastConversationLink}
            className="text-sm font-semibold text-[var(--yori-ink-strong)] underline-offset-4 hover:underline"
          >
            過去の会話はこちら→
          </Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <YoriCard
          variant="link"
          title="ToDoを確認"
          description="未完了タスクをチェック"
          href="/homework"
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <YoriCard
          variant="link"
          title="イマココレポートを見る"
          description="会社の「いま」をまとめたレポート"
          href="/report"
          icon={<LineChart className="h-5 w-5" />}
        />
        <YoriCard
          variant="link"
          title="相談メモを開く"
          description="最新の相談メモを開きます"
          href={memoLink ?? "/memory"}
          icon={<FileText className="h-5 w-5" />}
        >
          {!memoLink && (
            <p className="text-xs text-[var(--yori-ink-soft)]">
              まだ会話がありません。まずは Yorizo と話してみましょう。
            </p>
          )}
        </YoriCard>
      </section>

      <UseGuideAccordion />

      <section className="mt-2 mb-10">
        <div className="flex flex-wrap items-center justify-center gap-6 px-4">
          <Image
            src="/logos/METI.png"
            alt="経済産業省ロゴ"
            width={220}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
          <Image
            src="/logos/CHUKICHO.png"
            alt="中小企業庁ロゴ"
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
      </section>
    </div>
  )
}
