"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CalendarDays, FileText, Loader2, Sprout } from "lucide-react"
import { getConversationReport, type ConversationReport } from "@/lib/api"
import { MascotIcon } from "@/components/MascotIcon"

export default function ReportPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const router = useRouter()
  const [report, setReport] = useState<ConversationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      if (!conversationId) return
      try {
        const data = await getConversationReport(conversationId)
        setReport(data)
      } catch (err) {
        console.error(err)
        setError("レポートを取得できませんでした。時間をおいて再試行してください。")
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [conversationId])

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 pt-4 space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" /> 戻る
        </button>
        <MascotIcon size="sm" />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>レポートを読み込み中…</span>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {report && (
        <>
          <header className="bg-white/95 rounded-3xl border border-white/80 shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#13274B]" />
              <h1 className="text-lg font-bold text-slate-900">{report.title}</h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays className="h-4 w-4" />
              <span>{report.date}</span>
            </div>
          </header>

          <section className="bg-white/95 rounded-3xl border border-white/80 shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">今回の診断結果のまとめ</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
              {report.summary.length === 0 && <li>まとめは未生成です。</li>}
              {report.summary.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white/95 rounded-3xl border border-white/80 shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">今回の“宿題”</h2>
            {report.homework.length === 0 ? (
              <p className="text-sm text-slate-600">宿題はまだありません。</p>
            ) : (
              <div className="space-y-3">
                {report.homework.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                      {task.category && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-pink-50 border border-pink-100 rounded-full px-2 py-0.5">
                          <Sprout className="h-3 w-3 text-pink-500" />
                          {task.category}
                        </span>
                      )}
                    </div>
                    {task.detail && <p className="text-xs text-slate-600">{task.detail}</p>}
                    <p className="text-[11px] text-slate-500">ステータス: {task.status}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
