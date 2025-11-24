"use client"

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import { Camera, FileUp, SendHorizontal, X } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { MascotIcon } from "@/components/MascotIcon"
import {
  getConversationDetail,
  postChat,
  uploadDocument,
  type ConversationDetail,
} from "@/lib/api"

type ChatChoice = {
  id: string
  label: string
}

type Message =
  | {
      id: string
      role: "assistant" | "system"
      content: string
      choices?: ChatChoice[]
      choiceOptions?: string[]
    }
  | {
      id: string
      role: "user"
      content: string
    }

type Attachment = {
  id: string
  filename: string
}

const initialAssistantMessage: Message = {
  id: "m1",
  role: "assistant",
  content:
    "こんにちは！\n\nはじめまして、Yorizoだよ。\n今日はどんなことを相談したいのかな？\n売上のこと、資金繰りのこと、どんな悩みでもいっしょに整理できるよ🌱",
  choices: [
    { id: "sales", label: "売上のことを相談したい" },
    { id: "cash", label: "資金繰りの不安を整理したい" },
    { id: "staff", label: "人手不足・採用について話したい" },
    { id: "unknown", label: "まだ、悩みがうまく言葉にできない" },
  ],
}

function ChatBubble({
  message,
  onChoice,
  onChoiceOption,
}: {
  message: Message
  onChoice: (c: ChatChoice) => void
  onChoiceOption?: (option: string) => void
}) {
  const isUser = message.role === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {isUser ? (
        <div className="max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm bg-[#13274B] text-white rounded-br-md">
          {message.content.split("\n").map((line, idx) => (
            <p key={`${message.id}-${idx}`} className="whitespace-pre-wrap">
              {line}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MascotIcon size="sm" />
            <div className="max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm bg-white/95 text-slate-800 border border-white/70 rounded-bl-md whitespace-pre-line">
              {message.content}
            </div>
          </div>
          {message.choices && message.choices.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-10">
              {message.choices.map((c) => (
                <button
                  key={c.id}
                  className="rounded-full border border-pink-200 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-pink-50"
                  onClick={() => onChoice(c)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {message.choiceOptions && message.choiceOptions.length > 0 && (
            <div className="space-y-1 pl-10">
              <p className="text-[11px] text-slate-500">近いものを選んでね</p>
              <div className="flex flex-wrap gap-2">
                {message.choiceOptions.map((opt) => (
                  <button
                    key={`${message.id}-${opt}`}
                    className="rounded-full border border-pink-200 bg-gradient-to-r from-white to-pink-50 px-3 py-1 text-xs text-gray-700 hover:bg-pink-100"
                    onClick={() => onChoiceOption?.(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialConversationId = searchParams.get("conversationId") || null
  const [messages, setMessages] = useState<Message[]>([initialAssistantMessage])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapLoading, setIsBootstrapLoading] = useState(!!initialConversationId)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId)
  const [progress, setProgress] = useState<number | null>(null)
  const [latestReportReady, setLatestReportReady] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    const loadConversation = async () => {
      if (!initialConversationId) return
      try {
        const data: ConversationDetail = await getConversationDetail(initialConversationId)
        const mapped: Message[] = data.messages.map((m) => ({
          id: m.id,
          role: m.role as "assistant" | "user" | "system",
          content: m.content,
        }))
        setMessages(mapped.length > 0 ? mapped : [initialAssistantMessage])
      } catch (err) {
        console.error(err)
        setError("過去の会話を読み込めませんでした。もう一度お試しください。")
        setMessages([initialAssistantMessage])
      } finally {
        setIsBootstrapLoading(false)
      }
    }
    loadConversation()
  }, [initialConversationId])

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading])

  const sendMessagesToBackend = async (nextMessages: Message[]) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await postChat({
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        profile: { industry: "未設定", employees: "未設定", annual_sales_range: "未設定" },
        document_ids: attachments.map((a) => a.id),
        conversation_id: conversationId || undefined,
        user_id: "demo-user",
      })
      if (response?.message) {
        const assistantMessage: Message = {
          id: `assistant-${crypto.randomUUID()}`,
          role: "assistant",
          content: response.message,
          choices: response.choices ?? [],
          choiceOptions: response.choice_options ?? [],
        }
        setProgress(response.progress ?? null)
        if ((response.progress ?? 0) >= 100) {
          setLatestReportReady(true)
        }
        setMessages((prev) => [...prev, assistantMessage])
        if (!conversationId) {
          setConversationId(response.conversation_id)
          const url = new URL(window.location.href)
          url.searchParams.set("conversationId", response.conversation_id)
          router.replace(url.toString())
        }
      } else {
        setError("ごめんなさい、うまく返答できませんでした。もう一度ためしてね。")
      }
    } catch (err) {
      console.error(err)
      setError("ごめんなさい、うまく返答できませんでした。もう一度ためしてね。")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChoiceClick = async (choice: ChatChoice) => {
    if (isLoading) return
    const userMessage: Message = {
      id: `user-${crypto.randomUUID()}`,
      role: "user",
      content: choice.label,
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    await sendMessagesToBackend(nextMessages)
  }

  const handleChoiceOptionClick = async (option: string) => {
    if (isLoading) return
    const userMessage: Message = {
      id: `user-${crypto.randomUUID()}`,
      role: "user",
      content: option,
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    await sendMessagesToBackend(nextMessages)
  }

  const handleSend = async () => {
    if (!canSend) return
    const userMessage: Message = {
      id: `user-${crypto.randomUUID()}`,
      role: "user",
      content: input.trim(),
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput("")
    await sendMessagesToBackend(nextMessages)
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    try {
      const result = await uploadDocument(file, "demo-user")
      setAttachments((prev) => [...prev, { id: result.document_id, filename: result.filename }])
    } catch (err) {
      console.error(err)
      setUploadError("ファイルをアップロードできませんでした。10MB以下、PDF/画像/CSV/XLSXに対応しています。")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pt-2 pb-24 space-y-3">
      <div className="flex items-center gap-3">
        <MascotIcon size="sm" />
      </div>
      <div className="flex items-center gap-2 text-[11px] text-slate-600">
        <span className="inline-flex items-center justify-center rounded-full bg-white/90 border border-slate-200 px-2 py-1 font-semibold text-[#13274B]">
          中小企業診断士 Yorizo が相談に乗るよ🌱
        </span>
        <button
          type="button"
          className="text-[11px] underline text-slate-500"
          onClick={() => router.push("/memory")}
        >
          会社情報を登録
        </button>
      </div>

      {progress !== null && progress > 0 && (
        <div className="space-y-1 px-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>診断進捗</span>
            <span className="font-semibold text-slate-800">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/70 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-sky-300 transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {isBootstrapLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600 py-4">
          <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-[#13274B] animate-spin" />
          <span>過去の会話を読み込み中…</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pb-2">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onChoice={handleChoiceClick}
              onChoiceOption={handleChoiceOptionClick}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm bg-white/90 text-slate-600 border border-white/70">
                Yorizoが考え中…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {(error || uploadError) && (
        <div className="space-y-1">
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
        </div>
      )}

      {latestReportReady && conversationId && (
        <div className="bg-white/95 border border-pink-100 rounded-3xl shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-800">今回の診断をもとに、レポートをまとめたよ</p>
          <button
            type="button"
            onClick={() => router.push(`/report/${conversationId}`)}
            className="w-full rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform"
          >
            診断レポートを見る
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="w-full max-w-md mx-auto px-1 space-y-1">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file) => (
              <span
                key={file.id}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs border border-slate-200 shadow-sm"
              >
                <FileUp className="h-4 w-4 text-pink-500" />
                <span className="max-w-[160px] truncate">{file.filename}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="添付を削除"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto px-1 pb-2">
        <div className="flex items-center rounded-full bg-white/95 shadow-md border border-pink-200 px-3 py-2 gap-2">
          <button
            type="button"
            className="h-9 w-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-500"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-5 w-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 bg-transparent text-sm px-2 outline-none text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={`h-9 w-9 rounded-full flex items-center justify-center text-white ${
              canSend ? "bg-[#13274B]" : "bg-slate-300 cursor-not-allowed"
            }`}
            aria-label="送信"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <FileUp className="h-3.5 w-3.5" />
            <span>{isUploading ? "アップロード中..." : "決算書などを添付できるよ"}</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.xlsx,.xls,.tsv,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  )
}
