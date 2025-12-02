"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RefreshCcw, Sparkles } from "lucide-react"

import { CompanyInfoSummaryCard } from "@/components/company/CompanyInfoSummaryCard"
import { getCompanyAnalysisReport, type CompanyAnalysisReport, type LocalBenchmarkAxis } from "@/lib/api"
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile"

import { IMAKOKO_LABELS } from "./labels"

const USER_ID = "demo-user"

function RadarChart({ axes }: { axes: LocalBenchmarkAxis[] }) {
  if (!axes?.length) return null

  const size = 260
  const center = size / 2
  const radius = center - 24
  const angleStep = (2 * Math.PI) / axes.length
  const levels = 4

  const pointFor = (score: number, index: number) => {
    const clamped = Math.max(0, Math.min(100, score || 0))
    const r = (clamped / 100) * radius
    const angle = -Math.PI / 2 + index * angleStep
    const x = center + r * Math.cos(angle)
    const y = center + r * Math.sin(angle)
    return `${x},${y}`
  }

  const polygonPoints = axes.map((axis, index) => pointFor(axis.score ?? 0, index)).join(" ")
  const gridLevels = Array.from({ length: levels }, (_, i) => (i + 1) / levels)

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g stroke="rgba(61, 76, 104, 0.15)" strokeWidth={1} fill="none">
          {gridLevels.map((level) => {
            const points = axes
              .map((_, index) => {
                const value = level * 100
                return pointFor(value, index)
              })
              .join(" ")
            return <polygon key={level} points={points} />
          })}
        </g>
        <polygon points={polygonPoints} fill="rgba(79, 93, 154, 0.2)" stroke="rgba(79, 93, 154, 0.7)" strokeWidth={2} />
        {axes.map((axis, index) => {
          const angle = -Math.PI / 2 + index * angleStep
          const labelRadius = radius + 14
          const x = center + labelRadius * Math.cos(angle)
          const y = center + labelRadius * Math.sin(angle)
          return (
            <g key={axis.id}>
              <line
                x1={center}
                y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="rgba(61, 76, 104, 0.2)"
                strokeWidth={1}
              />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-[var(--yori-ink-strong)]">
                {axis.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[var(--yori-outline)] bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{value || "準備中"}</p>
    </div>
  )
}

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
      setError(err instanceof Error ? err.message : "イマココレポートを取得できませんでした。")
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

  const benchmarkAxes = report?.local_benchmark?.axes ?? []
  const painPointItems = useMemo(() => {
    const items: string[] = []
    report?.pain_points?.forEach((group) => items.push(...group.items))
    return items
  }, [report])

  const strengths = report?.strengths ?? []
  const weaknesses = report?.weaknesses ?? []
  const actionItems = report?.action_items ?? []
  const commentText = report?.basic_info_note || report?.summary || ""

  const consultationTheme = report?.summary?.trim() || "チャット相談の内容から整理しています。"
  const consultationPeriod = report?.last_updated_at
    ? `${new Date(report.last_updated_at).toLocaleDateString("ja-JP")} 時点のチャット相談`
    : "チャット相談全期間"
  const infoSources = "チャット履歴 / 会社プロフィール / 添付資料"

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
            Yorizoの記憶へ戻る
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
        <div className="space-y-2">
          <p className="text-xs text-[var(--yori-ink-soft)]">最終更新: {formattedUpdatedAt}</p>
          <h1 className="text-2xl font-bold text-[var(--yori-ink-strong)]">{IMAKOKO_LABELS.title}</h1>
          <p className="text-base font-semibold text-[var(--yori-ink-strong)]">{IMAKOKO_LABELS.subtitle}</p>
          <p className="text-sm text-[var(--yori-ink)] leading-relaxed whitespace-pre-line">{IMAKOKO_LABELS.lead}</p>
        </div>
      </header>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {isLoading && (
        <div className="yori-card p-5 text-sm text-[var(--yori-ink-soft)] flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          レポートを生成中です…
        </div>
      )}

      {report && (
        <>
          <section className="yori-card p-5 md:p-6 space-y-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-[var(--yori-primary)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{IMAKOKO_LABELS.scopeTitle}</p>
                <p className="text-xs text-[var(--yori-ink-soft)]">
                  直近の相談をもとに、今回の整理対象をまとめました。
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <InfoRow label="相談テーマ" value={consultationTheme} />
              <InfoRow label="相談期間" value={consultationPeriod} />
              <InfoRow label="元になった情報" value={infoSources} />
            </div>
          </section>

          <section className="yori-card p-5 md:p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{IMAKOKO_LABELS.financeTitle}</p>
              <p className="text-xs text-[var(--yori-ink-soft)]">ローカルベンチマークをもとにした簡易スコアです。</p>
            </div>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              売上・利益・生産性など、いくつかの指標をもとに、あなたの会社の「今の立ち位置」をレーダーチャートで表しています。
            </p>
            {benchmarkAxes.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="flex justify-center">
                  <RadarChart axes={benchmarkAxes} />
                </div>
                <div className="space-y-2">
                  {benchmarkAxes.map((axis) => (
                    <div
                      key={axis.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--yori-outline)] bg-white/80 px-3 py-2"
                    >
                      <p className="text-sm text-[var(--yori-ink-strong)]">{axis.label}</p>
                      <span className="text-sm font-semibold text-[var(--yori-ink)]">{axis.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {benchmarkAxes.length > 0 && (
              <div className="yori-card bg-white/70 border border-[var(--yori-outline)] p-4 space-y-2">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">この評価の理由</p>
                <ul className="space-y-1 text-sm text-[var(--yori-ink)]">
                  {benchmarkAxes.map((axis) => (
                    <li key={`reason-${axis.id}`} className="leading-relaxed">
                      <span className="font-semibold">{axis.label}</span>: {axis.reason || "理由は準備中です。"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="yori-card bg-[var(--yori-surface-muted)] border border-[var(--yori-outline)] p-4 space-y-2 md:col-span-3">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{IMAKOKO_LABELS.commentTitle}</p>
                <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
                  {commentText || "コメントは準備中です。"}
                </p>
              </div>
              <div className="yori-card bg-[var(--yori-surface-muted)] border border-[var(--yori-outline)] p-4 space-y-2">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{IMAKOKO_LABELS.strengthsTitle}</p>
                {strengths.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)]">
                    {strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--yori-ink)]">強みはこれから整理します。</p>
                )}
              </div>
              <div className="yori-card bg-[var(--yori-surface-muted)] border border-[var(--yori-outline)] p-4 space-y-2 md:col-span-2">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{IMAKOKO_LABELS.weaknessesTitle}</p>
                {weaknesses.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)]">
                    {weaknesses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--yori-ink)]">これから伸ばしたいところは準備中です。</p>
                )}
              </div>
            </div>
          </section>

          <CompanyInfoSummaryCard profile={profile} loading={loadingProfile} onEdit={() => router.push("/company")} />

          <section className="yori-card p-5 md:p-6 space-y-3">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{IMAKOKO_LABELS.concernsTitle}</p>
            <p className="text-xs text-[var(--yori-ink-soft)]">Yorizoとの会話から整理した“モヤモヤ”です。</p>
            {painPointItems.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)]">
                {painPointItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--yori-ink)]">最近の気になることはまだ抽出されていません。</p>
            )}
          </section>

          <section className="yori-card p-5 md:p-6 space-y-3">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{IMAKOKO_LABELS.hintsTitle}</p>
            <p className="text-xs text-[var(--yori-ink-soft)]">
              Yorizoが会話やデータをもとに提案する、次の一歩の候補です。
            </p>
            {actionItems.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)]">
                {actionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--yori-ink)]">提案は準備中です。</p>
            )}
          </section>
        </>
      )}

      {!report && !isLoading && !error && (
        <div className="yori-card p-5 text-sm text-[var(--yori-ink-soft)]">
          イマココレポートはまだ生成されていません。レポートを更新ボタンから取得してください。
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
