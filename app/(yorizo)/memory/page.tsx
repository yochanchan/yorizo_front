"use client"

import { useEffect, useMemo, useState } from "react"
import { Heart, RefreshCcw, ChevronRight, History, Save, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { MascotIcon } from "@/components/MascotIcon"
import {
  getCompanyProfile,
  getConversations,
  saveCompanyProfile,
  type CompanyProfile,
  type CompanyProfilePayload,
  type ConversationSummary,
} from "@/lib/api"

const statusCards = [
  { label: "Yorizo信頼度", value: "Lv.5", accent: "text-pink-500" },
  { label: "相談回数", value: "3", accent: "text-slate-800" },
  { label: "保存メモ数", value: "2", accent: "text-slate-800" },
]

const memoItems = [
  "原材料費の高騰で利益率が下がっている",
  "人手不足で現場に張り付きになっている",
]

const industryOptions = ["飲食", "小売", "サービス", "製造", "IT/DX", "その他"]
const employeesOptions = ["1-4", "5-9", "10-19", "20-49", "50+"]
const salesOptions = ["~1000", "1000-5000", "5000-1億", "1億以上"]
const prefectureOptions = ["未選択", "北海道", "東京都", "大阪府", "福岡県", "その他"]

const USER_ID = "demo-user"

export default function MemoryPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState("りょうさん")
  const [profile, setProfile] = useState<CompanyProfilePayload>({
    company_name: "",
    industry: "",
    employees_range: "",
    annual_sales_range: "",
    location_prefecture: "",
    years_in_business: undefined,
  })
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [loadingConversations, setLoadingConversations] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getCompanyProfile(USER_ID)
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
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations(USER_ID, 5, 0)
        setConversations(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingConversations(false)
      }
    }
    fetchConversations()
  }, [])

  const handleProfileSave = async () => {
    setSavingProfile(true)
    setProfileMessage(null)
    try {
      await saveCompanyProfile(USER_ID, profile)
      setProfileMessage("会社情報を保存しました")
    } catch (err) {
      console.error(err)
      setProfileMessage("保存に失敗しました。もう一度お試しください。")
    } finally {
      setSavingProfile(false)
    }
  }

  const formattedConversations = useMemo(() => {
    return conversations.map((c) => ({
      ...c,
      dateLabel: c.date.replace(/-/g, "/"),
    }))
  }, [conversations])

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-6 pt-2">
      <section className="space-y-4">
        <div className="flex justify-center">
          <MascotIcon size="lg" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {statusCards.map((card) => (
            <div
              key={card.label}
              className="bg-white/90 rounded-2xl shadow-sm border border-white/60 px-3 py-2 text-center"
            >
              <p className="text-[11px] text-slate-600">{card.label}</p>
              <p className={`text-lg font-bold ${card.accent}`}>{card.value}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto w-full rounded-full bg-white/95 shadow-sm border border-white/60 px-5 py-3 text-sm text-center text-slate-800">
          Yorizoの記憶、いっしょに育てていこう 🌱
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="flex-1 rounded-full bg-[#13274B] text-white py-4 text-sm font-semibold shadow-md active:scale-98 transition-transform"
          >
            Yorizoとチャットで話す
          </button>
          <button
            type="button"
            onClick={() => router.push("/memory/history")}
            className="flex items-center justify-center gap-2 rounded-full bg-white/90 border border-slate-200 text-[#13274B] px-4 text-xs font-semibold shadow-sm active:scale-98 transition-transform"
          >
            <History className="h-4 w-4" />
            履歴
          </button>
        </div>
        <button
          type="button"
          onClick={() => router.push("/homework")}
          className="w-full rounded-full bg-white/95 border border-pink-200 text-[#13274B] py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform"
        >
          宿題を確認する
        </button>
      </section>

      <section className="bg-white/95 rounded-3xl shadow-sm border border-white/80 p-4 space-y-4">
        <div className="flex items-center justify-center gap-6 text-sm font-semibold">
          <div className="pb-2 border-b-2 border-[#13274B] text-[#13274B]">相談の記録</div>
          <div className="pb-2 text-slate-400">メモの記録</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-pink-400 to-sky-300 text-white">
                <Heart className="h-3 w-3 fill-white" />
              </span>
              <p className="text-sm font-semibold text-slate-800">今回の相談</p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[#13274B] flex items-center gap-1"
              onClick={() => router.push("/memory/history")}
            >
              履歴を見る <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-pink-200 bg-white px-4 py-3 space-y-2">
            <p className="text-sm font-semibold text-slate-800">最近気になっていること</p>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              {memoItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>作成日:2025/11/17</span>
              <span className="font-semibold text-slate-600">相談メモ</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <MascotIcon size="sm" />
            <p className="text-sm text-slate-800">Yorizoはあなたのことをどう呼べばいい？</p>
          </div>
          <label className="text-xs font-semibold text-slate-700">あなたの呼び方</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="あなたの呼び方を入力（2文字以上）"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13274B]"
          />
        </div>
      </section>

      <section className="bg-white/95 rounded-3xl shadow-sm border border-white/80 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">あなたの会社の情報</h3>
        <p className="text-xs text-slate-600">
          この情報をもとに、Yorizoがよりあなたの会社に合ったアドバイスをするよ 🌱
        </p>
        {loadingProfile ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            読み込み中…
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">会社名</label>
              <input
                value={profile.company_name ?? ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, company_name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13274B]"
                placeholder="株式会社Yorizo食堂"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">業種</label>
              <select
                value={profile.industry ?? ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, industry: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
              >
                <option value="">選択してください</option>
                {industryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">従業員数</label>
                <select
                  value={profile.employees_range ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, employees_range: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="">選択</option>
                  {employeesOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">年商レンジ</label>
                <select
                  value={profile.annual_sales_range ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, annual_sales_range: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="">選択</option>
                  {salesOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">所在地</label>
                <select
                  value={profile.location_prefecture ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, location_prefecture: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  {prefectureOptions.map((opt) => (
                    <option key={opt} value={opt === "未選択" ? "" : opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">創業年数</label>
                <input
                  type="number"
                  min={0}
                  value={profile.years_in_business ?? ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      years_in_business: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13274B]"
                  placeholder="5"
                />
              </div>
            </div>
            {profileMessage && <p className="text-[11px] text-slate-600">{profileMessage}</p>}
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="w-full rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform flex items-center justify-center gap-2 disabled:bg-slate-300"
            >
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              会社情報を保存する
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">会話から覚えていること 🌱</p>
        </div>
        <div className="bg-white/95 rounded-3xl shadow-sm border border-white/80 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MascotIcon size="sm" />
            <p className="text-sm text-slate-800 leading-relaxed">
              これまでの会話をもとに、あなたのことを覚えたよ！{nickname}のためにメモを更新したよ📒
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="w-full rounded-full border border-slate-300 text-slate-700 py-3 text-sm font-semibold active:scale-98 transition-transform"
          >
            Yorizoと話す
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">これまで相談したこと 🌱</p>
        </div>
        <div className="bg-white/95 rounded-3xl shadow-sm border border-white/80 p-3 space-y-1">
          {loadingConversations && (
            <div className="flex items-center gap-2 text-xs text-slate-500 px-2 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              読み込み中…
            </div>
          )}
          {!loadingConversations &&
            formattedConversations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/chat?conversationId=${item.id}`)}
                className="w-full text-left flex items-center justify-between px-2 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.dateLabel}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/memory/history")}
              className="mx-auto block rounded-full border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold active:scale-98 transition-transform"
            >
              もっと見る
            </button>
          </div>
        </div>
      </section>

      <div className="text-center text-xs text-slate-500 pb-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1 text-[#13274B] font-semibold"
        >
          最新の相談を確認 <RefreshCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
