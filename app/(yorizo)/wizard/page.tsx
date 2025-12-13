"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react"

import { YoriCard } from "@/components/YoriCard"
import { VoiceInputControls } from "@/components/voice/VoiceInputControls"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import { ThinkingRow } from "@/components/ThinkingRow"

type Question = {
  id: string
  category: string
  title: string
  description?: string
  type: "choice" | "scale" | "text"
  options?: string[]
  voiceEnabled?: boolean
}

const LIKERT = ["まったくそう思わない", "あまりそう思わない", "どちらとも言えない", "だいたいそう思う", "とてもそう思う"]

const QUESTIONS: Question[] = [
  {
    id: "industry",
    category: "基礎情報",
    title: "業種を教えてください",
    description: "当てはまるものを 1 つ選んでください。",
    type: "choice",
    options: ["製造", "小売・飲食", "サービス", "IT/DX", "建設・不動産", "その他"],
  },
  {
    id: "size",
    category: "基礎情報",
    title: "従業員数はどのくらいですか？",
    type: "choice",
    options: ["1-5 名", "6-20 名", "21-50 名", "51 名以上"],
  },
  {
    id: "area",
    category: "基礎情報",
    title: "主なエリアはどこですか？",
    type: "choice",
    options: ["北海道・東北", "関東", "中部", "近畿", "中国・四国", "九州・沖縄"],
  },
  {
    id: "management_direction",
    category: "経営",
    title: "事業の方向性は明確ですか？",
    description: "将来像や柱となる事業が言語化されているかどうか。",
    type: "scale",
  },
  {
    id: "team",
    category: "組織運営",
    title: "役割分担や任せ方に自信はありますか？",
    type: "scale",
  },
  {
    id: "business_model",
    category: "事業構造",
    title: "利益の出る仕組みを把握できていますか？",
    type: "scale",
  },
  {
    id: "communication",
    category: "コミュニケーション",
    title: "社内外で情報共有はスムーズですか？",
    type: "scale",
  },
  {
    id: "finance",
    category: "財務・DX",
    title: "資金繰りや数値の見える化に不安はありますか？",
    description: "会計データやキャッシュフローをどれくらい追えているか。",
    type: "scale",
  },
  {
    id: "current_state",
    category: "自由記述",
    title: "今の会社の状況を一言で教えてください",
    description: "気になっていることや感じていることを書き留めてください。",
    type: "text",
    voiceEnabled: true,
  },
  {
    id: "pain_point",
    category: "自由記述",
    title: "モヤモヤしていることは何ですか？",
    description: "具体的に気になっている出来事や数字があれば書いてください。",
    type: "text",
    voiceEnabled: true,
  },
]

type Summary = { title: string; description: string; nextSteps: string[] }

function buildSummary(answers: Record<string, string>): Summary {
  const concern = answers.pain_point || answers.management_direction || "";
  if (concern.includes("売上")) {
    return {
      title: "売上の伸び悩みが気になりますね。",
      description: "客数・単価・回数に分けて現状を整理すると、次の施策が見えやすくなります。",
      nextSteps: ["直近3か月の客数・単価・回数をメモする", "粗利率が高い商品・サービスを3つ挙げる", "既存顧客向けの再来店施策を1つ決める"],
    }
  }
  if (concern.includes("資金") || concern.includes("現金")) {
    return {
      title: "資金繰りの不安が大きいようです。",
      description: "入出金のタイミングを可視化し、固定費を先に確保することから始めましょう。",
      nextSteps: ["今月と来月の入出金カレンダーを作る", "固定費と変動費を分けて書き出す", "支払サイト・入金サイトを確認する"],
    }
  }
  return {
    title: "モヤモヤを整理して次の一歩を決めましょう。",
    description: "気になっていることを1つに絞り、事実・数字・感じていることに分けて整理すると考えやすくなります。",
    nextSteps: ["悩みを一行で書き出す", "背景となる事実を3つ挙げる", "明日できる小さな一歩を1つ決める"],
  }
}

export default function WizardPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [textValue, setTextValue] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [thinking, setThinking] = useState(false)
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const total = QUESTIONS.length
  const current = QUESTIONS[currentIndex]

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const percent = Math.min(100, Math.round((Math.max(currentIndex, answeredCount) / total) * 100))
  const summary = useMemo(() => buildSummary(answers), [answers])

  useEffect(() => {
    if (current.type === "text") {
      setTextValue(answers[current.id] ?? "")
    } else {
      setTextValue("")
    }
  }, [current.id, current.type, currentIndex, answers])

  const goNext = () => {
    if (currentIndex >= total - 1) {
      setDone(true)
      return
    }
    setCurrentIndex((prev) => Math.min(prev + 1, total - 1))
  }

  const clearThinkingTimer = () => {
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current)
      thinkingTimerRef.current = null
    }
  }

  const startThinkingTransition = (delay = 260) => {
    clearThinkingTimer()
    setThinking(true)
    thinkingTimerRef.current = setTimeout(() => {
      goNext()
      setThinking(false)
      thinkingTimerRef.current = null
    }, delay)
  }

  useEffect(
    () => () => {
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current)
      }
    },
    [],
  )

  const goPrev = () => {
    setError("")
    clearThinkingTimer()
    setThinking(false)
    if (currentIndex === 0) return
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleAnswer = (value: string) => {
    if (thinking) return
    setError("")
    setAnswers((prev) => ({ ...prev, [current.id]: value }))
    if (current.type !== "text") {
      startThinkingTransition()
    }
  }

  const handleSubmitText = () => {
    if (thinking) return
    if (!textValue.trim()) {
      setError("内容を入力してください。")
      return
    }
    const nextValue = textValue.trim()
    setError("")
    setAnswers((prev) => ({ ...prev, [current.id]: nextValue }))
    startThinkingTransition(320)
  }

  const resetWizard = () => {
    clearThinkingTimer()
    setThinking(false)
    setAnswers({})
    setTextValue("")
    setCurrentIndex(0)
    setDone(false)
    setError("")
  }

  if (done) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 pb-24 px-4 md:px-6">
        <div className="yori-card-muted p-5 md:p-6 flex flex-col gap-4 items-center text-center">
          <YorizoAvatar mood="satisfied" size="lg" />
          <p className="text-sm font-semibold text-[var(--yori-ink-soft)]">診断おつかれさまでした！</p>
          <h2 className="text-xl font-bold text-[var(--yori-ink-strong)]">イマココを 1 枚にまとめました</h2>
          <p className="text-sm text-[var(--yori-ink)] max-w-xl leading-relaxed">{summary.description}</p>
        </div>

        <div className="yori-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--yori-ink-strong)]">
            <Sparkles className="h-4 w-4" /> 次の一歩
          </div>
          <ul className="space-y-2">
            {summary.nextSteps.map((step) => (
              <li key={step} className="flex items-start gap-2 text-sm text-[var(--yori-ink)]">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => router.push("/chat?reset=true")}
            className="btn-primary w-full px-4 py-3 text-sm font-semibold inline-flex items-center justify-center"
          >
            チャットを始める
          </button>
          <button
            type="button"
            onClick={() => router.push("/report")}
            className="btn-secondary w-full px-4 py-3 text-sm font-semibold inline-flex items-center justify-center"
          >
            イマココレポートを見る
          </button>
          <button
            type="button"
            onClick={() => router.push("/homework")}
            className="btn-ghost w-full px-4 py-3 text-sm font-semibold inline-flex items-center justify-center"
          >
            ToDoを確認する
          </button>
        </div>

        <div className="text-center text-xs text-[var(--yori-ink-soft)]">
          <button type="button" onClick={resetWizard} className="underline underline-offset-4">
            もう一度診断する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-24 px-4 md:px-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          className="inline-flex items-center gap-2 text-sm text-[var(--yori-ink)]"
          aria-label="前の質問に戻る"
        >
          <ArrowLeft className="h-4 w-4" /> もどる
        </button>
        <div className="text-xs text-[var(--yori-ink-soft)] font-semibold">カテゴリ: {current.category}</div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">ステップ {currentIndex + 1} / {total}</p>
        <div className="h-2 w-full rounded-full bg-[var(--yori-surface-muted)] overflow-hidden">
          <div
            className="h-2 rounded-full bg-[var(--yori-primary)] transition-all"
            style={{ width: `${percent}%` }}
            aria-label="進捗率"
          />
        </div>
      </div>

      <div className="yori-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <YorizoAvatar mood={current.type === "text" ? "asking" : "thinking"} size="sm" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-[var(--yori-ink-soft)]">{current.category}</p>
            <h2 className="text-xl font-bold text-[var(--yori-ink-strong)] leading-snug">{current.title}</h2>
            {current.description && (
              <p className="text-sm text-[var(--yori-ink)] leading-relaxed">{current.description}</p>
            )}
          </div>
        </div>

        {current.type === "choice" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {current.options?.map((option) => {
              const selected = answers[current.id] === option
              return (
                <YoriCard
                  key={option}
                  variant="choiceRequired"
                  title={option}
                  selected={selected}
                  onClick={() => handleAnswer(option)}
                  className="w-full"
                />
              )
            })}
          </div>
        )}

        {current.type === "scale" && (
          <div className="grid grid-cols-1 gap-2">
            {LIKERT.map((label, idx) => {
              const value = `${idx + 1}:${label}`
              const selected = answers[current.id] === value
              return (
                <YoriCard
                  key={label}
                  variant="choiceRequired"
                  title={label}
                  selected={selected}
                  onClick={() => handleAnswer(value)}
                  className="w-full"
                />
              )
            })}
          </div>
        )}

        {current.type === "text" && (
          <div className="space-y-3">
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="w-full min-h-[140px] rounded-2xl border border-[var(--yori-outline)] bg-[var(--yori-surface-muted)] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
              placeholder="具体的な状況や数字、感じていることを書き留めてください"
            />
            {current.voiceEnabled && (
              <VoiceInputControls
                onTranscript={(text) => setTextValue(text)}
                onStatusChange={(s) => s === "recording" && setError("")}
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="btn-ghost flex-1 px-4 py-3 text-sm font-semibold"
              >
                もどる
              </button>
              <button
                type="button"
                onClick={handleSubmitText}
                className="btn-primary flex-1 px-4 py-3 text-sm font-semibold"
              >
                次へ進む
              </button>
            </div>
          </div>
        )}

        {thinking && (
          <div className="rounded-2xl bg-[var(--yori-secondary)] px-3 py-2">
            <ThinkingRow
              text="Yorizoが回答を整理しています..."
              className="text-xs text-[var(--yori-ink-strong)]"
              gap="compact"
            />
          </div>
        )}

        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </div>
  )
}
