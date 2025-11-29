"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Loader2, RefreshCcw } from "lucide-react"
import { getCompanyAnalysisReport, type CompanyAnalysisReport } from "@/lib/api"
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile"
import { CompanyInfoSummaryCard } from "@/components/company/CompanyInfoSummaryCard"

const USER_ID = "demo-user"

export default function CompanyAnalysisReportPage() {
  const router = useRouter()
  const { data: profile, isLoading: loadingProfile } = useCompanyProfile(USER_ID)
  const [report, setReport] = useState<CompanyAnalysisReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCompanyAnalysisReport(USER_ID)
      setReport(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "企業分析レポートを取得できませんでした。")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const formattedUpdatedAt = report?.last_updated_at
    ? new Date(report.last_updated_at).toLocaleString("ja-JP", { hour12: false })
    : "未取得"

  return (
    <div className="flex flex-col gap-6">
      <header className="yori-card-muted p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/memory")}
            className="inline-flex items-center gap-2 text-sm text-[var(--yori-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Yorizoの記憶に戻る
          </button>
          <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            レポートを更新
          </button>
        </div>
        <div>
          <p className="text-xs text-[var(--yori-ink-soft)]">最終更新: {formattedUpdatedAt}</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--yori-ink-strong)]">企業分析レポート</h1>
          <p className="mt-2 text-sm text-[var(--yori-ink)] leading-relaxed">
            チャットの内容や登録情報、添付資料などをもとに、現在の経営状況を整理したレポートです。
          </p>
        </div>
      </header>

      <CompanyInfoSummaryCard profile={profile} loading={loadingProfile} onEdit={() => router.push("/company")} />

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {isLoading && (
        <div className="yori-card p-5 text-sm text-[var(--yori-ink-soft)] flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          レポートを生成中です…
        </div>
      )}

      {report && !isLoading && (
        <>
          <section className="yori-card p-5 space-y-2">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">今回の整理サマリー</p>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">{report.summary}</p>
          </section>

          <section className="yori-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">会社の基本情報</p>
            </div>
            <p className="text-xs text-[var(--yori-ink-soft)]">相談の前提となる会社の概要です。</p>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">{report.basic_info_note}</p>
          </section>

          <section className="yori-card p-5 space-y-3">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">財務・経営の状態</p>
            <div className="space-y-3">
              {(report.finance_scores ?? []).map((score) => (
                <div
                  key={score.label}
                  className="flex flex-col gap-2 rounded-2xl border border-[var(--yori-outline)] bg-white/80 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{score.label}</p>
                    <p className="text-sm text-[var(--yori-ink)] leading-snug">{score.description}</p>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-full bg-[var(--yori-secondary)] px-3 py-1 text-sm font-semibold text-[var(--yori-ink-strong)]">
                    {score.score ?? "-"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="yori-card p-5 space-y-3">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">チャットから読み取れる経営課題</p>
            <p className="text-xs text-[var(--yori-ink-soft)]">これまでの相談内容から整理した主なモヤモヤです。</p>
            <div className="space-y-3">
              {(report.pain_points ?? []).map((group) => (
                <div key={group.category}>
                  <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">{group.category}</p>
                  <ul className="list-disc list-inside text-sm text-[var(--yori-ink)] space-y-1">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="yori-card p-5 space-y-3">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">強み・弱み（ローカルベンチマークの観点）</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="yori-card bg-[var(--yori-surface-muted)] border border-[var(--yori-outline)] p-4 space-y-2">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">強み</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)]">
                  {(report.strengths ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="yori-card bg-[var(--yori-surface-muted)] border border-[var(--yori-outline)] p-4 space-y-2">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">弱み</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)]">
                  {(report.weaknesses ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="yori-card p-5 space-y-3">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">今後3〜6か月のアクション候補</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)]">
              {(report.action_items ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => router.push("/yorozu")}
              className="btn-primary w-full px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              よろず支援拠点への相談を検討する
              <ChevronRight className="h-4 w-4" />
            </button>
          </section>
        </>
      )}

      {!report && !isLoading && !error && (
        <div className="yori-card p-5 text-sm text-[var(--yori-ink-soft)]">
          企業分析レポートはまだ生成されていません。レポートを更新ボタンを押して取得してください。
        </div>
      )}

      <div className="text-center text-xs text-[var(--yori-ink-soft)] pb-6">
        <button
          type="button"
          onClick={fetchReport}
          className="inline-flex items-center gap-1 text-[var(--yori-ink-strong)] font-semibold"
        >
          最新の情報に更新
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
