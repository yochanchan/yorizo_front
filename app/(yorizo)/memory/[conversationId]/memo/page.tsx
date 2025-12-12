"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Copy, Loader2, RefreshCcw } from "lucide-react"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import { getConsultationMemo, refreshConsultationMemo, type ConsultationMemo } from "@/lib/api"

export default function ConsultationMemoPage() {
  const params = useParams<{ conversationId: string }>()
  const router = useRouter()
  const [memo, setMemo] = useState<ConsultationMemo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const conversationId = params?.conversationId

  useEffect(() => {
    const fetchMemo = async () => {
      if (!conversationId) return
      try {
        const data = await getConsultationMemo(conversationId)
        setMemo(data)
      } catch (err) {
        console.error(err)
        setError("相談メモを取得できませんでした。")
      } finally {
        setIsLoading(false)
      }
    }
    fetchMemo()
  }, [conversationId])

  const handleCopy = async () => {
    if (!memo) return
    const text = [
      "今回気になっていること:",
      ...memo.current_points.map((p) => `- ${p}`),
      "",
      "専門家に伝えたい大事なポイント:",
      ...memo.important_points.map((p) => `- ${p}`),
    ].join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error(err)
      setError("クリップボードにコピーできませんでした。")
    }
  }

  const handleRefresh = async () => {
    if (!conversationId) return
    setIsRefreshing(true)
    setError(null)
    try {
      const data = await refreshConsultationMemo(conversationId)
      setMemo(data)
    } catch (err) {
      console.error(err)
      setError("最新のメモを生成できませんでした。")
    } finally {
      setIsRefreshing(false)
    }
  }

  const updatedAtLabel = useMemo(() => {
    if (!memo?.updated_at) return ""
    const date = new Date(memo.updated_at)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }, [memo])

  return (
    <main className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col flex-1 pb-24 pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full bg-white/90 border border-white/70 flex items-center justify-center shadow-sm"
          aria-label="戻る"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </button>
        <div>
          <p className="text-lg font-bold text-slate-900">相談メモ</p>
          <p className="text-xs text-slate-500">よろず相談や専門家面談のときに活用してね🌱</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>読み込み中...</span>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {memo && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-white/80 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">今回気になっていること</h2>
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
              {memo.current_points.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-white/80 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">専門家に伝えたい大事なポイント</h2>
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
              {memo.important_points.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform inline-flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>相談メモをコピーする</span>
              {copied && <Check className="h-4 w-4 text-emerald-200" />}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#13274B] disabled:opacity-60"
            >
              最新の情報を取り込む
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            </button>
            {updatedAtLabel && <p className="text-[11px] text-slate-500 text-right">更新日: {updatedAtLabel}</p>}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-white/80 p-4 space-y-2">
            <p className="text-xs text-slate-700">相談予定日（任意）</p>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13274B]"
            />
            <p className="text-[11px] text-slate-500">相談日が決まったらメモしておくと便利だよ。</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-white/80 p-4 space-y-3 text-center">
            <div className="flex justify-center">
              <YorizoAvatar size="md" />
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">
              相談メモは試験運用中の新しい機能だよ！ 感想があったら教えてね✨
            </p>
            <button
              type="button"
              onClick={() => alert("フィードバックありがとうございます！")}
              className="w-full rounded-full border border-slate-300 text-slate-700 py-3 text-sm font-semibold active:scale-98 transition-transform"
            >
              相談メモの感想を教える
            </button>
          </div>
        </div>
      )}
      </div>
    </main>
  )
}
