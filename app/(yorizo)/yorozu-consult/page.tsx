"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LegacyYorozuConsultPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/yorozu")
  }, [router])

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 pt-4 space-y-3">
      <p className="text-sm text-slate-700">新しい「よろず相談」ページに移動しています…</p>
      <button
        type="button"
        onClick={() => router.push("/yorozu")}
        className="rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm"
      >
        手動で移動する
      </button>
    </div>
  )
}
