"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Loader2, NotebookText } from "lucide-react"
import { getConversations, type ConversationSummary } from "@/lib/api"
import { cleanConversationTitle } from "@/lib/utils"

export default function ChatHistoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getConversations("demo-user", 50, 0)
        setItems(data.map((item) => ({ ...item, title: cleanConversationTitle(item.title) })))
      } catch (err) {
        console.error(err)
        setError("チャット履歴を取得できませんでした。")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <main className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col flex-1 pb-24 pt-2 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">チャット履歴</h1>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>読み込み中...</span>
          </div>
        )}

        {error && <p className="text-xs text-rose-600">{error}</p>}

        {!isLoading && items.length === 0 && (
          <p className="text-sm text-slate-600">まだチャット履歴がありません。</p>
        )}

        <div className="bg-white/95 rounded-3xl shadow-sm border border-white/80 divide-y divide-slate-100">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => router.push(`/memory/${item.id}/memo`)}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex flex-col items-start">
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{item.date}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6c63ff]">
                <NotebookText className="h-4 w-4" />
                <span>相談メモ</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
