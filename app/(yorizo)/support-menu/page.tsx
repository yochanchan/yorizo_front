"use client"

import { useRouter } from "next/navigation"

const menus = ["補助金・助成金", "融資・資金繰り", "専門家派遣", "IT・DX・EC", "事業承継・M&A"]

export default function SupportMenuPage() {
  const router = useRouter()

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-4">
      <p className="text-sm text-slate-700">気になっている支援メニューを選ぶと、関連するモヤモヤを整理できます。</p>

      <div className="space-y-2">
        {menus.map((menu) => (
          <button
            key={menu}
            type="button"
            onClick={() => router.push(`/wizard?menu=${encodeURIComponent(menu)}`)}
            className="w-full rounded-2xl bg-white/90 border border-white/80 px-4 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm"
          >
            {menu}
          </button>
        ))}
      </div>
    </div>
  )
}
