import Image from "next/image"
import { FileText, LineChart, MessageCircle, NotebookPen, Sparkles } from "lucide-react"
import { Fragment } from "react"

import { YoriCard } from "@/components/YoriCard"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import { getConversations, type ConversationSummary } from "@/lib/api"

const USER_ID = "demo-user"
const CONNECTOR_COLOR = "#C8CDD5"

const STEP_ITEMS = [
  {
    title: "Yorizoと話す",
    description: "モヤモヤや背景をそのまま話すだけで、選択肢とテキスト入力で整理できます。",
  },
  {
    title: "イマココレポート",
    description: "チャット・宿題・PDFをまとめて“いま”を俯瞰します。次の一歩もここから。",
  },
  {
    title: "相談メモ",
    description: "よろず支援窓口や専門家に渡せる 1 枚メモ。自分で進めるアクションのログも保存。",
  },
]

function StepConnector() {
  return (
    <span
      aria-hidden
      data-testid="home-step-connector"
      data-mobile-orientation="down"
      className="block h-0 w-0 rotate-90 md:rotate-0 border-y-[7px] border-y-transparent border-l-[14px] flex-shrink-0 self-center"
      style={{ borderLeftColor: CONNECTOR_COLOR }}
    />
  )
}

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
  const memoLink = latestConversation ? `/report/${latestConversation.id}` : null

  return (
    <div className="flex flex-col gap-8 md:gap-10 py-4 pb-24">
      <section className="yori-card-muted p-6 md:p-8 space-y-6">
        <div className="flex flex-col gap-4 text-center">
          <div className="flex justify-center">
            <YorizoAvatar size="lg" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--yori-ink-soft)]">まずはモヤモヤを受け止める場所</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--yori-ink-strong)]">
              Yorizoと話して「いま」を見直し、次の一歩へ
            </h1>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              話す → イマココレポートで俯瞰する → 相談メモで人に渡す。小さなステップを積み重ねるためのハブです。
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-4">
          {STEP_ITEMS.map((item, index) => (
            <Fragment key={item.title}>
              <YoriCard
                variant="info"
                title={item.title}
                description={item.description}
                className="flex-1 w-full"
              />
              {index < STEP_ITEMS.length - 1 && <StepConnector />}
            </Fragment>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <YoriCard
          variant="primaryLink"
          title="チャットを始める"
          href="/chat?reset=true"
          icon={<MessageCircle className="h-5 w-5" />}
        />
        <YoriCard
          variant="primaryLink"
          title="かんたんチェックをはじめる"
          href="/wizard"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <YoriCard
          variant="link"
          title="イマココレポートを見る"
          description="診断スコアと相談メモ、宿題を 1 枚で確認できます。"
          href="/report"
          icon={<LineChart className="h-5 w-5" />}
        />
        <YoriCard
          variant="link"
          title="相談メモを開く"
          description="よろず相談や専門家に渡せるダイジェスト。"
          href={memoLink ?? "/memory"}
          icon={<FileText className="h-5 w-5" />}
        >
          {!memoLink && <p className="text-xs text-[var(--yori-ink-soft)]">まだ会話がありません。まずは Yorizo と話してみましょう。</p>}
        </YoriCard>
      </section>
      <section className="yori-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-[var(--yori-ink-strong)]" />
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">3 ステップで頭と心を整える</p>
        </div>
        <ul className="space-y-2 text-sm text-[var(--yori-ink)]">
          <li>1. チャットでモヤモヤを言語化する</li>
          <li>2. イマココレポートで数値と定性を俯瞰する</li>
          <li>3. 相談メモで「人に渡せる台本」に仕上げる</li>
        </ul>
      </section>

      <section className="mt-2 mb-10">
        <div className="flex flex-wrap items-center justify-center gap-6 px-4">
          <Image
            src="/logos/METI.png"
            alt="経済産業省"
            width={220}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
          <Image
            src="/logos/CHUKICHO.png"
            alt="中小企業庁"
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
