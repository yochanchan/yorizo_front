"use client"

import { useRouter } from "next/navigation"

type ResultPageProps = {
  searchParams: {
    industry?: string
    employees?: string
    salesRange?: string
    concern?: string
    detail?: string
  }
}

type Insight = {
  title: string
  summary: string
  todos: string[]
}

const defaultInsight: Insight = {
  title: "モヤモヤの整理を進めましょう",
  summary: "気になっていることを整理すると、次の一歩が見えやすくなります。数字や事実、感じていることを分けてメモすると考えやすいです。",
  todos: [
    "気になるテーマを一行で書き出す",
    "数字・事実・仮説に分けてメモする",
    "優先度を付けて上位1〜2個に集中する",
  ],
}

function getDiagnosisSummary(concern?: string): Insight {
  if (!concern) return defaultInsight
  if (concern.includes("売上")) {
    return {
      title: "売上の伸び悩みが、いちばんのモヤモヤですね。",
      summary: "直近3か月の客数・単価・回数を分けて把握すると、次の施策が選びやすくなります。",
      todos: [
        "客数・客単価・購買回数を紙に書き出す",
        "粗利率が高い商品やサービスを洗い出す",
        "既存客向けの再来店施策を1つ決める",
      ],
    }
  }
  if (concern.includes("資金") || concern.includes("資金繰り")) {
    return {
      title: "資金繰りの不安が大きい状態です。",
      summary: "入出金のタイミングをカレンダーで可視化し、固定費を先に確保することが第一歩です。",
      todos: [
        "今月と来月の入出金カレンダーを作る",
        "固定費と変動費を分けて書き出す",
        "支払サイトや入金サイトを確認し、交渉余地がないか探る",
      ],
    }
  }
  if (concern.includes("人手") || concern.includes("採用")) {
    return {
      title: "人手不足・採用の整理が必要そうです。",
      summary: "業務を棚卸しして優先度を付け、外注やパート活用も視野に入れましょう。",
      todos: [
        "業務を30個ほど箇条書きで棚卸しする",
        "優先度と頻度で仕分けし、外注できるものを探す",
        "1〜2つだけ今日やるタスクを決める",
      ],
    }
  }
  if (concern.includes("IT") || concern.includes("DX")) {
    return {
      title: "IT・DXの第一歩を小さく始めましょう。",
      summary: "目標を1つに絞り、無料ツールから小さく試すと進めやすいです。",
      todos: [
        "困っている業務を1つ選ぶ",
        "既存ツールの活用度を振り返る",
        "無料・低コストのSaaSを1つ試す",
      ],
    }
  }
  return defaultInsight
}

export default function ResultPage({ searchParams }: ResultPageProps) {
  const router = useRouter()
  const insight = getDiagnosisSummary(searchParams.concern)

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-16 space-y-4">
      <div className="space-y-3">
        <p className="text-base font-semibold text-slate-800">診断、おつかれさまでした！</p>
        <div className="bg-white/95 rounded-3xl shadow-sm border border-white/80 p-4 space-y-2">
          <p className="text-sm font-semibold text-slate-800">あなたの今の状態</p>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
            {searchParams.industry && <span className="rounded-full bg-slate-100 px-3 py-1">業種：{searchParams.industry}</span>}
            {searchParams.employees && <span className="rounded-full bg-slate-100 px-3 py-1">従業員：{searchParams.employees}</span>}
            {searchParams.salesRange && <span className="rounded-full bg-slate-100 px-3 py-1">売上規模：{searchParams.salesRange}</span>}
            {searchParams.concern && <span className="rounded-full bg-slate-100 px-3 py-1">主なお悩み：{searchParams.concern}</span>}
          </div>
          <h3 className="text-sm font-semibold text-slate-800">{insight.title}</h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{insight.summary}</p>
        </div>

        <div className="bg-white/95 rounded-3xl shadow-sm border border-white/80 p-4 space-y-2">
          <p className="text-sm font-semibold text-slate-800">次の一歩</p>
          <ul className="space-y-2">
            {insight.todos.map((todo) => (
              <li key={todo} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1 block h-2 w-2 rounded-full bg-[#13274B]" />
                <span>{todo}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href="#"
            className="w-full text-center rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform"
          >
            よろず支援拠点に相談したい
          </a>
          <button
            type="button"
            onClick={() => router.push("/wizard")}
            className="w-full rounded-full border border-slate-300 text-slate-700 py-3 text-sm font-semibold active:scale-98 transition-transform"
          >
            もう一度診断する
          </button>
        </div>
      </div>
    </div>
  )
}

