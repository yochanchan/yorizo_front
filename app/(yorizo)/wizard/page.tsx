"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Step = 1 | 2 | 3

const industries = ["飲食", "小売", "サービス", "製造", "IT/DX", "その他"]
const employeeRanges = ["〜5名", "6〜20名", "21〜50名", "51名〜"]
const salesRanges = ["〜3,000万円", "3,000万〜1億円", "1〜5億円", "5億円〜"]
const concerns = ["売上の悩み", "資金繰りが不安", "人手・採用が進まない", "IT/DXを進めたい", "コストを見直したい", "その他のモヤモヤ"]

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
      setError("必要な項目を選んでください。")
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
    <div className="w-full max-w-[720px] mx-auto flex flex-col flex-1 gap-5 pb-20">
      <div className="space-y-3">
        <p className="text-sm text-[var(--yori-ink-soft)]">ステップ {step} / 3</p>
        <div className="h-2 w-full rounded-full bg-[var(--yori-surface-muted)]">
          <div
            className="h-2 rounded-full bg-[var(--yori-primary)] transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="yori-card p-5 space-y-4">
        {step === 1 && (
          <>
            <h2 className="text-base font-semibold text-[var(--yori-ink-strong)]">まずは事業の基本情報を教えてください</h2>
            <div className="space-y-2">
              <p className="text-xs text-[var(--yori-ink-soft)]">業種</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {industries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, industry: item }))}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      form.industry === item
                        ? "border-[var(--yori-ink-strong)] bg-[var(--yori-ink-strong)] text-white"
                        : "border-[var(--yori-outline)] bg-white text-[var(--yori-ink)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-[var(--yori-ink-soft)]">従業員数</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {employeeRanges.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, employees: item }))}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      form.employees === item
                        ? "border-[var(--yori-ink-strong)] bg-[var(--yori-ink-strong)] text-white"
                        : "border-[var(--yori-outline)] bg-white text-[var(--yori-ink)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-[var(--yori-ink-soft)]">年商（売上規模）</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {salesRanges.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, salesRange: item }))}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      form.salesRange === item
                        ? "border-[var(--yori-ink-strong)] bg-[var(--yori-ink-strong)] text-white"
                        : "border-[var(--yori-outline)] bg-white text-[var(--yori-ink)]"
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
            <h2 className="text-base font-semibold text-[var(--yori-ink-strong)]">今いちばん気になることは？</h2>
            <div className="grid grid-cols-1 gap-2">
              {concerns.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, concern: item }))}
                  className={`rounded-2xl border px-3 py-3 text-sm text-left ${
                    form.concern === item
                      ? "border-[var(--yori-ink-strong)] bg-[var(--yori-ink-strong)] text-white"
                      : "border-[var(--yori-outline)] bg-white text-[var(--yori-ink)]"
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
            <h2 className="text-base font-semibold text-[var(--yori-ink-strong)]">自由に補足があれば書いてください（任意）</h2>
            <textarea
              value={form.detail}
              onChange={(e) => setForm((prev) => ({ ...prev, detail: e.target.value }))}
              placeholder="例えば：3ヶ月で売上を◯◯％伸ばしたい、資金繰りが3ヶ月後に厳しくなる…など"
              className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm min-h-[140px] focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
            />
          </>
        )}

        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 rounded-full border border-[var(--yori-outline)] text-[var(--yori-ink)] py-3 text-sm font-semibold active:scale-98 transition-transform"
        >
          もどる
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 btn-primary text-sm font-semibold py-3 inline-flex items-center justify-center"
          >
            つぎへ
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 btn-primary text-sm font-semibold py-3 inline-flex items-center justify-center"
          >
            結果を見る
          </button>
        )}
      </div>
    </div>
  )
}
