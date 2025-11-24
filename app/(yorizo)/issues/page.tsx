"use client"

import { useRouter } from "next/navigation"

const issueList = [
  "売上が伸びない",
  "利益が残らない",
  "資金繰りが不安",
  "新規客が増えない",
  "常連が減っている",
  "人手不足",
  "採用がうまくいかない",
  "IT・DXが遅れている",
  "事業承継が不安",
  "そもそも何が課題か分からない",
]

export default function IssuesPage() {
  const router = useRouter()

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-4">
      <p className="text-sm text-slate-700">いま気になっている“モヤモヤ”に近いものを選んでください。</p>

      <div className="flex flex-wrap gap-2">
        {issueList.map((issue) => (
          <button
            key={issue}
            type="button"
            onClick={() => router.push(`/wizard?concern=${encodeURIComponent(issue)}`)}
            className="pill bg-white/90 border border-white/80 text-slate-800"
          >
            {issue}
          </button>
        ))}
      </div>
    </div>
  )
}

