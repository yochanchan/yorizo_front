"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"

import { CompanyInfoSummaryCard } from "@/components/company/CompanyInfoSummaryCard"
import { getCompanyReport, type CompanyReport } from "@/lib/api"
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile"

const COMPANY_ID = "1"
const COMPANY_PROFILE_ID = "demo-user"

const AXIS_COLORS = ["#f97316", "#3b82f6", "#6b7280"]
const RADAR_AXES = ["売上持続性", "収益性", "生産性", "健全性", "効率性", "安全性"]

type Point = { x: number; y: number }

function buildPoints(scores: number[], size = 280): string {
  const center = size / 2
  const radius = center - 24
  const angleStep = (2 * Math.PI) / scores.length
  const pts: Point[] = []
  scores.forEach((score, idx) => {
    const normalized = Math.max(0, Math.min(5, score))
    const r = (normalized / 5) * radius
    const angle = -Math.PI / 2 + idx * angleStep
    pts.push({ x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) })
  })
  return pts.map((p) => `${p.x},${p.y}`).join(" ")
}

function RadarChart({ periods }: { periods: CompanyReport["radar"]["periods"] }) {
  if (!periods?.length) return null
  const size = 320
  const center = size / 2
  const radius = center - 24
  const levels = [1, 2, 3, 4, 5]
  const angleStep = (2 * Math.PI) / RADAR_AXES.length

  const gridPolygons = levels.map((level) => {
    const points = RADAR_AXES.map((_, idx) => {
      const r = (level / 5) * radius
      const angle = -Math.PI / 2 + idx * angleStep
      const x = center + r * Math.cos(angle)
      const y = center + r * Math.sin(angle)
      return `${x},${y}`
    }).join(" ")
    return points
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <g stroke="#e5e7eb" strokeWidth={1} fill="none">
        {gridPolygons.map((pts, idx) => (
          <polygon key={`grid-${idx}`} points={pts} />
        ))}
        {RADAR_AXES.map((_, idx) => {
          const angle = -Math.PI / 2 + idx * angleStep
          return (
            <line
              key={`axis-${idx}`}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          )
        })}
      </g>
      {periods.map((period, idx) => (
        <polygon
          key={period.label}
          points={buildPoints(period.scores, size)}
          fill={idx === 0 ? `${AXIS_COLORS[idx]}20` : "none"}
          stroke={AXIS_COLORS[idx % AXIS_COLORS.length]}
          strokeWidth={2}
          strokeDasharray={idx === 0 ? "0" : "6 4"}
        />
      ))}
      {RADAR_AXES.map((label, idx) => {
        const angle = -Math.PI / 2 + idx * angleStep
        const labelRadius = radius + 16
        const x = center + labelRadius * Math.cos(angle)
        const y = center + labelRadius * Math.sin(angle)
        return (
          <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[11px] fill-[var(--yori-ink-strong)]">
            {label}
          </text>
        )
      })}
    </svg>
  )
}

function ValueTable({ periods }: { periods: CompanyReport["radar"]["periods"] }) {
  if (!periods?.length) return null
  return (
    <div className="overflow-auto rounded-xl border border-[var(--yori-outline)] bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--yori-secondary)] text-[var(--yori-ink-strong)]">
          <tr>
            <th className="px-3 py-2 text-left">指標</th>
            {periods.map((p) => (
              <th key={p.label} className="px-3 py-2 text-left">
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RADAR_AXES.map((axis, rowIdx) => (
            <tr key={axis} className="border-t border-[var(--yori-outline)]">
              <td className="px-3 py-2 font-semibold text-[var(--yori-ink-strong)]">{axis}</td>
              {periods.map((p) => (
                <td key={`${axis}-${p.label}`} className="px-3 py-2 text-[var(--yori-ink)]">
                  {p.raw_values?.[rowIdx] !== undefined && p.raw_values?.[rowIdx] !== null
                    ? p.raw_values[rowIdx]?.toLocaleString("ja-JP")
                    : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QualTable({ title, rows }: { title: string; rows: Record<string, string> }) {
  return (
    <div className="rounded-xl border border-[var(--yori-outline)] bg-white">
      <div className="border-b border-[var(--yori-outline)] px-3 py-2 text-xs font-semibold text-[var(--yori-ink-soft)]">{title}</div>
      <div className="divide-y divide-[var(--yori-outline)]">
        {Object.entries(rows).map(([label, value]) => (
          <div key={label} className="grid grid-cols-[180px,1fr] items-start">
            <div className="bg-[var(--yori-secondary)] px-3 py-3 text-[11px] font-semibold text-[var(--yori-ink-strong)]">{label}</div>
            <div className="px-3 py-3 text-sm text-[var(--yori-ink)]">{value || "―"}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ThreeBlock({ current, future, action }: { current: string; future: string; action: string }) {
  const items = [
    { label: "現状認識", value: current },
    { label: "将来目標", value: future },
    { label: "対応策", value: action },
  ]
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-[var(--yori-outline)] bg-white p-4 space-y-1">
          <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">{item.label}</p>
          <p className="text-sm text-[var(--yori-ink)] leading-relaxed whitespace-pre-wrap">{item.value || "―"}</p>
        </div>
      ))}
    </div>
  )
}

function SnapshotSection({ state, strengths, weaknesses }: { state: string; strengths: string[]; weaknesses: string[] }) {
  return (
    <section className="yori-card p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--yori-ink-strong)]">
        <Sparkles className="h-4 w-4" /> 現状スナップショット
      </div>
      <p className="text-xs text-[var(--yori-ink-soft)]">ローカルベンチマーク指標とチャット内容から、強みとリスクを一枚で把握できます。</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--yori-outline)] bg-white p-4">
          <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">いまの状態メモ</p>
          <p className="text-sm text-[var(--yori-ink)] leading-relaxed whitespace-pre-wrap mt-1">{state || "Yorizoが整理中です。"}</p>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">強み</p>
            {strengths.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-[var(--yori-ink)] space-y-1">
                {strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--yori-ink)]">まだ抽出されていません。</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">リスク・弱み</p>
            {weaknesses.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-[var(--yori-ink)] space-y-1">
                {weaknesses.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--yori-ink)]">まだ抽出されていません。</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function FuturePlanningSection({ desired, gap, questions }: { desired: string; gap: string; questions: string[] }) {
  return (
    <section className="yori-card p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--yori-ink-strong)]">
        <Sparkles className="h-4 w-4" /> これからのイメージ
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--yori-outline)] bg-white p-4 space-y-2">
          <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">目指す姿</p>
          <p className="text-sm text-[var(--yori-ink)] leading-relaxed whitespace-pre-wrap">{desired || "将来像はこれから整理します。"}</p>
          <p className="text-xs font-semibold text-[var(--yori-ink-soft)] pt-2">現状とのギャップ</p>
          <p className="text-sm text-[var(--yori-ink)] leading-relaxed whitespace-pre-wrap">{gap || "ギャップの整理はこれからです。"}</p>
        </div>
        <div className="rounded-2xl border border-[var(--yori-outline)] bg-white p-4 space-y-2">
          <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">考えるための問い</p>
          {questions.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-[var(--yori-ink)] space-y-1">
              {questions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--yori-ink)]">Yorizoが問いを準備しています。</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default function CompanyReportPage() {
  const router = useRouter()
  const { data: profile, isLoading: loadingProfile } = useCompanyProfile(COMPANY_PROFILE_ID)
  const [report, setReport] = useState<CompanyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCompanyReport(COMPANY_ID)
      setReport(data)
    } catch (err) {
      console.error(err)
      setError("レポートを取得できませんでした。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchReport()
  }, [])

  const periods = useMemo(() => report?.radar?.periods ?? [], [report])
  const snapshotStrengths = report?.snapshot_strengths ?? []
  const snapshotWeaknesses = report?.snapshot_weaknesses ?? []
  const thinkingQuestions = report?.thinking_questions ?? []

  return (
    <div className="flex flex-col gap-6">
      <header className="yori-card-muted p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-[var(--yori-ink)]">
            <ArrowLeft className="h-4 w-4" /> 戻る
          </button>
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            レポートを更新
          </button>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--yori-ink-strong)]">イマココレポート</h1>
          <p className="text-sm text-[var(--yori-ink)]">チャット・決算書・宿題・PDFをまとめた「いま」の鏡です。将来の一歩を考えるために活用してください。</p>
        </div>
      </header>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {loading && (
        <div className="yori-card p-5 text-sm text-[var(--yori-ink-soft)] flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          レポートを生成中です…
        </div>
      )}

      {report && (
        <>
          <section className="yori-card p-5 md:p-6 space-y-4">
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <RadarChart periods={periods} />
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-[var(--yori-ink)]">
                  <span className="inline-flex items-center gap-1 text-[var(--yori-ink-strong)]">
                    <span className="h-2 w-4 rounded-full bg-[#f97316]" /> 最新決算期
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--yori-ink-strong)]">
                    <span className="h-2 w-4 rounded-full border border-[#3b82f6] bg-transparent" /> 前期決算期
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--yori-ink-strong)]">
                    <span className="h-2 w-4 rounded-full border border-[#6b7280] bg-transparent" /> 前々期決算期
                  </span>
                </div>
                <ValueTable periods={periods} />
              </div>
            </div>
          </section>

          <CompanyInfoSummaryCard profile={profile} company={report.company} loading={loadingProfile} onEdit={() => router.push("/company")} />

          <SnapshotSection state={report.current_state} strengths={snapshotStrengths} weaknesses={snapshotWeaknesses} />

          <section className="yori-card p-5 md:p-6 space-y-4">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">企業の特徴</p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <QualTable title="① 経営者" rows={report.qualitative.keieisha} />
                <QualTable title="② 事業" rows={report.qualitative.jigyo} />
              </div>
              <div className="space-y-3">
                <QualTable title="③ 企業を取り巻く環境・関係者" rows={report.qualitative.kankyo} />
                <QualTable title="④ 内部管理体制" rows={report.qualitative.naibu} />
              </div>
            </div>
          </section>

          <FuturePlanningSection desired={report.desired_image || ""} gap={report.gap_summary || ""} questions={thinkingQuestions} />

          <section className="yori-card p-5 md:p-6 space-y-3">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">現状 → 将来 → 対応策</p>
            <ThreeBlock current={report.current_state} future={report.future_goal} action={report.action_plan} />
          </section>
        </>
      )}

      {!report && !loading && !error && (
        <div className="yori-card p-5 text-sm text-[var(--yori-ink-soft)]">レポートがまだ生成されていません。更新ボタンから取得してください。</div>
      )}
    </div>
  )
}
