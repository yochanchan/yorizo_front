"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { CalendarDays, Clock, Loader2, MapPin, Phone, Save, Video, LayoutDashboard } from "lucide-react"

import { getAdminBooking, updateAdminBooking, type AdminBooking } from "@/lib/api"

const channelLabel: Record<string, string> = {
  online: "オンライン",
  "in-person": "対面",
}

const statusLabel: Record<string, string> = {
  pending: "未確認",
  confirmed: "確定",
  done: "完了",
  cancelled: "キャンセル",
}

const statusOptions = [
  { value: "pending", label: "未確認" },
  { value: "confirmed", label: "確定" },
  { value: "done", label: "完了" },
  { value: "cancelled", label: "キャンセル" },
]

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const bookingId = params?.id

  const [booking, setBooking] = useState<AdminBooking | null>(null)
  const [status, setStatus] = useState<string>("pending")
  const [note, setNote] = useState<string>("")
  const [meetingUrl, setMeetingUrl] = useState<string>("")
  const [lineContact, setLineContact] = useState<string>("")
  const [conversationId, setConversationId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const mode = useMemo(() => (booking ? channelLabel[booking.channel] ?? booking.channel : ""), [booking])

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return
      try {
        const data = await getAdminBooking(bookingId)
        setBooking(data)
        setStatus(data.status)
        setNote(data.note ?? "")
        setMeetingUrl(data.meeting_url ?? "")
        setLineContact(data.line_contact ?? "")
        setConversationId(data.conversation_id ?? "")
      } catch (err) {
        console.error(err)
        setError("予約情報の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [bookingId])

  const handleSave = async () => {
    if (!bookingId) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await updateAdminBooking(bookingId, {
        status,
        note: note || null,
        meeting_url: meetingUrl || null,
        line_contact: lineContact || null,
        conversation_id: conversationId || null,
      })
      setBooking(updated)
      setMessage("更新しました")
    } catch (err) {
      console.error(err)
      setError("更新に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full px-6 md:px-10 py-8 md:py-12 bg-slate-50">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          {booking && (
            <Link
              href={`/admin/bookings?selected=${booking.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#13274B] shadow-sm hover:bg-slate-50"
            >
              <LayoutDashboard className="h-4 w-4" />
              ダッシュボードへ
            </Link>
          )}
          <p className="text-xs text-slate-500 whitespace-nowrap">予約ID: {bookingId}</p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" /> 読み込み中...
          </div>
        )}

        {error && <p className="text-xs text-rose-600">{error}</p>}
        {message && <p className="text-xs text-emerald-700">{message}</p>}

        {booking && (
          <div className="grid gap-5 md:gap-6 md:grid-cols-[1.6fr,1fr] items-start">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {booking.channel === "online" ? (
                  <Video className="h-4 w-4 text-[#13274B]" />
                ) : (
                  <MapPin className="h-4 w-4 text-[#13274B]" />
                )}
                <span className="whitespace-nowrap">{mode}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700 whitespace-nowrap">
                  {statusLabel[booking.status] ?? booking.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-800 whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-4 w-4 text-slate-600" />
                  {booking.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-600" />
                  {booking.time_slot}
                </span>
                {booking.expert_name && <span className="inline-flex">担当: {booking.expert_name}</span>}
              </div>
              <div className="space-y-1 text-sm text-slate-700">
                <p className="font-semibold whitespace-nowrap">相談者: {booking.name}</p>
                {booking.user_name && <p className="text-xs text-slate-500 whitespace-nowrap">ユーザー名: {booking.user_name}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  {booking.phone && (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <Phone className="h-3.5 w-3.5" />
                      {booking.phone}
                    </span>
                  )}
                  {booking.email && <span className="whitespace-nowrap">{booking.email}</span>}
                </div>
                {booking.note && <p className="text-xs text-slate-600 whitespace-pre-line">メモ: {booking.note}</p>}
                {booking.meeting_url && (
                  <p className="text-xs text-slate-600 break-all">
                    オンラインURL:{" "}
                    <a className="text-[#13274B] underline" href={booking.meeting_url} target="_blank" rel="noreferrer">
                      {booking.meeting_url}
                    </a>
                  </p>
                )}
                {booking.line_contact && <p className="text-xs text-slate-600 break-all">LINE連絡先: {booking.line_contact}</p>}
              </div>
              <p className="text-[11px] text-slate-500 whitespace-nowrap">登録日時: {new Date(booking.created_at).toLocaleString("ja-JP")}</p>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">ステータス更新</h2>
              <div className="space-y-2">
                <label className="text-xs text-slate-600">ステータス</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-600">メモ（任意）</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="連絡メモや備考"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-600">conversation_id（カルテ紐付け）</label>
                <input
                  value={conversationId}
                  onChange={(e) => setConversationId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="チャットの conversation_id"
                />
                <p className="text-[11px] text-slate-500">
                  チャットの conversation_id を設定するとダッシュボードにカルテが表示されます。
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-600">オンラインURL（Zoom/Teams など）</label>
                <input
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-600">LINE連絡先・招待URL（任意）</label>
                <input
                  value={lineContact}
                  onChange={(e) => setLineContact(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="LINE ID や招待リンク"
                />
              </div>
              {conversationId && (
                <Link
                  href={`/admin/conversations/${conversationId}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#13274B] underline underline-offset-4"
                >
                  会話を開く（管理者ビュー）
                  <LayoutDashboard className="h-3.5 w-3.5" />
                </Link>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition disabled:bg-slate-300"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                更新する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
