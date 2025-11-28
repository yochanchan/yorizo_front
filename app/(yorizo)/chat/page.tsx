"use client"

import { ChangeEvent, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, FileUp, SendHorizontal, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChatBubble } from "@/components/ChatBubble"
import {
  guidedChatTurn,
  uploadDocument,
  getConversationDetail,
  type ChatOption,
  type ChatTurnResponse,
  type ConversationDetail,
} from "@/lib/api"

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  content: string
  question?: string
  options?: ChatOption[]
  allowFreeText?: boolean
  step?: number
  done?: boolean
  payload?: {
    type?: "choice" | "free_text"
    choiceId?: string
  }
}

type Attachment = { id: string; filename: string }

const USER_ID = "demo-user"
const DEFAULT_TOTAL_STEPS = 5

const fallbackAssistant: ChatMessage = {
  id: "intro",
  role: "assistant",
  content: "",
  question: "まずは気になっているテーマを教えてください。下のチップを選んでも、自由に入力しても大丈夫です。",
  options: [
    { id: "sales", label: "売上が伸びない", value: "売上が伸び悩んでいる" },
    { id: "cash", label: "資金繰りが不安", value: "資金繰りが不安定" },
    { id: "staff", label: "人手・採用の悩み", value: "人手不足がある" },
    { id: "ops", label: "業務がバタバタしている", value: "業務フローを見直したい" },
  ],
  step: 1,
  done: false,
}

function normalizeUserContent(content: string) {
  if (content.startsWith("[choice_id:")) {
    const idx = content.indexOf("]")
    if (idx !== -1) return content.slice(idx + 1).trim()
  }
  return content
}

function hydrateConversation(detail: ConversationDetail): ChatMessage[] {
  const items: ChatMessage[] = []
  detail.messages.forEach((m) => {
    if (m.role === "assistant") {
      try {
        const parsed = JSON.parse(m.content)
        items.push({
          id: m.id,
          role: "assistant",
          content: parsed.reply ?? parsed.message ?? parsed.content ?? "",
          question: parsed.question ?? "",
          options: parsed.options ?? [],
          allowFreeText: parsed.allow_free_text ?? true,
          step: parsed.step,
          done: parsed.done,
        })
        return
      } catch {
        // fallback below
      }
    }
    items.push({
      id: m.id,
      role: m.role as "assistant" | "user",
      content: m.role === "user" ? normalizeUserContent(m.content) : m.content,
    })
  })
  return items
}

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topic = searchParams.get("topic") || undefined
  const reset = searchParams.get("reset") === "true"
  const initialConversationId = reset ? null : searchParams.get("conversationId")

  const [messages, setMessages] = useState<ChatMessage[]>([fallbackAssistant])
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [bootstrapLoading, setBootstrapLoading] = useState(!!initialConversationId && !reset)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    const load = async () => {
      if (!initialConversationId || reset) {
        setBootstrapLoading(false)
        setMessages([fallbackAssistant])
        setConversationId(null)
        return
      }
      try {
        const data: ConversationDetail = await getConversationDetail(initialConversationId)
        const hydrated = hydrateConversation(data)
        setMessages(hydrated.length > 0 ? hydrated : [fallbackAssistant])
        setConversationId(initialConversationId)
      } catch (err) {
        console.error(err)
        setError("過去の会話を読み込めませんでした。時間をおいて再度お試しください。")
        setMessages([fallbackAssistant])
        setConversationId(null)
      } finally {
        setBootstrapLoading(false)
      }
    }
    load()
  }, [initialConversationId, reset])

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant"),
    [messages],
  )
  const currentStep =
    (lastAssistant?.step ?? messages.filter((m) => m.role === "assistant").length) || 1
  const totalSteps = DEFAULT_TOTAL_STEPS
  const allowFreeText = lastAssistant?.done ? false : (lastAssistant?.allowFreeText ?? true)
  const canSend = allowFreeText && input.trim().length > 0 && !loading
  const done = lastAssistant?.done ?? false

  const appendAssistant = (res: ChatTurnResponse) => {
    const assistantMessage: ChatMessage = {
      id: `assistant-${crypto.randomUUID()}`,
      role: "assistant",
      content: res.reply,
      question: res.question,
      options: res.options ?? [],
      allowFreeText: res.allow_free_text,
      step: res.step,
      done: res.done,
    }
    setMessages((prev) => [...prev, assistantMessage])
    setConversationId(res.conversation_id)
  }

  const sendToBackend = async (payload: {
    message?: string
    selection?: { type: "choice" | "free_text"; id?: string; label?: string; text?: string }
  }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await guidedChatTurn({
        conversation_id: conversationId ?? undefined,
        user_id: USER_ID,
        message: payload.message,
        selection: payload.selection,
        selected_option_id: payload.selection?.id,
        category: topic,
      })
      appendAssistant(res)
      const url = new URL(window.location.href)
      url.searchParams.set("conversationId", res.conversation_id)
      url.searchParams.delete("reset")
      if (topic) url.searchParams.set("topic", topic)
      router.replace(url.toString())
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Yorizoとの通信に失敗しました。時間をおいて再度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  const addUserMessage = (text: string, payload?: ChatMessage["payload"]) => {
    setMessages((prev) => [
      ...prev,
      { id: `user-${crypto.randomUUID()}`, role: "user", content: text, payload },
    ])
  }

  const handleOptionClick = async (option: ChatOption) => {
    if (loading) return
    addUserMessage(option.label, { type: "choice", choiceId: option.id })
    setInput("")
    await sendToBackend({
      message: option.label,
      selection: { type: "choice", id: option.id, label: option.label },
    })
  }

  const handleSend = async () => {
    if (!canSend) return
    const text = input.trim()
    addUserMessage(text, { type: "free_text" })
    setInput("")
    await sendToBackend({ message: text, selection: { type: "free_text", text } })
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const result = await uploadDocument({
        file,
        doc_type: "other",
        period_label: "latest",
        user_id: USER_ID,
        conversation_id: conversationId ?? undefined,
      })
      setAttachments((prev) => [...prev, { id: result.document_id, filename: result.filename }])
    } catch (err) {
      console.error(err)
      setUploadError("ファイルをアップロードできませんでした。10MB以下のPDF/画像/CSV/XLSXに対応しています。")
    } finally {
      setUploading(false)
      if (event.target) event.target.value = ""
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const renderMessage = (msg: ChatMessage) => {
    const isAssistant = msg.role === "assistant"
    const questionText = (msg.question || msg.content || "ご状況を教えてください。").trim()
    const subText =
      msg.question && msg.content && msg.content.trim() !== msg.question.trim()
        ? msg.content
        : ""

    return (
      <div key={msg.id} className="space-y-3">
        <ChatBubble
          role={msg.role}
          bubbleClassName={
            isAssistant
              ? "bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 md:px-5 md:py-4"
              : "text-[var(--yori-primary-ink)] bg-[var(--yori-primary)] rounded-3xl px-4 py-2 ml-auto"
          }
        >
          {isAssistant ? (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500">Yorizoからの質問</p>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                {questionText}
              </p>
              {subText ? (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line line-clamp-3">
                  {subText}
                </p>
              ) : null}
            </div>
          ) : (
            <span className="leading-relaxed whitespace-pre-line">{msg.content}</span>
          )}
        </ChatBubble>
        {isAssistant && msg.options && msg.options.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-2">
            {msg.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-sky-300 hover:bg-sky-50 transition disabled:opacity-60"
                onClick={() => handleOptionClick(opt)}
                disabled={loading || done || lastAssistant?.id !== msg.id}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 pb-20 px-4 md:px-6">
      <div className="flex items-center justify-between text-xs text-[var(--yori-ink-soft)] py-2">
        <span className="inline-flex items-center rounded-full border border-[var(--yori-outline)] bg-white px-3 py-1 font-semibold text-[var(--yori-ink-strong)] shadow-sm">
          ヒアリング
        </span>
        <span className="font-semibold text-[var(--yori-ink-strong)]">
          ステップ {Math.min(currentStep, totalSteps)} / {totalSteps}
        </span>
      </div>

      {bootstrapLoading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--yori-ink-soft)] py-6">
          <div className="h-4 w-4 rounded-full border-2 border-[var(--yori-outline)] border-t-[var(--yori-ink-strong)] animate-spin" />
          <span>会話を読み込み中...</span>
        </div>
      ) : (
        <div className="flex-1 min-h-[320px] space-y-4 overflow-y-auto pr-1">
          {messages.map((m) => renderMessage(m))}
          {loading && (
            <div className="flex justify-start">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs text-[var(--yori-ink-strong)] shadow-sm">
                Yorizoが考えています...
              </span>
            </div>
          )}
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
          <div ref={bottomRef} />
        </div>
      )}

      {done && conversationId && (
        <div className="yori-card p-4 space-y-3">
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">診断内容がまとまりました。</p>
          <button
            type="button"
            onClick={() => router.push(`/report/${conversationId}`)}
            className="btn-primary w-full px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            診断レポートを見る
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">添付済み</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((file) => (
              <span
                key={file.id}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--yori-secondary)] px-3 py-1 text-xs border border-[var(--yori-outline)] shadow-sm"
              >
                <FileUp className="h-4 w-4 text-[var(--yori-ink-soft)]" />
                <span className="max-w-[180px] truncate">{file.filename}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="text-[var(--yori-ink-soft)] hover:text-[var(--yori-ink-strong)]"
                  aria-label="添付を削除"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-[calc(var(--yori-nav-height)+12px)] w-full">
        <div className="yori-card p-3 md:p-4 space-y-2 shadow-[0_18px_46px_rgba(39,35,67,0.18)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-[var(--yori-outline)] bg-[var(--yori-secondary)] text-[var(--yori-ink-strong)]"
              onClick={() => document.getElementById("chat-file-input")?.click()}
              aria-label="資料を添付"
            >
              <FileUp className="h-5 w-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="今の状況やモヤモヤしていることを自由に書いてください"
              rows={2}
              className="flex-1 resize-none rounded-2xl border border-[var(--yori-outline)] bg-white px-4 py-3.5 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
              disabled={!allowFreeText}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white transition-transform ${
                canSend
                  ? "bg-[var(--yori-primary)] text-[var(--yori-primary-ink)] shadow-[0_12px_28px_rgba(255,216,3,0.45)] hover:scale-[1.02]"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
              aria-label="送信"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center justify-between px-1 text-[11px] text-[var(--yori-ink-soft)]">
            <div className="flex items-center gap-2">
              <FileUp className="h-3.5 w-3.5" />
              <span>{uploading ? "アップロード中..." : "決算書やメモなどの資料も一緒に添付できます"}</span>
            </div>
            <input
              id="chat-file-input"
              type="file"
              accept=".pdf,.csv,.xlsx,.xls,.tsv,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-4">チャットを読み込み中...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
