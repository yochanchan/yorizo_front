"use client"

import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { getCompanyProfile, saveCompanyProfile, type CompanyProfile, type CompanyProfilePayload } from "@/lib/api"

const industries = ["飲食", "小売", "サービス", "製造", "IT/DX", "建設", "その他"]
const businessTypes = ["株式会社", "合同会社", "個人事業主", "その他"]
const employeeRanges = ["1-5名", "6-20名", "21-50名", "51名以上"]
const salesRanges = ["〜3,000万円", "3,000万円〜1億円", "1億円〜5億円", "5億円以上"]
const ageRanges = ["30代", "40代", "50代", "60代", "それ以上"]
const mainConcerns = ["売上", "資金繰り", "人材", "業務効率化", "その他"]

type CompanyProfileFormProps = {
  companyId: string
  userId?: string
}

export function CompanyProfileForm({ companyId, userId = "demo-user" }: CompanyProfileFormProps) {
  const [profile, setProfile] = useState<CompanyProfilePayload>({
    company_name: "",
    industry: "",
    employees_range: "",
    annual_sales_range: "",
    location_prefecture: "",
    years_in_business: undefined,
    business_type: "",
    founded_year: undefined,
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
        const data: CompanyProfile | null = await getCompanyProfile(userId)
        if (data) {
          setProfile({
            company_name: data.company_name ?? "",
            industry: data.industry ?? "",
            employees_range: data.employees_range ?? "",
            annual_sales_range: data.annual_sales_range ?? "",
            location_prefecture: data.location_prefecture ?? "",
            years_in_business: data.years_in_business ?? undefined,
            business_type: data.business_type ?? "",
            founded_year: data.founded_year ?? undefined,
            city: data.city ?? "",
            main_bank: data.main_bank ?? "",
            has_loan: data.has_loan ?? "",
            has_rent: data.has_rent ?? "",
            owner_age: data.owner_age ?? "",
            main_concern: data.main_concern ?? "",
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveCompanyProfile(userId, profile)
      setMessage("会社情報を保存しました。")
    } catch (err) {
      console.error(err)
      setMessage("保存に失敗しました。もう一度お試しください。")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--yori-ink-soft)]">読み込み中…</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">会社名</label>
          <input
            value={profile.company_name}
            onChange={(e) => setProfile((prev) => ({ ...prev, company_name: e.target.value }))}
            className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
          />
        </div>
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
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">年商</label>
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
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">所在（都道府県・市区町村）</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={profile.location_prefecture ?? ""}
              onChange={(e) => setProfile((prev) => ({ ...prev, location_prefecture: e.target.value }))}
              placeholder="都道府県"
              className="rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
            />
            <input
              value={profile.city ?? ""}
              onChange={(e) => setProfile((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="市区町村"
              className="rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">形態</label>
          <select
            value={profile.business_type ?? ""}
            onChange={(e) => setProfile((prev) => ({ ...prev, business_type: e.target.value }))}
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
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">創業年</label>
          <input
            value={profile.founded_year ?? ""}
            onChange={(e) => setProfile((prev) => ({ ...prev, founded_year: Number(e.target.value) || undefined }))}
            placeholder="例: 2010"
            inputMode="numeric"
            className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">年数</label>
          <input
            value={profile.years_in_business ?? ""}
            onChange={(e) => setProfile((prev) => ({ ...prev, years_in_business: Number(e.target.value) || undefined }))}
            placeholder="例: 5"
            inputMode="numeric"
            className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">メインバンク</label>
          <input
            value={profile.main_bank ?? ""}
            onChange={(e) => setProfile((prev) => ({ ...prev, main_bank: e.target.value }))}
            className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">借入の有無</label>
          <select
            value={profile.has_loan ?? ""}
            onChange={(e) => setProfile((prev) => ({ ...prev, has_loan: e.target.value }))}
            className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
          >
            <option value="">選択してください</option>
            <option value="yes">あり</option>
            <option value="no">なし</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">賃貸の有無</label>
          <select
            value={profile.has_rent ?? ""}
            onChange={(e) => setProfile((prev) => ({ ...prev, has_rent: e.target.value }))}
            className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm"
          >
            <option value="">選択してください</option>
            <option value="yes">あり</option>
            <option value="no">なし</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">経営者の年齢</label>
          <select
            value={profile.owner_age ?? ""}
            onChange={(e) => setProfile((prev) => ({ ...prev, owner_age: e.target.value }))}
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
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">いまの一番の悩み</label>
          <select
            value={profile.main_concern ?? ""}
            onChange={(e) => setProfile((prev) => ({ ...prev, main_concern: e.target.value }))}
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

      {message && <p className="text-xs text-[var(--yori-ink-soft)]">{message}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:bg-slate-300"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          保存する
        </button>
      </div>
    </div>
  )
}
