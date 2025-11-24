"use client"

import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { MascotIcon } from "@/components/MascotIcon"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-6">
      <main className="space-y-8">
        <section className="space-y-4 pt-2">
          <div className="flex justify-center">
            <div className="rounded-3xl bg-white/95 px-4 py-3 shadow-sm text-slate-800 text-sm leading-relaxed max-w-full">
              今日も一日お疲れさま！Yorizoだよ。モヤモヤしていること、どんなことでも気軽に話してね🌱
            </div>
          </div>

          <div className="flex justify-center">
            <MascotIcon size="lg" />
          </div>

          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="w-full rounded-full bg-[#13274B] text-white py-4 text-base font-semibold shadow-md active:scale-98 transition-transform"
          >
            Yorizoとチャットで話す
          </button>

          <button
            type="button"
            onClick={() => router.push("/memory")}
            className="w-full text-center text-sm font-semibold text-slate-700 underline underline-offset-4"
          >
            Yorizoの記憶を見る ＞
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">機能</h2>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-5 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-pink-400 to-sky-300 text-white">
                <Heart className="h-4 w-4 fill-white" />
              </span>
              <p className="text-base font-semibold text-slate-800">気になる経営のモヤモヤ かんたんチェック</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              簡単な質問に答えるだけで、売上・資金繰り・人材などのモヤモヤを整理できるよ。
            </p>
            <button
              type="button"
              onClick={() => router.push("/wizard")}
              className="w-full rounded-full bg-[#13274B] text-white py-3 font-semibold shadow-sm active:scale-98 transition-transform"
            >
              気になることをチェック
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
