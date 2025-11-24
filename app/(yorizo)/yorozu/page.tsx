"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Star, MapPin, Tag, Loader2, Users } from "lucide-react"
import { getExperts, type Expert } from "@/lib/api"

export default function YorozuExpertsPage() {
  const router = useRouter()
  const [experts, setExperts] = useState<Expert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const data = await getExperts()
        setExperts(data)
      } catch (err) {
        console.error(err)
        setError("専門家の情報を取得できませんでした。")
      } finally {
        setIsLoading(false)
      }
    }
    fetchExperts()
  }, [])

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-4 pt-2">
      <div className="space-y-1">
        <p className="text-[11px] text-slate-500">あなたの課題に寄り添う専門家を選んでください</p>
        <h1 className="text-xl font-bold text-slate-900 leading-snug">専門家を選択</h1>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>読み込み中...</span>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="space-y-4">
        {experts.map((expert) => (
          <div
            key={expert.id}
            className="bg-gradient-to-br from-amber-50 via-white to-yellow-50 rounded-3xl shadow-sm border border-amber-100 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-white border border-amber-100 flex items-center justify-center text-sm font-semibold text-[#13274B]">
                {expert.name.slice(0, 2)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-base font-semibold text-slate-900">{expert.name}</p>
                <p className="text-xs font-semibold text-slate-700">{expert.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                  <span>{expert.rating.toFixed(1)}</span>
                  <span>({expert.review_count})</span>
                  {expert.location_prefecture && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {expert.location_prefecture}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{expert.description}</p>
            <div className="flex flex-wrap gap-2">
              {expert.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-amber-200 text-[11px] text-slate-700 px-3 py-1"
                >
                  <Tag className="h-3 w-3 text-amber-500" />
                  {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => router.push(`/yorozu/experts/${expert.id}/schedule`)}
              className="w-full rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform"
            >
              この専門家に相談する
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white/90 border border-slate-200 shadow-sm p-4 flex items-start gap-3">
        <Users className="h-6 w-6 text-[#13274B]" />
        <p className="text-xs text-slate-700 leading-relaxed">
          相談メモを開きながら、よろず支援拠点のコーディネーターと次の一歩を整理できます。
        </p>
      </div>
    </div>
  )
}
