import Link from "next/link"
import { ArrowRight, ShieldCheck, UserCircle } from "lucide-react"

import { getExperts, type Expert } from "@/lib/api"

export const dynamic = "force-dynamic"

export default async function ConsultantsLandingPage() {
  let experts: Expert[] = []
  try {
    experts = await getExperts()
  } catch (err) {
    console.error("Failed to load experts for consultant landing", err)
  }

  return (
    <div className="w-full px-6 md:px-10 py-10 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-2">
          <p className="text-xs text-slate-500">Consultant Portal</p>
          <h1 className="text-3xl font-bold text-slate-900">相談員ダッシュボード</h1>
          <p className="text-sm text-slate-600">
            自分の担当予約とカルテをまとめて確認できます。担当IDを選ぶと、その相談員専用のダッシュボードに移動します。
          </p>
        </header>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#13274B]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">相談員を選択</p>
              <p className="text-xs text-slate-500">以下から担当者を選ぶか、URL直接指定で遷移できます。</p>
            </div>
          </div>
          {experts.length === 0 && (
            <p className="text-sm text-slate-500">相談員情報を取得できませんでした。URLで直接アクセスしてください。</p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {experts.map((exp) => (
              <Link
                key={exp.id}
                href={`/consultants/${exp.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-[#13274B] hover:bg-white transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#13274B]/10 border border-[#13274B]/20 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-[#13274B]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{exp.name}</p>
                    {exp.title && <p className="text-xs text-slate-600">{exp.title}</p>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Link>
            ))}
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            直接URLで開く: <span className="font-mono text-slate-800">/consultants/&lt;expertId&gt;</span>
          </div>
        </div>
      </div>
    </div>
  )
}
