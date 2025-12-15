"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react"
import clsx from "clsx"
import { ArrowRight, ChevronDown, FileUp, SendHorizontal, X } from "lucide-react"
import { useRouter } from "next/navigation"


import { ChatBubble } from "@/components/ui/chat-bubble"
import { ChatQuickOptions } from "@/components/ui/chat-quick-options"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import { ThinkingRow } from "@/components/ThinkingRow"
import { ChatSpeechInput } from "@/components/voice/ChatSpeechInput"
import {
  ApiError,
  LLM_FALLBACK_MESSAGE,
  getConversationDetail,
  guidedChatTurn,
  uploadDocument,
  type ChatOption,
  type ChatTurnResponse,
  type ConversationDetail,
  type KnowledgeHit,
} from "@/lib/api"

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  content: string
  answer?: string | null
  question?: string
  options?: ChatOption[]
  allowFreeText?: boolean
  step?: number
  done?: boolean
  hits?: KnowledgeHit[] | null
  payload?: {
    type?: "choice" | "free_text"
    choiceId?: string
  }
}

type ExampleCard = {
  no: number
  title: string
  situation?: string
  action?: string
  steps?: string
  caution?: string
  source?: string
}

type ParsedExamples = {
  examples: ExampleCard[]
  references: string[]
  intro: string
}

type Attachment = { id: string; filename: string }

type ChatClientProps = {
  topic?: string
  initialConversationId?: string | null
  reset?: boolean
}

const USER_ID = "demo-user"
const DEFAULT_TOTAL_STEPS = 5

const FALLBACK_ASSISTANT: ChatMessage = {
  id: "intro",
  role: "assistant",
  content: "",
  question: "気になるテーマを選んでください。どれも当てはまらなければ「その他」を選んでください。",
  options: [
    { id: "sales", label: "売上が不安", value: "売上が不安" },
    { id: "cash", label: "資金繰り", value: "資金繰り" },
    { id: "staff", label: "採用・スタッフ", value: "採用・スタッフ" },
    { id: "ops", label: "業務の回し方", value: "業務の回し方" },
    { id: "other", label: "その他", value: "その他" },
  ],
  step: 0,
  done: false,
}

function clampStep(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return null
  return Math.min(DEFAULT_TOTAL_STEPS, Math.max(0, value))
}

function deriveStep(incoming: number | null | undefined, current: number) {
  const clamped = clampStep(incoming)
  if (clamped !== null) return clamped
  return Math.min(DEFAULT_TOTAL_STEPS, current + 1)
}

function normalizeUserContent(content: string) {
  if (content.startsWith("[choice_id:")) {
    const idx = content.indexOf("]")
    if (idx !== -1) return content.slice(idx + 1).trim()
  }
  return content
}

const NUM_EMOJI: Record<number, string> = { 1: "1️⃣", 2: "2️⃣", 3: "3️⃣" }
const LABEL_GROUPS = {
  situation: ["状況", "背景"],
  action: ["打ち手", "施策", "対応"],
  steps: ["手順", "進め方", "方法"],
  caution: ["注意点", "留意点"],
  source: ["出典", "参考", "参照"],
}
const ALL_LABEL_WORDS = Object.values(LABEL_GROUPS).flat()

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function stripMarkdown(text: string): string {
  if (!text) return ""
  let out = text
  out = out.replace(/^\s*#{1,6}\s*/gm, "")
  out = out.replace(/\*\*/g, "")
  out = out.replace(/^\s*[-*]\s?/gm, "")
  out = out.replace(/^-{3,}\s*$/gm, "")
  out = out.replace(/\n{3,}/g, "\n\n")
  return out.trim()
}

function emojiForNo(no: number) {
  return NUM_EMOJI[no] ?? `${no}`
}

function extractSection(block: string, keys: string[]): string | undefined {
  if (!block) return undefined
  const labelPattern = keys.map(escapeRegExp).join("|")
  const nextPattern = ALL_LABEL_WORDS.map(escapeRegExp).join("|")
  const regex = new RegExp(
    `(?:${labelPattern})\\s*[：:】]\\s*(.*?)(?=(?:${nextPattern})\\s*[：:】]|$)`,
    "s",
  )
  const match = block.match(regex)
  const value = match?.[1]?.trim()
  return value || undefined
}

function parseExamples(answer: string): ParsedExamples {
  if (!answer) return { examples: [], references: [], intro: "" }

  const refHeading = "参照した出典一覧"
  let clean = stripMarkdown(answer)
  const references: string[] = []

  const refIndex = clean.indexOf(refHeading)
  if (refIndex !== -1) {
    const refBody = clean.slice(refIndex).replace(/参照した出典一覧[：:]?/, "")
    clean = clean.slice(0, refIndex)
    refBody
      .split(/\n+/)
      .map((line) => line.replace(/^[\-\u30fb•\s]+/, "").trim())
      .filter(Boolean)
      .forEach((line) => references.push(line))
  }

  const marker = /事例\s*(?:[1-3]|[１２３]|\u2460|\u2461|\u2462|[1-3]\uFE0F?\u20E3)?[：:]/g
  const positions: number[] = []
  let m: RegExpExecArray | null
  while ((m = marker.exec(clean))) {
    positions.push(m.index)
  }

  if (positions.length === 0) {
    return { examples: [], references, intro: clean.trim() }
  }

  const examples: ExampleCard[] = []
  const intro = clean.slice(0, positions[0]).trim()

  for (let i = 0; i < positions.length; i += 1) {
    const start = positions[i]
    const end = positions[i + 1] ?? clean.length
    const block = clean.slice(start, end).trim()
    if (!block) continue

    const numMatch = block.match(/事例\s*(\u2460|\u2461|\u2462|[1-3]|[１２３]|[1-3]\uFE0F?\u20E3)?/)
    const rawNo = numMatch?.[1]
    const noMap: Record<string, number> = {
      "\u2460": 1,
      "\u2461": 2,
      "\u2462": 3,
      "１": 1,
      "２": 2,
      "３": 3,
      "1\uFE0F\u20E3": 1,
      "2\uFE0F\u20E3": 2,
      "3\uFE0F\u20E3": 3,
    }
    const derivedNo = rawNo ? noMap[rawNo] ?? Number(rawNo.replace(/\D/g, "")) : undefined
    const no = derivedNo && derivedNo >= 1 ? derivedNo : examples.length + 1

    const titleMatch = block.match(
      /事例\s*(?:\u2460|\u2461|\u2462|[1-3]|[１２３]|[1-3]\uFE0F?\u20E3)?[：:]\s*(.+?)(?:\n|$)/,
    )
    const title = (titleMatch?.[1] || "").trim() || "売上拡大につながった事例"

    const situation = extractSection(block, LABEL_GROUPS.situation)
    const action = extractSection(block, LABEL_GROUPS.action)
    const steps = extractSection(block, LABEL_GROUPS.steps)
    const caution = extractSection(block, LABEL_GROUPS.caution)
    const source = extractSection(block, LABEL_GROUPS.source)

    examples.push({ no, title, situation, action, steps, caution, source })
  }

  return { examples, references, intro }
}

export const appendTranscript = (prev: string, t: string) => {
  const next = t.trim()
  if (!next) return prev
  const base = prev.replace(/\s*$/, "")
  return base ? `${base} ${next}` : next
}

function hydrateConversation(detail: ConversationDetail): ChatMessage[] {
  const items: ChatMessage[] = []
  detail.messages.forEach((m) => {
    if (m.role === "assistant") {
      try {
        const parsed = JSON.parse(m.content)
        const parsedHits = Array.isArray(parsed.hits) ? (parsed.hits as KnowledgeHit[]) : []
        items.push({
          id: m.id,
          role: "assistant",
          content: parsed.answer ?? parsed.reply ?? parsed.message ?? parsed.content ?? "",
          answer: parsed.answer ?? null,
          question: parsed.question ?? "",
          options: parsed.options ?? [],
          hits: parsedHits,
          allowFreeText: parsed.allow_free_text ?? true,
          step: clampStep(parsed.step) ?? undefined,
          done: parsed.done,
        })
        return
      } catch {
        // ignore parse errors and fall back to raw content
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

export default function ChatClient({ topic, initialConversationId, reset }: ChatClientProps) {
  const router = useRouter()

  const [messages, setMessages] = useState<ChatMessage[]>([FALLBACK_ASSISTANT])
  const [localStep, setLocalStep] = useState(clampStep(FALLBACK_ASSISTANT.step) ?? 0)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId ?? null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "recording" | "transcribing">("idle")
  const [bootstrapLoading, setBootstrapLoading] = useState(!!initialConversationId && !reset)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
      const target = document.documentElement?.scrollHeight ?? container.scrollHeight
      window.scrollTo({ top: target, behavior: "smooth" })
      return
    }
    if (typeof container.scrollTo === "function") {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      })
    } else {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, loading, bootstrapLoading])

  useEffect(() => {
    if (conversationId) {
      window.localStorage.setItem("lastConversationId", conversationId)
    }
  }, [conversationId])

  useEffect(() => {
    const load = async () => {
      if (!initialConversationId || reset) {
        setBootstrapLoading(false)
        setMessages([FALLBACK_ASSISTANT])
        setLocalStep(clampStep(FALLBACK_ASSISTANT.step) ?? 0)
        setConversationId(null)
        return
      }
      try {
        const data = await getConversationDetail(initialConversationId)
        const hydrated = hydrateConversation(data)
        const hydratedStep =
          clampStep(
            data.step ??
            [...hydrated]
              .reverse()
              .find((m) => m.role === "assistant" && clampStep(m.step) !== null)?.step ??
            null,
          ) ?? 0
        setMessages([FALLBACK_ASSISTANT, ...(hydrated.length > 0 ? hydrated : [])])
        setLocalStep(hydratedStep)
        setConversationId(initialConversationId)
      } catch (err) {
        const message = err instanceof ApiError ? err.message : LLM_FALLBACK_MESSAGE
        setError(message)
        setMessages([FALLBACK_ASSISTANT])
        setLocalStep(clampStep(FALLBACK_ASSISTANT.step) ?? 0)
        setConversationId(null)
      } finally {
        setBootstrapLoading(false)
      }
    }
    void load()
  }, [initialConversationId, reset])

  const lastAssistant = useMemo(() => [...messages].reverse().find((m) => m.role === "assistant"), [messages])
  const hasUserAnswer = useMemo(() => messages.some((m) => m.role === "user"), [messages])
  const quickOptions = lastAssistant?.options ?? []
  const voiceBusy = voiceStatus !== "idle"
  const canSend = input.trim().length > 0 && !loading && !voiceBusy
  const canOpenMemo = Boolean(conversationId) && !(loading || voiceBusy)
  const inputPlaceholder = "ご相談内容を入力してください"
  const sendButtonClass = clsx(
    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors",
    canSend
      ? "bg-[var(--yori-primary)] text-[var(--yori-primary-ink)] shadow-sm hover:brightness-105"
      : "bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-default",
  )

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleVoiceTranscript = (text: string) => {
    setInput((prev) => appendTranscript(prev, text))
  }

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSend) return
    void handleSend()
  }

  const appendAssistant = (res: ChatTurnResponse) => {
    const normalizedStep = clampStep(res.step)
    let computedStep = normalizedStep ?? 0
    setLocalStep((prev) => {
      const next = deriveStep(res.step, prev)
      computedStep = next
      return next
    })
    const stepForMessage = normalizedStep ?? computedStep
    const replyText = res.answer?.trim() ? res.answer.trim() : res.reply
    const assistantMessage: ChatMessage = {
      id: `assistant-${crypto.randomUUID()}`,
      role: "assistant",
      content: replyText,
      answer: res.answer ?? null,
      question: res.question,
      options: res.options ?? [],
      hits: res.hits ?? [],
      allowFreeText: res.allow_free_text ?? true,
      step: stepForMessage,
      done: Boolean(res.done),
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
      const params = new URLSearchParams()
      params.set("conversationId", res.conversation_id)
      if (topic) params.set("topic", topic)
      router.replace(`/chat?${params.toString()}`, { scroll: false })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : LLM_FALLBACK_MESSAGE
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const addUserMessage = (text: string, payload?: ChatMessage["payload"]) => {
    setMessages((prev) => [...prev, { id: `user-${crypto.randomUUID()}`, role: "user", content: text, payload }])
  }

  const handleOptionClick = async (option: ChatOption) => {
    if (loading || voiceBusy) return
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
    setUploadMessage(null)
    try {
      const result = await uploadDocument({
        file,
        doc_type: "other",
        period_label: "latest",
        user_id: USER_ID,
        conversation_id: conversationId ?? undefined,
      })
      setAttachments((prev) => [...prev, { id: result.document_id, filename: result.filename }])
      setUploadMessage(`${result.filename} を保存しました`)
      setTimeout(() => setUploadMessage(null), 2500)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "アップロードに失敗しました。サイズや拡張子をご確認ください。"
      setUploadError(message)
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
    const replyText = (msg.content || "").trim()
    const questionText = (msg.question || "").trim()
    const parsedExamples = isAssistant ? parseExamples(replyText) : { examples: [], references: [], intro: "" }
    const hasExamples = parsedExamples.examples.length > 0
    const safeReplyText = stripMarkdown(replyText)

    const renderSection = (label: string, value?: string) => {
      if (!value) return null
      return (
        <div className="space-y-1">
          <strong className="text-[12px] font-semibold text-slate-700">{label}</strong>
          <p className="text-[13px] leading-relaxed text-slate-800 whitespace-pre-line break-words">{value}</p>
        </div>
      )
    }

    const bubble = (
      <ChatBubble
        role={msg.role}
        bubbleClassName={
          isAssistant
            ? "bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 md:px-5 md:py-4"
            : "text-[var(--yori-primary-ink)] bg-[var(--yori-primary)] rounded-3xl px-4 py-2 ml-auto"
        }
      >
        {isAssistant ? (
          <div className="space-y-3">
            <p className="text-[11px] tracking-wide text-slate-500">Yorizoからのメッセージ</p>
            {hasExamples ? (
              <div className="space-y-3">
                {parsedExamples.intro && (
                  <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-line break-words">
                    {parsedExamples.intro}
                  </p>
                )}
                <div className="space-y-2">
                  {parsedExamples.examples.map((ex, index) => (
                    <details
                      key={`${msg.id}-example-${index}`}
                      className="group rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
                      open={index === 0}
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-900 list-none">
                        <span className="flex items-center gap-2">
                          <span>{emojiForNo(ex.no)}</span>
                          <span className="break-words">{ex.title}</span>
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
                      </summary>
                      <div className="px-3 pb-3 pt-1 space-y-2">
                        {renderSection("状況", ex.situation)}
                        {renderSection("打ち手", ex.action)}
                        {renderSection("手順", ex.steps)}
                        {renderSection("注意点", ex.caution)}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ) : (
              safeReplyText && (
                <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-line break-words">
                  {safeReplyText}
                </p>
              )
            )}
            {questionText && (
              <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line break-words">
                {questionText}
              </p>
            )}
          </div>
        ) : (
          <span className="leading-relaxed whitespace-pre-line break-words">{msg.content}</span>
        )}
      </ChatBubble>
    )

    if (isAssistant) {
      return (
        <div key={msg.id} className="flex items-start gap-3">
          <YorizoAvatar size="sm" mood={loading ? "thinking" : "basic"} className="mt-1" />
          <div className="flex-1 space-y-2">
            {bubble}
          </div>
        </div>
      )
    }

    return (
      <div key={msg.id} className="flex justify-end">
        {bubble}
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3 pb-16 px-4 md:px-6">
      {bootstrapLoading ? (
        <ThinkingRow text="相談履歴を読み込んでいます..." className="py-6" />
      ) : (
        <div
          ref={messagesContainerRef}
          data-testid="chat-messages"
          className="flex-1 min-h-[320px] space-y-3 overflow-y-auto pr-1 pb-1"
        >
          {messages.map((m) => renderMessage(m))}
          {loading && (
            <div className="flex justify-start">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                <ThinkingRow
                  text="Yorizoが考えています..."
                  className="text-xs text-[var(--yori-ink-strong)]"
                  gap="compact"
                />
              </span>
            </div>
          )}
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
          {uploadMessage && <p className="text-xs text-emerald-600">{uploadMessage}</p>}
        </div>
      )}



      {quickOptions.length > 0 && (
        <ChatQuickOptions options={quickOptions} onSelect={handleOptionClick} disabled={loading || voiceBusy} />
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">添付済みファイル</p>
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
                  aria-label="Remove attachment"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="sticky bottom-0 inset-x-0 border-t bg-slate-50/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-3 py-2 md:px-4 md:py-3 space-y-2">
          <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 shadow-sm">
            <button
              type="button"
              onClick={handleUploadClick}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              disabled={uploading || voiceBusy}
              data-testid="chat-attach"
              aria-label="資料を添付"
            >
              <FileUp className="h-4 w-4" />
            </button>
            <textarea
              value={input}
              onChange={handleInputChange}
              disabled={voiceBusy}
              placeholder={inputPlaceholder}
              rows={3}
              data-testid="chat-input"
              className="flex-1 h-full resize-none border-0 bg-transparent px-0 py-0 text-[13px] leading-[1.4] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-[14px] overflow-y-auto"
            />
            <button
              type="submit"
              disabled={!canSend}
              className={sendButtonClass}
              data-testid="chat-send"
              aria-label="送信"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
          <ChatSpeechInput
            onTranscript={handleVoiceTranscript}
            onStatusChange={setVoiceStatus}
            disabled={loading}
            data-testid="chat-speech-input"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.csv,.xlsx,.xls,.tsv,image/*"
          onChange={handleFileChange}
        />
      </form>
      {hasUserAnswer && (
        <div className="yori-card p-4 space-y-3">
          <button
            type="button"
            data-testid="chat-open-memo"
            disabled={!canOpenMemo}
            onClick={() => {
              if (!conversationId) return
              router.push(`/memory/${conversationId}/memo`)
            }}
            className="btn-primary w-full px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            相談メモを開く
            <ArrowRight className="h-4 w-4" />
          </button>
          {!conversationId && (
            <p className="text-xs text-[var(--yori-ink-soft)]">会話を準備しています… 送信後に開けるようになります。</p>
          )}
        </div>
      )}
    </div>
  )
}
