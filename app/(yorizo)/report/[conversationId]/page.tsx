"use client"

import { useEffect, useMemo, useState, type ElementType } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CalendarDays, ChevronRight, FileText, ListChecks, Loader2, Sprout, ShieldCheck, RefreshCcw } from "lucide-react"
import { getConversationReport, type ConversationReport } from "@/lib/api"

function SectionTitle({ icon: Icon, title }: { icon: ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-[var(--yori-ink-strong)]" />
      <h2 className="text-lg font-semibold text-[var(--yori-ink-strong)]">{title}</h2>
    </div>
  )
}

export default function ReportPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const router = useRouter()
  const [report, setReport] = useState<ConversationReport | null>(null)
  const [notExists, setNotExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = async () => {
    if (!conversationId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getConversationReport(conversationId)
      if ((data as any)?.exists === false) {
        setNotExists(true)
        setReport(null)
      } else if ((data as any)?.report) {
        setReport((data as any).report as ConversationReport)
      } else {
        setReport(data as ConversationReport)
      }
    } catch (err) {
      console.error(err)
      setError("レポートを取得できませんでした。時間をおいて再試行してください。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  const createdDate = useMemo(() => {
    if (!report?.created_at) return ""
    return new Date(report.created_at).toLocaleDateString("ja-JP")
  }, [report])

  return (
    <div className="w-full flex flex-col gap-5 pb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--yori-ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> 戻る
        </button>
        <div className="text-xs font-semibold text-[var(--yori-ink-soft)] bg-[var(--yori-secondary)] px-3 py-1 rounded-full border border-[var(--yori-outline)]">
          診断レポート
        </div>
        <button
          type="button"
          onClick={fetchReport}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--yori-ink-soft)] underline underline-offset-4"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          レポートを再生成
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[var(--yori-ink-soft)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>レポートを読み込み中…</span>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {notExists && !loading && (
        <div className="yori-card p-5 space-y-2">
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">レポートはまだ作成されていません。</p>
          <p className="text-sm text-[var(--yori-ink)]">チャットを続けて、診断がまとまったらレポートを確認できます。</p>
          <button
            type="button"
            onClick={() => router.push(`/chat?conversationId=${conversationId ?? ""}`)}
            className="btn-primary w-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            チャットに戻る
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {report && (
        <>
          <header className="yori-card p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--yori-secondary)] border border-[var(--yori-outline)] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--yori-ink-strong)]" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-[var(--yori-ink-soft)]">今回のまとめ</p>
                <h1 className="text-xl font-bold text-[var(--yori-ink-strong)]">{report.title}</h1>
                <div className="flex items-center gap-2 text-xs text-[var(--yori-ink-soft)]">
                  <CalendarDays className="h-4 w-4" />
                  <span>{createdDate}</span>
                  {report.category && (
                    <span className="pill bg-[var(--yori-secondary)] border border-[var(--yori-outline)]">{report.category}</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              「何が見えてきたか」「次に何をするか」をシンプルにまとめています。決算書があればざっくり分析も入ります。
            </p>
          </header>

          <section className="yori-card p-5 space-y-3">
            <SectionTitle icon={Sprout} title="今回見えてきたこと" />
            <ul className="space-y-2 text-sm text-[var(--yori-ink)]">
              {report.summary.length === 0 && <li>まだまとめがありません。</li>}
              {report.summary.map((item, idx) => (
                <li key={`${item}-${idx}`} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[var(--yori-primary)]" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {report.financial_analysis.length > 0 && (
            <section className="yori-card p-5 space-y-3">
              <SectionTitle icon={ShieldCheck} title="決算のざっくり分析" />
              <ul className="space-y-2 text-sm text-[var(--yori-ink)]">
                {report.financial_analysis.map((item, idx) => (
                  <li key={`${item}-${idx}`} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[var(--yori-tertiary)]" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="yori-card p-5 space-y-3">
            <SectionTitle icon={ListChecks} title="企業の強み・弱み" />
            <div className="grid md:grid-cols-2 gap-3">
              <div className="yori-card bg-[var(--yori-surface-muted)] border border-[var(--yori-outline)] p-4 space-y-2">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">強み</p>
                {report.strengths.length === 0 && (
                  <p className="text-sm text-[var(--yori-ink-soft)]">強みの記載はまだありません。</p>
                )}
                <ul className="space-y-1 text-sm text-[var(--yori-ink)]">
                  {report.strengths.map((item, idx) => (
                    <li key={`${item}-${idx}`} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--yori-primary)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="yori-card bg-[var(--yori-surface-muted)] border border-[var(--yori-outline)] p-4 space-y-2">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">弱み</p>
                {report.weaknesses.length === 0 && (
                  <p className="text-sm text-[var(--yori-ink-soft)]">弱みの記載はまだありません。</p>
                )}
                <ul className="space-y-1 text-sm text-[var(--yori-ink)]">
                  {report.weaknesses.map((item, idx) => (
                    <li key={`${item}-${idx}`} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--yori-primary)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="yori-card p-5 space-y-3">
            <SectionTitle icon={ListChecks} title="今回の“宿題”" />
            {report.homework.length === 0 ? (
              <p className="text-sm text-[var(--yori-ink-soft)]">まだ宿題はありません。</p>
            ) : (
              <div className="space-y-3">
                {report.homework.map((task) => (
                  <label
                    key={`${task.id ?? task.title}`}
                    className="yori-card border border-[var(--yori-outline)] p-4 space-y-2 flex items-start gap-3"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-[var(--yori-outline)]"
                      defaultChecked={task.status === "done"}
                      readOnly
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{task.title}</p>
                      {task.detail && <p className="text-xs text-[var(--yori-ink)] leading-relaxed">{task.detail}</p>}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--yori-ink-soft)]">
                        {task.timeframe && <span>目安: {task.timeframe}</span>}
                        {task.status && <span className="pill bg-[var(--yori-secondary)] border border-[var(--yori-tertiary)]">{task.status}</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          <div className="yori-card p-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push("/yorozu")}
              className="btn-primary w-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              よろず相談に進む
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => router.push(`/chat?conversationId=${conversationId}`)}
              className="text-sm font-semibold text-[var(--yori-ink-soft)] underline underline-offset-4 w-full text-center"
            >
              もう一度診断する
            </button>
          </div>
        </>
      )}
    </div>
  )
}
