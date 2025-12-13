"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { ChevronDownIcon } from "lucide-react"
import clsx from "clsx"
import {
  ResponsiveContainer,
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LabelList,
} from "recharts"

import { ThinkingRow } from "@/components/ThinkingRow"
import { ApiError, createHomework, getCompanyReport, listDocuments, type CompanyReport, type DocumentItem } from "@/lib/api"
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile"
import { PrimaryCtaButton } from "@/components/ui/PrimaryCtaButton"
import { SoftPillButton } from "@/components/ui/SoftPillButton"

const COMPANY_ID = "1"
const COMPANY_PROFILE_ID = "demo-user"
const USER_ID = COMPANY_PROFILE_ID

const KPI_AXES = ["売上持続性", "収益性", "健全性", "効率性", "安全性"]
const AXIS_KEY_MAP: Record<string, KpiKey> = {
  売上持続性: "sales_sustainability",
  収益性: "profitability",
  健全性: "soundness",
  効率性: "efficiency",
  安全性: "safety",
}

type KpiKey = "sales_sustainability" | "profitability" | "soundness" | "efficiency" | "safety"

type KpiDefinition = {
  key: KpiKey
  label: string
  short: string
  formula: string
  description: string
  hint: string
}

type KpiValueDto = {
  key: string
  label: string
  raw: number | null
  value_display: string
  unit?: string | null
  score: number | null
}

type KpiPeriodDto = {
  label: string
  scores: Array<number | null>
  raw_values: Array<number | null>
  kpis?: KpiValueDto[]
}

type CompanyReportWithKpi = CompanyReport & {
  radar: {
    axes: string[]
    periods: KpiPeriodDto[]
  }
}

type TodoSuggestion = {
  id: string
  title: string
  timeframe: string
  dueDate: string | null
  steps: string[]
  category: string
  detail: string
}

export const KPI_DEFINITIONS: KpiDefinition[] = [
  {
    key: "sales_sustainability",
    label: "売上持続性",
    short: "売上が増えているか・減っているかのスピード",
    formula: "（今年の売上 - 昨年の売上） ÷ 昨年の売上",
    description: "売上が前年と比べてどれくらい伸びているか（または減っているか）を見る指標です。",
    hint: "＋10％以上：成長傾向／0〜10％：横ばい／マイナス：要注意。",
  },
  {
    key: "profitability",
    label: "収益性（営業利益率）",
    short: "本業の売上からどれくらい利益を残せているか",
    formula: "営業利益 ÷ 売上高",
    description: "本業の売上に対して、どれくらい利益を残せているかを見る指標です。",
    hint: "5％以上：良好／0〜5％：薄利で改善余地あり／マイナス：本業赤字。",
  },
  {
    key: "soundness",
    label: "健全性（借入金の返しやすさ）",
    short: "借入金が本業で稼ぐお金の何年分か",
    formula: "（借入金 - 現預金） ÷ （営業利益 ＋ 減価償却費）",
    description: "借入金が、本業で稼ぐお金（営業利益＋減価償却費）の何年分かを示す指標です。",
    hint: "3倍未満：おおむね安心／3〜5倍：注意ゾーン／5倍超：返済計画の見直しが必要。",
  },
  {
    key: "efficiency",
    label: "効率性（お金の回りやすさ）",
    short: "売掛金・在庫に何か月分のお金が寝ているか",
    formula: "（売上債権 ＋ 在庫 - 仕入債務） ÷ 月商（＝売上高 ÷ 12）",
    description: "売掛金や在庫に、月商何か月分のお金が寝ているかを見る指標です。",
    hint: "1か月未満：回転良好／1〜2か月：ふつう／2か月超：条件や在庫の見直し余地あり。",
  },
  {
    key: "safety",
    label: "安全性（自己資本比率）",
    short: "返済不要のお金がどれくらいあるか",
    formula: "自己資本 ÷ 総資産",
    description: "返済不要のお金（自己資本）が全体のどれくらいを占めるかを見る指標です。",
    hint: "30％以上：比較的安心／10〜30％：標準〜やや薄め／10％未満：ショックに弱い状態。",
  },
]

const KPI_RADAR_COLOR_CURRENT = "#f97316"
const KPI_RADAR_COLOR_PREVIOUS = "#3b82f6"
const KPI_RADAR_COLOR_PRE_PREVIOUS = "#6b7280"

type ExpandableSectionBodyProps = {
  children: ReactNode
  initialLines?: 2 | 3 | 4 | 5
}

type AccordionSectionProps = {
  title: string
  summary: string
  children: ReactNode
  defaultOpen?: boolean
}

type KpiAccordionItemProps = {
  kpiKey: string
  title: string
  summary: string
  body: ReactNode
  isOpen: boolean
  onToggle: () => void
}

const summarizeOneLine = (text?: string | null): string => {
  if (!text) return ""
  const firstSentence = text.split("。")[0]
  return firstSentence.length > 0 ? `${firstSentence}。` : text
}

const formatDate = (value?: string | null): string => {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("ja-JP")
}

// 1行の「1.〜2.〜3.〜」形式の文字列を、項目ごとの配列に変換する
const splitTodoItems = (raw?: string | null): string[] => {
  if (!raw) return []
  const normalized = raw.replace(/\s+/g, " ")
  const parts = normalized.split(/(?=\d\.\s*)/)
  return parts
    .map((part) => part.replace(/^\d\.\s*/, "").trim())
    .filter(Boolean)
}

const formatDateInput = (daysFromNow: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

const TODO_TEMPLATES: Array<{
  match: RegExp
  timeframe: string
  dueInDays: number
  category: string
  steps: string[]
}> = [
  {
    match: /(sns|インスタ|twitter|x|投稿|リール|ショート)/i,
    timeframe: "今週中",
    dueInDays: 7,
    category: "SNS改善",
    steps: [
      "投稿テーマを3つ決めましょう",
      "参考投稿を3つ見て良い例を保存",
      "テンプレを1つ作って使い回す",
      "3本の下書きを書いてみましょう",
      "ハッシュタグと導線を決める",
      "投稿を予約するか予定を組む",
      "反応を1日1回見てメモする",
    ],
  },
  {
    match: /(価格|単価|値上げ|プロモ|キャンペーン|販促)/i,
    timeframe: "2週間以内",
    dueInDays: 14,
    category: "価格/販促",
    steps: [
      "主力3品の原価と粗利を見る",
      "値上げを+5%で試算してみる",
      "競合の価格を3つ調べる",
      "小さく試す案（商品/時間）を決める",
      "お知らせ文面を下書きする",
      "記録用のシートを作って数字を見る",
    ],
  },
  {
    match: /(在庫|キャッシュ|資金繰り|回収|支払い|入金|仕入)/i,
    timeframe: "1ヶ月以内",
    dueInDays: 28,
    category: "資金繰り/在庫",
    steps: [
      "30日分の入出金を書き出す",
      "回収が遅い先に連絡案を書く",
      "動きの遅い在庫を3つ決める",
      "仕入先1社に条件相談を打診する",
      "資金繰りカレンダーを作る",
      "不足しそうな日をチェックする",
      "必要なら短期資金の選択肢を調べる",
    ],
  },
]

const DEFAULT_TODO_TEMPLATE = {
  timeframe: "今週中",
  dueInDays: 7,
  category: "優先タスク",
  steps: [
    "ゴールを1文で書き出す（何ができれば完了か）",
    "今日できる最小ステップを1つ決める",
    "30分〜1時間の作業枠をカレンダーに入れる",
    "完了のチェックポイントをメモする",
    "作業後に振り返りメモを残す",
  ],
}

const buildTodoSuggestion = (title: string, id: string): TodoSuggestion => {
  const template = TODO_TEMPLATES.find((t) => t.match.test(title)) ?? DEFAULT_TODO_TEMPLATE
  const dueDate = template.dueInDays ? formatDateInput(template.dueInDays) : null
  const detailLines = [`【期限目安】${template.timeframe}${dueDate ? `（${dueDate}）` : ""}`, ...template.steps.map((s) => `- ${s}`)]
  return {
    id,
    title,
    timeframe: template.timeframe,
    dueDate,
    steps: template.steps,
    category: template.category,
    detail: detailLines.join("\n"),
  }
}

const formatKpiValue = (key: KpiKey, raw: number | null | undefined): string => {
  if (raw == null || Number.isNaN(raw)) {
    return "データなし"
  }
  const rounded = Number(raw.toFixed(1))
  switch (key) {
    case "sales_sustainability":
    case "profitability":
    case "safety":
      return `${rounded.toFixed(1)}%`
    case "soundness":
      return `${rounded.toFixed(1)}年`
    case "efficiency":
      return `${rounded.toFixed(1)}か月`
    default:
      return rounded.toFixed(1)
  }
}

const KpiLegend = ({
  currentColor,
  previousColor,
  prePreviousColor,
}: {
  currentColor: string
  previousColor: string
  prePreviousColor: string
}) => (
  <div className="flex flex-wrap justify-center gap-4 text-[11px] md:text-xs text-slate-600">
    <div className="inline-flex items-center gap-1">
      <span className="inline-block h-[6px] w-4 rounded-full" style={{ backgroundColor: currentColor }} />
      <span>最新決算期</span>
    </div>
    <div className="inline-flex items-center gap-1">
      <span className="inline-block h-[6px] w-4 rounded-full" style={{ backgroundColor: previousColor }} />
      <span>前期決算期</span>
    </div>
    <div className="inline-flex items-center gap-1">
      <span className="inline-block h-[6px] w-4 rounded-full" style={{ backgroundColor: prePreviousColor }} />
      <span>前々期決算期</span>
    </div>
  </div>
)

function AccordionSection({ title, summary, children, defaultOpen = false }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="yori-card rounded-3xl p-3 md:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h2 className="text-xs md:text-sm font-semibold text-slate-800">{title}</h2>
          <p className="mt-1 text-[11px] md:text-xs text-slate-500">{summary}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 inline-flex items-center rounded-full border border-[color:var(--yori-line-strong)] bg-sky-50/70 px-2.5 py-1 text-[11px] md:text-xs font-semibold text-sky-600 hover:bg-sky-50"
        >
          {open ? "閉じる ▲" : "開く ▼"}
        </button>
      </div>
      {open && <div className="mt-3 text-xs md:text-sm leading-relaxed text-slate-700 space-y-2">{children}</div>}
    </section>
  )
}

function ExpandableSectionBody({ children, initialLines = 3 }: ExpandableSectionBodyProps) {
  const [open, setOpen] = useState(false)
  const clampClass =
    initialLines === 2
      ? "line-clamp-2"
      : initialLines === 4
        ? "line-clamp-4"
        : initialLines === 5
          ? "line-clamp-5"
          : "line-clamp-3"

  return (
    <div className="mt-2">
      <div className="md:hidden">
        <div className={open ? "text-sm leading-relaxed text-slate-700" : `text-sm leading-relaxed text-slate-700 ${clampClass}`}>
          {children}
        </div>
        <div className="mt-2 border-t border-[color:var(--yori-line-strong-2)] pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-700"
          >
            {open ? "閉じる ▲" : "もっと見る ▼"}
          </button>
        </div>
      </div>
      <div className="hidden md:block text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  )
}

function RadarChart({ periods, axes }: { periods: CompanyReportWithKpi["radar"]["periods"]; axes: string[] }) {
  // periods expected with score (0-5); None treated as 0
  if (!periods?.length) {
    return (
      <div className="rounded-xl border border-[color:var(--yori-line-strong)] bg-white p-4 text-sm text-[var(--yori-ink-soft)]">
        まだ決算書が登録されていないため、レーダーチャートを表示できません。
      </div>
    )
  }

  const chartData = axes.map((label, idx) => ({
    label,
    latest: periods[0]?.scores?.[idx] ?? 0,
    previous: periods[1]?.scores?.[idx] ?? 0,
    pre_previous: periods[2]?.scores?.[idx] ?? 0,
  }))

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full max-w-[360px] h-[220px] md:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ReRadarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <defs>
              <linearGradient id="kpiRadarCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={KPI_RADAR_COLOR_CURRENT} stopOpacity={0.45} />
                <stop offset="100%" stopColor={KPI_RADAR_COLOR_CURRENT} stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <PolarGrid gridType="polygon" radialLines={false} stroke="#E2ECF5" strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
            <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
            <Radar
              name="最新決算期"
              dataKey="latest"
              stroke={KPI_RADAR_COLOR_CURRENT}
              strokeWidth={2.2}
              fill="url(#kpiRadarCurrent)"
              fillOpacity={1}
              dot={false}
            >
              <LabelList
                dataKey="latest"
                position="top"
                angle={0}
                content={(props) => {
                  const { x, y, value } = props
                  if (value == null) return null
                  return (
                    <text
                      x={x}
                      y={(((y as number) ?? 0) - 8)}
                      textAnchor="middle"
                      className="text-[10px] md:text-[11px] fill-slate-700"
                    >
                      {Math.round(value as number)}
                    </text>
                  )
                }}
              />
            </Radar>
            <Radar
              name="前期決算期"
              dataKey="previous"
              stroke={KPI_RADAR_COLOR_PREVIOUS}
              strokeWidth={1.8}
              fill="none"
              fillOpacity={0}
              dot={false}
            />
            <Radar
              name="前々期決算期"
              dataKey="pre_previous"
              stroke={KPI_RADAR_COLOR_PRE_PREVIOUS}
              fill="none"
              fillOpacity={0}
              strokeWidth={1.5}
              dot={false}
            />
          </ReRadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ValueTable({ periods, axes }: { periods: CompanyReportWithKpi["radar"]["periods"]; axes: string[] }) {
  if (!periods?.length) {
    return (
      <div className="rounded-xl border border-[color:var(--yori-line-strong)] bg-white p-4 text-sm text-[var(--yori-ink-soft)]">
        まだ決算書が登録されていないため、イマココレポートを表示できません。
      </div>
    )
  }
  return (
    <div className="overflow-auto rounded-xl border border-[color:var(--yori-line-strong)] bg-white">
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
          {axes.map((axis, rowIdx) => (
            <tr key={axis} className="border-t border-[color:var(--yori-line-strong-2)]">
              <td className="px-3 py-2 font-semibold text-[var(--yori-ink-strong)]">{axis}</td>
              {periods.map((p) => (
                <td key={`${axis}-${p.label}`} className="px-3 py-2 text-[var(--yori-ink)]">
                  {(() => {
                    const kpi = p.kpis?.find((k) => k.label === axis) || p.kpis?.find((k) => k.key === AXIS_KEY_MAP[axis])
                    if (kpi?.value_display) return kpi.value_display
                    const key = (kpi?.key as KpiKey) || AXIS_KEY_MAP[axis]
                    const raw = kpi?.raw ?? p.raw_values?.[rowIdx]
                    if (key) return formatKpiValue(key, raw)
                    if (raw == null) return "データなし"
                    const rounded = Number(raw.toFixed(1))
                    return rounded.toFixed(1)
                  })()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const KpiAccordionItem = ({ title, summary, body, isOpen, onToggle }: KpiAccordionItemProps) => (
  <div className="mb-2 last:mb-0">
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "flex w-full items-center justify-between rounded-2xl border border-[color:var(--yori-line-strong)] px-4 py-3 text-left transition-colors",
        "bg-[#F3FAFF]",
        isOpen && "bg-[#E4F3FF]",
      )}
    >
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-800">{title}</span>
        <span className="mt-0.5 text-[11px] text-slate-500">{summary}</span>
      </div>
      <ChevronDownIcon className={clsx("h-4 w-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
    </button>
    {isOpen && <div className="px-4 pb-4 pt-2 text-[11px] leading-relaxed text-slate-700">{body}</div>}
  </div>
)

export default function CompanyReportPage() {
  const router = useRouter()
  const { data: profile } = useCompanyProfile(COMPANY_PROFILE_ID)
  const [report, setReport] = useState<CompanyReportWithKpi | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openKpiKey, setOpenKpiKey] = useState<KpiKey | null>("sales_sustainability")
  const [latestDocuments, setLatestDocuments] = useState<DocumentItem[]>([])
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null)
  const [addingTodoId, setAddingTodoId] = useState<string | null>(null)
  const [todoError, setTodoError] = useState<string | null>(null)
  const [addedTodoIds, setAddedTodoIds] = useState<Record<string, boolean>>({})
  const [todoSuccessId, setTodoSuccessId] = useState<string | null>(null)

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = (await getCompanyReport(COMPANY_ID)) as unknown as CompanyReportWithKpi
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

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await listDocuments(COMPANY_PROFILE_ID)
        setLatestDocuments(docs)
      } catch (err) {
        console.error(err)
      }
    }
    void fetchDocs()
  }, [])

  const rawAxes = report?.radar?.axes?.length ? report.radar.axes : KPI_AXES
  const axes = KPI_AXES.filter((label) => rawAxes.includes(label))
  const periods = useMemo(() => report?.radar?.periods ?? [], [report])
  const isNoRadarData =
    !periods.length ||
    periods.every(
      (p) =>
        (!p.scores || p.scores.every((v) => v === null || v === undefined)) &&
        (!p.raw_values || p.raw_values.every((v) => v === null || v === undefined)),
    )
  const snapshotStrengths = report?.snapshot_strengths ?? []
  const snapshotWeaknesses = report?.snapshot_weaknesses ?? []
  const thinkingQuestions = report?.thinking_questions ?? []
  const companyName =
    report?.company?.company_name ||
    report?.company?.name ||
    profile?.company_name ||
    "会社"
  const summaryComment =
    (report?.gap_summary && report.gap_summary.trim()) ||
    (report?.current_state && report.current_state.trim()) ||
    "今のバランスを確認し、次の一歩を考えてみましょう。"

  const shortTermActions =
    (report?.action_plan ? report.action_plan.split(/\r?\n/).filter((l) => l.trim()) : []) || []
  const yorizoActions =
    (thinkingQuestions && thinkingQuestions.length ? thinkingQuestions : []).map((q) => q.trim())
  const topTodos = (shortTermActions || []).map((title, idx) => ({ id: `todo-${idx}`, title }))
  const companyId = report?.company?.id || COMPANY_ID
  const qualitative = report?.qualitative

  const overallDetail = report?.current_state || summaryComment
  const overallSummary = summarizeOneLine(overallDetail)

  const pointsSummary = summarizeOneLine(
    (snapshotStrengths && snapshotStrengths[0]) || (snapshotWeaknesses && snapshotWeaknesses[0]) || summaryComment,
  )

  const qualitativeFirst =
    qualitative &&
    Object.values(qualitative)
      .map((block) => Object.values(block)[0])
      .find((v) => v)
  const qualitativeSummary = summarizeOneLine((qualitativeFirst as string | undefined) || summaryComment)

  const futureDetail = report?.future_goal || report?.desired_image || ""
  const futureSummary = summarizeOneLine(futureDetail || summaryComment)
  const parsedTodos = splitTodoItems(report?.action_plan || "")
  const todoItems = parsedTodos.length ? parsedTodos : topTodos.map((t) => t.title).filter(Boolean)
  const todoSuggestions = useMemo(
    () => todoItems.slice(0, 3).map((title, idx) => buildTodoSuggestion(title, `todo-${idx}`)),
    [todoItems],
  )

  const handleAddHomework = async (todo: TodoSuggestion) => {
    setTodoError(null)
    setTodoSuccessId(null)
    setAddingTodoId(todo.id)
    try {
      await createHomework({
        user_id: USER_ID,
        title: todo.title,
        detail: todo.detail,
        category: todo.category,
        timeframe: todo.timeframe,
        due_date: todo.dueDate ?? undefined,
      })
      setAddedTodoIds((prev) => ({ ...prev, [todo.id]: true }))
      setTodoSuccessId(todo.id)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "ToDoへの追加に失敗しました。時間をおいて再試行してください。"
      setTodoError(message)
    } finally {
      setAddingTodoId(null)
    }
  }

  const qualitativeSections = [
    { title: "経営者の特徴", data: qualitative?.keieisha },
    { title: "スタッフ・組織", data: qualitative?.naibu },
    { title: "事業・商品/サービス", data: qualitative?.jigyo },
    { title: "立地・外部環境", data: qualitative?.kankyo },
  ]

  return (
    <div className="yori-report flex flex-col gap-6">
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
          <p className="text-sm text-[var(--yori-ink)]">チャット・ToDo・PDFをまとめて“いま”を俯瞰します。次の一歩もここから。</p>
        </div>
      </header>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {loading && (
        <div className="yori-card p-5">
          <ThinkingRow text="レポートを生成中です…" className="text-sm" />
        </div>
      )}

      {report && (
        <>
          <section className="mb-4 md:mb-6">
            <div className="rounded-2xl bg-[#FFF9E6] px-4 py-3 md:px-6 md:py-4 flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-yellow-500">📝</div>
              <div className="space-y-1 text-sm md:text-base">
                <p className="text-slate-700">
                  直近の決算やお話の内容から、「いまの会社のバランス」と「気になるポイント」をわかりやすく整理しました。まずは全体のイメージをつかんでみてください。
                </p>
              </div>
            </div>
          </section>

          <section className="yori-card rounded-3xl p-3 md:p-4 mt-3">
            <h2 className="text-xs md:text-sm font-semibold text-slate-800 mb-2">経営バランス診断</h2>
            {isNoRadarData ? (
              <div className="rounded-xl border border-[color:var(--yori-line-strong)] bg-white p-4 text-sm text-[var(--yori-ink-soft)]">
                決算書のデータが不足しているため、レーダーチャートを表示できません。
              </div>
            ) : (
              <div className="mt-2 grid gap-4 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] items-start">
                <div className="flex flex-col gap-3">
                  <RadarChart periods={periods} axes={axes} />
                  <KpiLegend
                    currentColor={KPI_RADAR_COLOR_CURRENT}
                    previousColor={KPI_RADAR_COLOR_PREVIOUS}
                    prePreviousColor={KPI_RADAR_COLOR_PRE_PREVIOUS}
                  />
                  <div className="text-xs md:text-sm leading-relaxed text-slate-600">
                    <ExpandableSectionBody initialLines={3}>
                      <p>{summaryComment}</p>
                    </ExpandableSectionBody>
                  </div>
                </div>
                <div className="space-y-3">
                  <ValueTable periods={periods} axes={axes} />
                  <div className="mt-4 rounded-2xl bg-white/70 border border-[color:var(--yori-line-strong-2)] p-3 md:p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">指標の見方</h3>
                      <p className="text-[11px] text-slate-400">（タップすると詳しい説明が開きます）</p>
                    </div>
                    <div className="space-y-2">
                      {KPI_DEFINITIONS.map((kpi) => (
                        <KpiAccordionItem
                          key={kpi.key}
                          kpiKey={kpi.key}
                          title={kpi.label}
                          summary={kpi.short}
                          body={
                            <>
                              <p className="mb-1">
                                <span className="font-semibold">計算式：</span>
                                {kpi.formula}
                              </p>
                              <p className="mb-1">
                                <span className="font-semibold">見方：</span>
                                {kpi.description}
                              </p>
                              {kpi.hint && (
                                <p className="text-slate-500">
                                  <span className="font-semibold">目安：</span>
                                  {kpi.hint}
                                </p>
                              )}
                            </>
                          }
                          isOpen={openKpiKey === kpi.key}
                          onToggle={() => setOpenKpiKey((prev) => (prev === kpi.key ? null : kpi.key))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

                    <section className="mt-3 space-y-3">
            <div className="yori-card rounded-3xl p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs md:text-sm font-semibold text-slate-800">いま取り組みたい ToDo</h2>
                <span className="text-[11px] md:text-xs text-slate-400">（3つまで表示）</span>
              </div>
              <div className="space-y-2">
                {todoSuggestions.length > 0 ? (
                  todoSuggestions.map((todo) => (
                    <div
                      key={todo.id}
                      className="rounded-2xl border border-[color:var(--yori-line-strong-2)] bg-white/80 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-slate-400">・</span>
                          <span className="text-sm font-semibold text-[var(--yori-ink-strong)]">{todo.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedTodoId((prev) => (prev === todo.id ? null : todo.id))}
                          className="text-[11px] md:text-xs font-semibold text-sky-600 hover:text-sky-700"
                        >
                          {expandedTodoId === todo.id ? "閉じる" : "詳細"}
                        </button>
                      </div>

                      {expandedTodoId === todo.id && (
                        <div className="mt-2 space-y-2 text-xs md:text-sm text-[var(--yori-ink)] leading-relaxed">
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-[color:var(--yori-line-strong-2)] px-2.5 py-1 text-[11px] md:text-xs text-slate-700">
                              期限目安: {todo.timeframe}
                              {todo.dueDate ? `（${todo.dueDate}）` : ""}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-[color:var(--yori-line-strong-2)] px-2.5 py-1 text-[11px] md:text-xs text-slate-700">
                              {todo.category}
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {todo.steps.map((step, stepIdx) => (
                              <li key={`${todo.id}-step-${stepIdx}`} className="flex items-start gap-2">
                                <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-sky-300" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddHomework(todo)}
                              disabled={addingTodoId === todo.id || addedTodoIds[todo.id]}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--yori-primary)] px-3 py-2 text-xs font-semibold text-[var(--yori-primary-ink)] shadow-sm disabled:opacity-60"
                            >
                              {addedTodoIds[todo.id] ? "追加済み" : addingTodoId === todo.id ? "追加中..." : "ToDoに追加"}
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push('/homework')}
                              className="text-[11px] md:text-xs font-semibold text-[var(--yori-ink-soft)] underline underline-offset-4"
                            >
                              ToDoを確認
                            </button>
                          </div>
                          {todoError && expandedTodoId === todo.id && (
                            <p className="text-[11px] text-rose-500">{todoError}</p>
                          )}
                          {todoSuccessId === todo.id && (
                            <p className="text-[11px] text-emerald-600">ToDoに追加しました。</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] md:text-xs text-slate-400">
                    いま取り組みたいことがあれば、チャットの中でいっしょに整理していきましょう。
                  </p>
                )}
              </div>
            </div>

            <div className="yori-card rounded-3xl p-3 md:p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xs md:text-sm font-semibold text-slate-800">会社情報</h2>
                  <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">経営の基本情報</p>
                  <p className="text-[11px] md:text-xs text-slate-400">相談に進む前に、会社の規模感や業種をさっと確認できます。</p>
                </div>
                <SoftPillButton label="会社情報を登録・更新する" onClick={() => router.push('/company')} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="rounded-2xl bg-sky-50 px-3 py-2">
                  <div className="text-[11px] text-slate-500">会社名</div>
                  <div className="text-xs md:text-sm text-slate-800">{profile?.company_name || "未登録"}</div>
                </div>
                <div className="rounded-2xl bg-sky-50 px-3 py-2">
                  <div className="text-[11px] text-slate-500">業種</div>
                  <div className="text-xs md:text-sm text-slate-800">{profile?.industry || "未登録"}</div>
                </div>
                <div className="rounded-2xl bg-sky-50 px-3 py-2">
                  <div className="text-[11px] text-slate-500">従業員数</div>
                  <div className="text-xs md:text-sm text-slate-800">{profile?.employees_range || "未登録"}</div>
                </div>
                <div className="rounded-2xl bg-sky-50 px-3 py-2">
                  <div className="text-[11px] text-slate-500">年商レンジ</div>
                  <div className="text-xs md:text-sm text-slate-800">{profile?.annual_sales_range || "未登録"}</div>
                </div>
              </div>
            </div>

            <div className="yori-card rounded-3xl p-3 md:p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xs md:text-sm font-semibold text-slate-800">書類アップロード</h2>
                  <p className="text-[11px] md:text-xs text-slate-500">決算書などの資料を登録して、レポートづくりに活かせます。</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/documents')}
                  className="inline-flex items-center whitespace-nowrap rounded-full bg-white/70 px-3 py-1.5 text-[11px] md:text-xs font-semibold text-sky-600 shadow-sm hover:bg-white"
                >
                  資料を登録・アップロードする
                </button>
              </div>
              <div className="space-y-1.5 text-[11px] md:text-xs text-slate-700">
                {latestDocuments.length === 0 ? (
                  <p className="text-slate-400">まだ資料が登録されていません。</p>
                ) : (
                  latestDocuments.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-2xl bg-sky-50 px-3 py-2">
                      <span className="truncate max-w-[60%]">{doc.period_label || doc.filename}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(doc.uploaded_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
<section className="mt-4 space-y-3">
            <AccordionSection title="経営の全体状況" summary={overallSummary} defaultOpen>
              <p>{overallDetail}</p>
            </AccordionSection>

            <AccordionSection title="浮かび上がったポイント" summary={pointsSummary}>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">良いところ（強み）</p>
                  <div className="flex flex-wrap gap-2">
                    {(snapshotStrengths || []).slice(0, 3).map((item, idx) => (
                      <div key={`${item}-${idx}`} className="rounded-2xl bg-sky-50 px-3 py-2 text-xs md:text-sm text-slate-800">
                        <span className="mr-1">✅</span>
                        {item}
                      </div>
                    ))}
                    {(!snapshotStrengths || snapshotStrengths.length === 0) && <div className="text-xs text-slate-500">まだ強みが整理されていません。</div>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">押さえておきたいポイント</p>
                  <ul className="space-y-1.5 text-xs md:text-sm text-amber-900">
                    {(snapshotWeaknesses || []).slice(0, 3).map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex gap-2">
                        <span className="mt-[3px] text-amber-500">●</span>
                        <span>{item}</span>
                      </li>
                    ))}
                    {(!snapshotWeaknesses || snapshotWeaknesses.length === 0) && <li className="text-xs text-amber-600">リスクはまだ整理されていません。</li>}
                  </ul>
                </div>
              </div>
            </AccordionSection>

            <AccordionSection title="企業の特徴" summary={qualitativeSummary}>
              <div className="grid gap-3 md:grid-cols-2">
                {qualitativeSections.map(({ title, data }) => (
                  <div key={title} className="rounded-2xl bg-white/80 p-3 border border-[color:var(--yori-line-strong-2)]">
                    <p className="text-xs font-semibold text-slate-800 mb-1">{title}</p>
                    {data && Object.keys(data).length > 0 ? (
                      <ul className="space-y-1 text-xs md:text-sm text-slate-700">
                        {Object.entries(data).map(([k, v]) => (
                          <li key={k}>
                            <span className="font-semibold text-slate-800">{k}：</span>
                            <span>{v}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-500">まだ情報が登録されていません。</p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="2〜3年後のイメージ・対策案" summary={futureSummary}>
              {futureDetail ? (
                <p>{futureDetail}</p>
              ) : (
                <p className="text-[11px] text-slate-500">2〜3年後のイメージはまだ登録されていません。</p>
              )}
            </AccordionSection>
          </section>

          <div className="mt-6 flex flex-col gap-2 md:flex-row md:justify-center">
            <PrimaryCtaButton
              label="よろず支援拠点に相談する"
              onClick={() => router.push("/yorozu")}
              className="w-full md:w-auto text-xs md:text-sm"
            />
            <PrimaryCtaButton
              label="もう一度タイプ診断する"
              onClick={() => router.push(`/companies/${companyId}/diagnosis`)}
              className="w-full md:w-auto text-xs md:text-sm"
            />
          </div>
        </>
      )}

      {!report && !loading && !error && (
        <div className="yori-card p-5 text-sm text-[var(--yori-ink-soft)]">レポートがまだ生成されていません。更新ボタンから取得してください。</div>
      )}
    </div>
  )
}











