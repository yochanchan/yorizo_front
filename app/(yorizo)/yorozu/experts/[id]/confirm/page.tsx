"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2, MapPin, Star } from "lucide-react"
import {
  createConsultationBooking,
  getExperts,
  type ConsultationBookingPayload,
  type ConsultationBookingResponse,
  type Expert,
} from "@/lib/api"

export default function ConfirmPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const expertId = params?.id
  const date = searchParams.get("date") || ""
  const time = searchParams.get("time") || ""
  const channel = (searchParams.get("channel") as "online" | "in-person" | null) ?? "online"

  const [expert, setExpert] = useState<Expert | null>(null)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
    agree: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ConsultationBookingResponse | null>(null)

  useEffect(() => {
    const fetchExpert = async () => {
      if (!expertId) return
      const experts = await getExperts()
      setExpert(experts.find((e) => e.id === expertId) ?? null)
    }
    fetchExpert()
  }, [expertId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!expertId || !date || !time) return
    if (!form.name || !form.agree) {
      setError("お名前と同意チェックを入力してください。")
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const payload: ConsultationBookingPayload = {
        expert_id: expertId,
        user_id: "demo-user",
        date,
        time_slot: time,
        channel,
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        note: form.note || undefined,
      }
      const data = await createConsultationBooking(payload)
      setResult(data)
    } catch (err) {
      console.error(err)
      setError("予約の送信に失敗しました。もう一度お試しください。")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-4 pt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-full bg-white/90 border border-white/70 flex items-center justify-center shadow-sm text-slate-600"
        >
          ←
        </button>
        <div>
          <p className="text-lg font-bold text-slate-900">相談予約</p>
          <p className="text-xs text-slate-500">連絡先を入力して送信してください</p>
        </div>
      </div>

      {expert && (
        <div className="rounded-3xl bg-white/95 border border-amber-100 shadow-sm p-4 space-y-1">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-xs font-semibold text-[#13274B]">
              {expert.name.slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{expert.name}</p>
              <p className="text-xs text-slate-700">{expert.title}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
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
        </div>
      )}

      <div className="rounded-3xl bg-white/95 border border-amber-100 shadow-sm p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-800">選択された予約内容</p>
        <p className="text-xs text-slate-700">{date} / {time}</p>
        <p className="text-xs text-slate-700">相談方法: {channel === "online" ? "オンライン" : "対面"}</p>
      </div>

      {result ? (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-4 space-y-2">
          <p className="text-sm font-semibold text-emerald-700">予約を受け付けました</p>
          <p className="text-xs text-emerald-700">{result.message}</p>
          <p className="text-[11px] text-emerald-600">予約ID: {result.booking_id}</p>
          <button
            type="button"
            onClick={() => router.push("/yorozu")}
            className="w-full rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform"
          >
            一覧に戻る
          </button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">お名前</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13274B]"
              placeholder="山田太郎"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">電話番号</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13274B]"
              placeholder="090-1234-5678"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">メールアドレス</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13274B]"
              placeholder="yamada@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">相談したい内容（任意）</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13274B]"
              rows={3}
              placeholder="最近の売上状況や気になっていることなど"
            />
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => setForm((prev) => ({ ...prev, agree: e.target.checked }))}
              className="mt-1"
            />
            <span>個人情報・プライバシーポリシーに同意する</span>
          </label>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform flex items-center justify-center gap-2 disabled:bg-slate-300"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>この内容で予約を申し込む</span>
          </button>
        </form>
      )}
    </div>
  )
}
