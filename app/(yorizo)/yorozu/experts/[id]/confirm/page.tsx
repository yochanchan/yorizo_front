"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2, MapPin, Shield, Star } from "lucide-react"

import { YoriSectionCard } from "@/components/YoriSectionCard"
import {
  ApiError,
  createConsultationBooking,
  getConversations,
  getExperts,
  type ConsultationBookingPayload,
  type Expert,
} from "@/lib/api"

const USER_ID = "demo-user"
const CONFLICT_MESSAGE = "この時間枠は既に予約されています。別の枠を選んでください"

type FormState = {
  name: string
  phone: string
  email: string
  note: string
}

const DEFAULT_FORM: FormState = {
  name: "ARIMAX",
  phone: "090-9999-9999",
  email: "ARIMAX@example.com",
  note: "",
}

export default function ConfirmPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const expertId = params?.id
  const date = searchParams.get("date") || ""
  const time = searchParams.get("time") || ""
  const channel = (searchParams.get("channel") as "online" | "in-person" | null) ?? "online"
  const [conversationId, setConversationId] = useState(searchParams.get("conversationId") || "")

  const [expert, setExpert] = useState<Expert | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPolicyOpen, setIsPolicyOpen] = useState(false)

  useEffect(() => {
    const fetchExpert = async () => {
      if (!expertId) return
      const experts = await getExperts()
      setExpert(experts.find((e) => e.id === expertId) ?? null)
    }
    fetchExpert()
  }, [expertId])

  useEffect(() => {
    if (conversationId) return
    if (typeof window === "undefined") return
    const latest = window.localStorage.getItem("lastConversationId")
    if (latest) {
      setConversationId(latest)
    }
  }, [conversationId])

  useEffect(() => {
    const loadLatestConversation = async () => {
      if (conversationId) return
      try {
        const convs = await getConversations(USER_ID, 1, 0)
        if (convs.length > 0) {
          setConversationId(convs[0].id)
          if (typeof window !== "undefined") {
            window.localStorage.setItem("lastConversationId", convs[0].id)
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest conversation for booking", err)
      }
    }
    void loadLatestConversation()
  }, [conversationId])

  useEffect(() => {
    if (!isPolicyOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPolicyOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isPolicyOpen])

  const formattedDate = useMemo(() => {
    const parts = date.split("-")
    if (parts.length < 3) return date
    const month = Number(parts[1])
    const day = Number(parts[2])
    return `${month}/${day}`
  }, [date])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!expertId || !date || !time) return
    if (!form.name.trim()) {
      setError("お名前を入力してください")
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const payload: ConsultationBookingPayload = {
        expert_id: expertId,
        user_id: USER_ID,
        conversation_id: conversationId || undefined,
        date,
        time_slot: time,
        channel,
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        note: form.note || undefined,
      }
      await createConsultationBooking(payload)
      router.replace("/appoint")
    } catch (err) {
      console.error(err)
      if (err instanceof ApiError && err.status === 409) {
        setError(CONFLICT_MESSAGE)
      } else {
        setError("予約の送信に失敗しました。時間をおいて再度お試しください。")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="yori-shell py-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="yori-chip bg-white hover:bg-[var(--yori-surface-muted)]"
        >
          もどる
        </button>
        <div className="space-y-1">
          <p className="text-lg font-bold text-[var(--yori-ink-strong)]">連絡先の確認</p>
          <p className="text-sm text-[var(--yori-ink)]">入力後に予約を確定します</p>
        </div>
      </div>

      {expert && (
        <YoriSectionCard title="専門家" description={expert.title ?? undefined}>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-[var(--yori-secondary)] border border-[var(--yori-outline)] flex items-center justify-center text-sm font-semibold text-[var(--yori-ink-strong)]">
              {expert.name.slice(0, 2)}
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-base font-semibold text-[var(--yori-ink-strong)]">{expert.name}</p>
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--yori-ink)]">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                  {expert.rating.toFixed(1)} ({expert.review_count})
                </span>
                {expert.location_prefecture && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {expert.location_prefecture}
                  </span>
                )}
              </div>
              {expert.description && <p className="text-sm text-[var(--yori-ink)]">{expert.description}</p>}
            </div>
          </div>
        </YoriSectionCard>
      )}

      <YoriSectionCard title="選択した日程">
        <div className="grid grid-cols-2 gap-3 text-sm text-[var(--yori-ink-strong)]">
          <div className="yori-card p-3">
            <p className="text-xs text-[var(--yori-ink)]">日付</p>
            <p className="font-semibold text-[var(--yori-ink-strong)]">{formattedDate}</p>
          </div>
          <div className="yori-card p-3">
            <p className="text-xs text-[var(--yori-ink)]">時間</p>
            <p className="font-semibold text-[var(--yori-ink-strong)]">{time}</p>
          </div>
          <div className="yori-card p-3 col-span-2">
            <p className="text-xs text-[var(--yori-ink)]">相談方法</p>
            <p className="font-semibold text-[var(--yori-ink-strong)]">{channel === "online" ? "オンライン" : "対面"}</p>
          </div>
        </div>
      </YoriSectionCard>

      <YoriSectionCard
        title="連絡先を入力"
        description="予約の確定に必要な連絡先を入力してください"
        icon={<Shield className="h-5 w-5 text-[var(--yori-ink-strong)]" />}
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--yori-ink-strong)]" htmlFor="booking-name">
              お名前
            </label>
            <input
              id="booking-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
              placeholder="山田太郎"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--yori-ink-strong)]" htmlFor="booking-phone">
              電話番号
            </label>
            <input
              id="booking-phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
              placeholder="090-1234-5678"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--yori-ink-strong)]" htmlFor="booking-email">
              メールアドレス
            </label>
            <input
              id="booking-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
              placeholder="yamada@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--yori-ink-strong)]" htmlFor="booking-note">
              相談したい内容（任意）
            </label>
            <textarea
              id="booking-note"
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
              rows={3}
              placeholder="最近の状況や気になっていることなど"
            />
          </div>
          <div className="text-xs text-[var(--yori-ink)]">
            <button type="button" className="underline" onClick={() => setIsPolicyOpen(true)}>
              個人情報・プライバシーポリシー
            </button>
            をご確認ください（同意チェックは不要です）。
          </div>

          {error && (
            <div className="space-y-2">
              <p className="text-xs text-rose-600">{error}</p>
              {error.includes("枠") && (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-xs underline text-[var(--yori-ink-strong)]"
                >
                  日程を選び直す
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 text-sm font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>この内容で予約する</span>
          </button>
        </form>
      </YoriSectionCard>

      {isPolicyOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          onClick={() => setIsPolicyOpen(false)}
        >
          <div
            className="yori-card max-w-xl w-full p-5 md:p-6 space-y-3 bg-white"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-base font-bold text-[var(--yori-ink-strong)]">個人情報・プライバシーポリシー</p>
                <p className="text-sm text-[var(--yori-ink)]">入力いただいた情報は相談対応のみに利用します。</p>
              </div>
              <button type="button" className="text-sm underline" onClick={() => setIsPolicyOpen(false)}>
                閉じる
              </button>
            </div>
            <div className="space-y-2 text-sm text-[var(--yori-ink)] leading-relaxed">
              <p>・利用目的: 予約の連絡、サービス向上のためにのみ利用します。</p>
              <p>・第三者提供: 法令で定める場合を除き、同意なく第三者へ提供しません。</p>
              <p>・安全管理: 適切なアクセス制限、暗号化等で保護します。</p>
              <p>・問い合わせ: 開示・訂正・削除のご希望は運営窓口までご連絡ください。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
