"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { FileUp, SendHorizontal, X } from "lucide-react"
import { useRouter } from "next/navigation"

import { VoiceInputControls } from "@/components/voice/VoiceInputControls"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { ChatQuickOptions } from "@/components/ui/chat-quick-options"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import { ThinkingRow } from "@/components/ThinkingRow"
import {
  ApiError,
  LLM_FALLBACK_MESSAGE,
  getConversationDetail,
  guidedChatTurn,
  refreshConsultationMemo,
  uploadDocument,
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
  const [bootstrapLoading, setBootstrapLoading] = useState(!!initialConversationId && !reset)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null)
  const [memoLoading, setMemoLoading] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

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
  const effectiveStep = useMemo(() => {
    const assistantStep = clampStep(lastAssistant?.step)
    if (assistantStep !== null) return assistantStep
    return clampStep(localStep) ?? 0
  }, [lastAssistant, localStep])
  const currentStep = clampStep(effectiveStep) ?? 0
  const quickOptions = lastAssistant?.options ?? []
  const allowFreeText = lastAssistant?.allowFreeText ?? true
  const canSend = allowFreeText && input.trim().length > 0 && !loading
  const inputPlaceholder = allowFreeText ? "ご相談内容をご入力ください" : "選択肢から選んでください"
  const hasUserMessage = useMemo(() => messages.some((m) => m.role === "user"), [messages])
  const canGenerateMemo = Boolean(conversationId && hasUserMessage)

  const handleUploadClick = () => fileInputRef.current?.click()

  const resetTextareaHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "44px"
  }

  const adjustTextareaHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "0px"
    const next = Math.min(el.scrollHeight, 140)
    el.style.height = `${Math.max(next, 44)}px`
  }

  const handleVoiceTranscript = (text: string) => {
    setInput(text)
    setTimeout(adjustTextareaHeight, 0)
  }

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    adjustTextareaHeight()
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
    const assistantMessage: ChatMessage = {
      id: `assistant-${crypto.randomUUID()}`,
      role: "assistant",
      content: res.reply,
      question: res.question,
      options: res.options ?? [],
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
    if (loading) return
    addUserMessage(option.label, { type: "choice", choiceId: option.id })
    setInput("")
    resetTextareaHeight()
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
    resetTextareaHeight()
    await sendToBackend({ message: text, selection: { type: "free_text", text } })
  }

  const handleGenerateMemo = async () => {
    if (!conversationId) return
    setMemoLoading(true)
    setError(null)
    try {
      await refreshConsultationMemo(conversationId)
      router.push(`/memory/${conversationId}/memo`)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "相談メモの作成に失敗しました。もう一度お試しください。"
      setError(message)
    } finally {
      setMemoLoading(false)
    }
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
          <div className="space-y-2">
            <p className="text-[11px] tracking-wide text-slate-500">Yorizoからのメッセージ</p>
            {replyText && (
              <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-line break-words">{replyText}</p>
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
          {voiceMessage && <p className="text-xs text-[var(--yori-ink-soft)]">{voiceMessage}</p>}
        </div>
      )}

      {quickOptions.length > 0 && (
        <ChatQuickOptions options={quickOptions} onSelect={handleOptionClick} disabled={loading} />
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
        <div className="mx-auto max-w-3xl px-3 py-2 md:px-4 md:py-3 space-y-3">
          <button
            type="button"
            onClick={handleGenerateMemo}
            disabled={!canGenerateMemo || memoLoading}
            className="w-full rounded-full bg-[var(--yori-primary)] text-[var(--yori-primary-ink)] px-4 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {memoLoading ? "まとめています..." : "ここまでの内容を相談メモにまとめる"}
          </button>
          <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 shadow-sm">
            <button
              type="button"
              onClick={handleUploadClick}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              disabled={uploading}
              aria-label="ファイルを添付"
            >
              <FileUp className="h-4 w-4" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              placeholder={inputPlaceholder}
              rows={1}
              style={{ height: `44px`, overflowY: "auto" }}
              className="flex-1 h-full min-h-[44px] max-h-[140px] resize-none border-0 bg-transparent px-0 py-0 text-[13px] leading-[1.4] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-[14px]"
              disabled={!allowFreeText}
            />
            <button
              type="submit"
              disabled={!allowFreeText || !input.trim() || loading}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-default"
              aria-label="Send"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
          <VoiceInputControls
            onTranscript={handleVoiceTranscript}
            onStatusChange={(status, info) => {
              if (info) {
                setVoiceMessage(info)
              } else if (status === "recording") {
                setVoiceMessage("録音中です（最大1分で自動停止）")
              }
            }}
            disabled={loading}
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
    </div>
  )
}
