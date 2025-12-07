"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { getConversationDetail, type ConversationDetail } from "@/lib/api"

type AssistantPayload = {
  reply?: string
  question?: string
  options?: { id: string; label: string; value?: string | null }[]
  cta_buttons?: { id: string; label: string; action?: string }[]
  allow_free_text?: boolean
  step?: number
  done?: boolean
}

const cleanChoicePrefix = (text: string | null | undefined) => {
  const trimmed = (text ?? "").trim()
  return trimmed.replace(/^\[choice_id:[^\]]+\]\s*/i, "")
}

function parseAssistantContent(raw: string): AssistantPayload | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") {
      return parsed as AssistantPayload
    }
  } catch {
    // ignore
  }
  return null
}

type MessageCardProps = {
  role: string
  content: string
  createdAt?: string | null
}

function MessageCard({ role, content, createdAt }: MessageCardProps) {
  const parsed = role !== "user" ? parseAssistantContent(content) : null
  const label = role === "user" ? "相談者" : role === "assistant" ? "Yorizo" : role
  const timestamp = createdAt ? new Date(createdAt).toLocaleString("ja-JP") : ""

  const displayContent = role === "user" ? cleanChoicePrefix(content) : content

  if (parsed) {
    return (
      <div className="rounded-2xl border px-3 py-2 text-sm leading-relaxed bg-white border-slate-200 text-slate-800">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span className="font-semibold">{label}</span>
          <span>{timestamp}</span>
        </div>
        {parsed.reply && (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">回答</p>
            <p className="whitespace-pre-line">{parsed.reply}</p>
          </div>
        )}
        {parsed.question && (
          <div className="space-y-1 mt-2">
            <p className="text-xs text-slate-500">質問</p>
            <p className="whitespace-pre-line font-semibold text-slate-900">{parsed.question}</p>
          </div>
        )}
        {parsed.options && parsed.options.length > 0 && (
          <div className="space-y-1 mt-2">
            <p className="text-xs text-slate-500">選択肢</p>
            <div className="flex flex-wrap gap-2">
              {parsed.options.map((opt) => (
                <span
                  key={opt.id}
                  className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 px-3 py-1 text-[12px] border border-slate-200"
                >
                  {opt.label}
                </span>
              ))}
            </div>
          </div>
        )}
        {parsed.cta_buttons && parsed.cta_buttons.length > 0 && (
          <div className="space-y-1 mt-2">
            <p className="text-xs text-slate-500">アクション</p>
            <div className="flex flex-wrap gap-2">
              {/* Admin-visible only: keep CTA buttons for LLM output inspection; end-user /chat UI does not render them. */}
              {parsed.cta_buttons.map((cta) => (
                <span
                  key={cta.id}
                  className="inline-flex items-center rounded-full bg-[#13274B]/10 text-[#13274B] px-3 py-1 text-[12px] border border-[#13274B]/30"
                >
                  {cta.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border px-3 py-2 text-sm leading-relaxed ${
        role === "user"
          ? "bg-[#13274B]/5 border-[#13274B]/20 text-slate-900"
          : "bg-white border-slate-200 text-slate-800"
      }`}
    >
      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
        <span className="font-semibold">{label}</span>
        <span>{timestamp}</span>
      </div>
      <p className="whitespace-pre-line">{displayContent}</p>
    </div>
  )
}

export default function AdminConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const router = useRouter()
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!conversationId) return
      setLoading(true)
      setError(null)
      try {
        const data = await getConversationDetail(conversationId)
        setDetail(data)
      } catch (err) {
        console.error(err)
        setError("会話を取得できませんでした。")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [conversationId])

  return (
    <div className="w-full px-6 md:px-10 py-8 md:py-12 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#13274B]"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </button>
          <div className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
            管理者ビュー（会話ログ）
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            会話を読み込み中...
          </div>
        )}
        {error && <p className="text-xs text-rose-600">{error}</p>}

        {detail && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 space-y-2">
              <p className="text-xs text-slate-500">会話ID: {detail.id}</p>
              <h1 className="text-xl font-bold text-slate-900">{cleanChoicePrefix(detail.title) || "相談"}</h1>
              <p className="text-xs text-slate-500">
                開始: {detail.started_at ? new Date(detail.started_at).toLocaleString("ja-JP") : "-"}
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">メッセージ</h2>
              <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
                {detail.messages.length === 0 && (
                  <p className="text-sm text-slate-500">メッセージがありません。</p>
                )}
                {detail.messages.map((m) => (
                  <MessageCard key={m.id} role={m.role} content={m.content} createdAt={m.created_at} />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
