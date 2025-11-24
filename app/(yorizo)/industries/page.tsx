"use client"

import { useRouter } from "next/navigation"

const industries = ["飲食", "美容", "製造", "小売", "サービス", "建設", "宿泊・観光", "その他"]

export default function IndustriesPage() {
  const router = useRouter()

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-4">
      <p className="text-sm text-slate-700">あなたの事業の業種を選ぶと、よくあるモヤモヤからチェックを始められます。</p>

      <div className="grid grid-cols-2 gap-2">
        {industries.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => router.push(`/wizard?industry=${encodeURIComponent(item)}`)}
            className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-3 text-sm font-semibold text-slate-800 shadow-sm"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

