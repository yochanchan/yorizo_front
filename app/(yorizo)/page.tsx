import Image from "next/image"
import Link from "next/link"
import { ArrowRight, FileText, LineChart, NotebookPen } from "lucide-react"

import { MascotIcon } from "@/components/MascotIcon"
import { getConversations, type ConversationSummary } from "@/lib/api"

const USER_ID = "demo-user"

const STEP_ITEMS = [
  {
    title: "Yorizoと話す",
    description: "モヤモヤや感情ベースの悩みをそのまま吐き出してOK。選択肢と自由入力で整理できます。",
  },
  {
    title: "イマココレポート",
    description: "チャット・宿題・PDFをもとに、ローカルベンチマーク風に“いま”を俯瞰します。",
  },
  {
    title: "相談メモ",
    description: "よろず支援や商工会の担当者に渡せる1枚メモ。自己解決アクションのログもここに。",
  },
]

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
            <MascotIcon size="lg" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--yori-ink-soft)]">まずはモヤモヤを受け止める場所</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--yori-ink-strong)]">
              Yorizoと話して「いま」を見直し、次の一歩へ
            </h1>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              モヤモヤを吐き出す → イマココレポートで俯瞰する → 相談メモで人に渡す。経営者の頭と心の整理を、この3ステップでデザインしました。
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/chat?reset=true"
            className="btn-primary w-full md:w-auto px-8 py-4 text-base font-semibold inline-flex items-center justify-center gap-2"
          >
            Yorizoと話す
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/memory"
            className="text-sm font-semibold text-[var(--yori-ink-strong)] underline underline-offset-4"
          >
            過去の会話メモをひらく
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3 text-left">
          {STEP_ITEMS.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--yori-outline)] bg-white/70 p-4 space-y-1">
              <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{item.title}</p>
              <p className="text-xs text-[var(--yori-ink)] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/report" className="yori-card p-5 text-left space-y-2 transition hover:shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--yori-ink-soft)]">
            <LineChart className="h-4 w-4" />
            イマココレポートを見る
          </div>
          <p className="text-base font-bold text-[var(--yori-ink-strong)]">ローカルベンチマーク風の“いま”の鏡</p>
          <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
            売上持続性・収益性など6指標＋定性的コメントで、会社の立ち位置と考えるべき問いを俯瞰できます。
          </p>
        </Link>

        <Link
          href={memoLink ?? "/memory"}
          className="yori-card p-5 text-left space-y-2 transition hover:shadow-lg disabled:opacity-60"
          aria-disabled={!memoLink}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--yori-ink-soft)]">
            <FileText className="h-4 w-4" />
            相談メモをひらく
          </div>
          <p className="text-base font-bold text-[var(--yori-ink-strong)]">よろず・商工会に持っていく“台本”</p>
          <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
            チャットで整理した内容と自己解決アクションのログを1枚にまとめ、人に説明する準備を整えます。
          </p>
          {!memoLink && (
            <p className="text-xs text-[var(--yori-ink-soft)]">
              まだ会話がありません。まずはYorizoと話してみましょう。
            </p>
          )}
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--yori-ink-soft)]">機能</h2>
        <div className="yori-card p-5 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="flex items-start gap-3 flex-1">
            <MascotIcon size="sm" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-[var(--yori-ink-strong)]">経営のモヤモヤ かんたんチェック</p>
              <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
                短いガイド付きチャットで今の状況をざっくり整理できます。初めて相談する前のウォームアップに最適です。
              </p>
            </div>
          </div>
          <Link
            href="/wizard"
            className="btn-secondary w-full md:w-auto px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            かんたんチェックをはじめる
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="yori-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-[var(--yori-ink-strong)]" />
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">3ステップで頭と心を整える</p>
        </div>
        <ul className="space-y-2 text-sm text-[var(--yori-ink)]">
          <li>1. チャットでモヤモヤを言語化する（生データの倉庫）</li>
          <li>2. イマココレポートで数値と定性を俯瞰し、気づきを得る</li>
          <li>3. 相談メモで “人に渡せる台本” に仕上げる</li>
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
