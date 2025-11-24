"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Step = 1 | 2 | 3

const industries = ["飲食", "美容", "製造", "小売", "サービス", "その他"]
const employeeRanges = ["1〜4人", "5〜9人", "10〜19人", "20人以上"]
const salesRanges = ["〜1,000万円", "1,000〜5,000万円", "5,000万円〜1億円", "1億円以上"]
const concerns = [
  "売上をもっと伸ばしたい",
  "資金繰りが不安",
  "人手が足りない／採用がうまくいかない",
  "ITやDXが遅れている",
  "事業の先行きが漠然と不安",
  "何が課題かよく分からない",
]

export default function WizardPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    industry: "",
    employees: "",
    salesRange: "",
    concern: "",
    detail: "",
  })
  const [error, setError] = useState("")

  const canGoNext = useMemo(() => {
    if (step === 1) return !!(form.industry && form.employees && form.salesRange)
    if (step === 2) return !!form.concern
    return true
  }, [step, form])

  const nextStep = () => {
    if (!canGoNext) {
      setError("必須項目を入力してください。")
      return
    }
    setError("")
    setStep((prev) => (prev === 3 ? prev : ((prev + 1) as Step)))
  }

  const prevStep = () => setStep((prev) => (prev === 1 ? prev : ((prev - 1) as Step)))

  const handleSubmit = () => {
    const query = new URLSearchParams({
      industry: form.industry,
      employees: form.employees,
      salesRange: form.salesRange,
      concern: form.concern,
      detail: form.detail,
    })
    router.push(`/result?${query.toString()}`)
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-4">
      <div className="space-y-3">
        <p className="text-sm text-slate-600">ステップ {step} / 3</p>
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-[#13274B] transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white/95 rounded-3xl shadow-sm border border-white/80 p-4 space-y-4">
        {step === 1 && (
          <>
            <h2 className="text-base font-semibold text-slate-800">あなたの事業について教えてください</h2>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">業種</p>
              <div className="grid grid-cols-2 gap-2">
                {industries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, industry: item }))}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      form.industry === item
                        ? "border-[#13274B] bg-[#13274B] text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">従業員数</p>
              <div className="grid grid-cols-2 gap-2">
                {employeeRanges.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, employees: item }))}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      form.employees === item
                        ? "border-[#13274B] bg-[#13274B] text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">年間売上規模</p>
              <div className="grid grid-cols-2 gap-2">
                {salesRanges.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, salesRange: item }))}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      form.salesRange === item
                        ? "border-[#13274B] bg-[#13274B] text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-base font-semibold text-slate-800">今、一番近いお悩みはどれですか？</h2>
            <div className="grid grid-cols-1 gap-2">
              {concerns.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, concern: item }))}
                  className={`rounded-2xl border px-3 py-3 text-sm text-left ${
                    form.concern === item
                      ? "border-[#13274B] bg-[#13274B] text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-base font-semibold text-slate-800">もう少しだけ詳しく教えてください（任意）</h2>
            <textarea
              value={form.detail}
              onChange={(e) => setForm((prev) => ({ ...prev, detail: e.target.value }))}
              placeholder="最近の状況や具体的に困っていることを書いてください"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm min-h-[140px] focus:outline-none focus:ring-2 focus:ring-[#13274B]"
            />
          </>
        )}

        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 rounded-full border border-slate-300 text-slate-700 py-3 text-sm font-semibold active:scale-98 transition-transform"
        >
          戻る
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform"
          >
            次へ進む
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform"
          >
            結果を見る
          </button>
        )}
      </div>
    </div>
  )
}

