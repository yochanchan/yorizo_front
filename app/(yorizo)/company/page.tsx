"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { getCompanyProfile, saveCompanyProfile, type CompanyProfile, type CompanyProfilePayload } from "@/lib/api"

const USER_ID = "demo-user"

const industries = ["飲食", "小売", "サービス", "製造", "IT/DX", "建設", "その他"]
const businessTypes = ["株式会社", "合同会社", "個人事業主", "その他"]
const employeeRanges = ["〜5名", "6〜20名", "21〜50名", "51名〜"]
const salesRanges = ["〜3,000万円", "3,000万〜1億円", "1〜5億円", "5億円〜"]
const ageRanges = ["30代", "40代", "50代", "60代", "それ以降"]
const mainConcerns = ["売上", "資金繰り", "人材", "業務効率化", "その他"]

export default function CompanyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<CompanyProfilePayload>({
    company_name: "",
    industry: "",
    employees_range: "",
    annual_sales_range: "",
    location_prefecture: "",
    years_in_business: undefined,
  })
  const [extra, setExtra] = useState({
    business_type: "",
    founded_year: "",
    city: "",
    main_bank: "",
    has_loan: "",
    has_rent: "",
    owner_age: "",
    main_concern: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data: CompanyProfile | null = await getCompanyProfile(USER_ID)
        if (data) {
          setProfile({
            company_name: data.company_name ?? "",
            industry: data.industry ?? "",
            employees_range: data.employees_range ?? "",
            annual_sales_range: data.annual_sales_range ?? "",
            location_prefecture: data.location_prefecture ?? "",
            years_in_business: data.years_in_business ?? undefined,
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveCompanyProfile(USER_ID, profile)
      setMessage("会社情報を保存しました")
    } catch (err) {
      console.error(err)
      setMessage("保存に失敗しました。もう一度お試しください。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-[720px] mx-auto flex flex-col gap-4 pb-16">
      <div className="flex items-center gap-3 pt-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--yori-ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> 戻る
        </button>
        <div className="text-xs font-semibold text-[var(--yori-ink-soft)] bg-[var(--yori-secondary)] px-3 py-1 rounded-full border border-[var(--yori-outline)]">
          会社情報
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-bold text-[var(--yori-ink-strong)]">会社情報</h1>
        <p className="text-sm text-[var(--yori-ink)]">
          Yorizoがより的確に提案できるよう、経営の基本情報を教えてください。
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--yori-ink-soft)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>読み込み中…</span>
        </div>
      ) : (
        <>
          <section className="yori-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--yori-ink-strong)]">基本情報</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">会社名</label>
                <input
                  value={profile.company_name ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, company_name: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
                  placeholder="株式会社Yorizo"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">業種</label>
                  <select
                    value={profile.industry ?? ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, industry: e.target.value }))}
                    className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
                  >
                    <option value="">選択してください</option>
                    {industries.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">事業形態</label>
                  <select
                    value={extra.business_type}
                    onChange={(e) => setExtra((prev) => ({ ...prev, business_type: e.target.value }))}
                    className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
                  >
                    <option value="">選択してください</option>
                    {businessTypes.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">設立年 / 創業年</label>
                  <input
                    type="number"
                    value={extra.founded_year}
                    onChange={(e) => setExtra((prev) => ({ ...prev, founded_year: e.target.value }))}
                    className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
                    placeholder="2005"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">所在地（都道府県）</label>
                  <input
                    value={profile.location_prefecture ?? ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, location_prefecture: e.target.value }))}
                    className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
                    placeholder="東京都"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">所在地（市区町村など）</label>
                <input
                  value={extra.city}
                  onChange={(e) => setExtra((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
                  placeholder="新宿区..."
                />
              </div>
            </div>
          </section>

          <section className="yori-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--yori-ink-strong)]">規模感</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">従業員数</label>
                <select
                  value={profile.employees_range ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, employees_range: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
                >
                  <option value="">選択してください</option>
                  {employeeRanges.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">年商（売上規模）</label>
                <select
                  value={profile.annual_sales_range ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, annual_sales_range: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
                >
                  <option value="">選択してください</option>
                  {salesRanges.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="yori-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--yori-ink-strong)]">お金まわり</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">メインバンク</label>
                <input
                  value={extra.main_bank}
                  onChange={(e) => setExtra((prev) => ({ ...prev, main_bank: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
                  placeholder="〇〇銀行"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">借入の有無</label>
                <select
                  value={extra.has_loan}
                  onChange={(e) => setExtra((prev) => ({ ...prev, has_loan: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
                >
                  <option value="">選択してください</option>
                  <option value="yes">はい</option>
                  <option value="no">いいえ</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">賃料や家賃の有無</label>
                <select
                  value={extra.has_rent}
                  onChange={(e) => setExtra((prev) => ({ ...prev, has_rent: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
                >
                  <option value="">選択してください</option>
                  <option value="yes">はい</option>
                  <option value="no">いいえ</option>
                </select>
              </div>
            </div>
          </section>

          <section className="yori-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--yori-ink-strong)]">相談の背景</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">経営者の年代</label>
                <select
                  value={extra.owner_age}
                  onChange={(e) => setExtra((prev) => ({ ...prev, owner_age: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
                >
                  <option value="">選択してください</option>
                  {ageRanges.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">主な経営の悩み</label>
                <select
                  value={extra.main_concern}
                  onChange={(e) => setExtra((prev) => ({ ...prev, main_concern: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
                >
                  <option value="">選択してください</option>
                  {mainConcerns.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {message && <p className="text-xs text-[var(--yori-ink-soft)]">{message}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:bg-slate-300"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            保存する
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full text-center text-sm font-semibold text-[var(--yori-ink-soft)] underline underline-offset-4"
          >
            キャンセルして戻る
          </button>
        </>
      )}
    </div>
  )
}
