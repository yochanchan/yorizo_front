import Link from "next/link"
import { CalendarDays, Clock, MapPin, Phone, Video } from "lucide-react"

import { getAdminBookings, type AdminBooking } from "@/lib/api"
import { BookingDashboard } from "./BookingDashboard"

export const dynamic = "force-dynamic"

const channelLabel: Record<string, string> = {
  online: "オンライン",
  "in-person": "来訪",
}

const statusLabel: Record<string, string> = {
  pending: "要確認",
  confirmed: "確定",
  done: "完了",
  cancelled: "キャンセル",
}

const statusClass: Record<string, string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-700",
  confirmed: "bg-blue-50 border-blue-200 text-blue-700",
  done: "bg-emerald-50 border-emerald-200 text-emerald-700",
  cancelled: "bg-slate-50 border-slate-200 text-slate-600",
}

export default async function AdminBookingsPage() {
  let bookings: AdminBooking[] = []
  let loadError = false

  try {
    bookings = await getAdminBookings({ limit: 100 })
  } catch (error) {
    // 管理画面はビルド時や一時的な API 障害でも落とさず、画面内でフォールバックする。
    console.error("admin bookings fetch failed", error)
    loadError = true
  }

  return (
    <div className="w-full px-6 md:px-10 py-8 md:py-12 bg-slate-50">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        <header className="space-y-2 md:flex md:items-baseline md:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">相談員ダッシュボード</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">予約・カルテ</h1>
            <p className="text-sm text-slate-600">カレンダーでスケジュールを確認し、クリックで会話要約・診断・カルテを一括で見られます。</p>
          </div>
          <Link
            href="/consultants"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#13274B] shadow-sm hover:bg-slate-50"
          >
            相談員別ビューへ
          </Link>
        </header>

        {loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            予紁E��報を取得できませんでした。時間をおいて再度アクセスしてください。
          </div>
        )}

        <BookingDashboard bookings={bookings} />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-500">参考</p>
              <h2 className="text-lg font-semibold text-slate-900">リストビュー</h2>
              <p className="text-xs text-slate-500">従来の一覧も残しています。</p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-600 text-center">
              予約はまだありません。
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden md:grid grid-cols-[2fr,1.3fr,1.3fr,1.1fr,1fr] gap-4 px-8 py-3 text-xs font-semibold text-slate-500 bg-slate-100/80 min-w-full">
                <span>相談者 / ユーザー</span>
                <span>日時</span>
                <span>チャネル / ステータス</span>
                <span>担当者</span>
                <span className="text-right">ID</span>
              </div>
              <div className="divide-y divide-slate-100">
                {bookings.map((booking) => {
                  const mode = channelLabel[booking.channel] ?? booking.channel
                  const status = statusLabel[booking.status] ?? booking.status
                  const badgeClass = statusClass[booking.status] ?? "bg-slate-50 border-slate-200 text-slate-600"
                  return (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}`}
                      className="block px-8 py-5 hover:bg-slate-50 transition"
                    >
                      <div className="grid md:grid-cols-[2fr,1.3fr,1.3fr,1.1fr,1fr] gap-3 md:gap-5 items-start">
                        <div className="space-y-1 text-sm text-slate-800">
                          <div className="font-semibold whitespace-nowrap">{booking.name}</div>
                          {booking.user_name && <div className="text-xs text-slate-500 whitespace-nowrap">ユーザー: {booking.user_name}</div>}
                          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                            {booking.phone && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <Phone className="h-3.5 w-3.5" />
                                {booking.phone}
                              </span>
                            )}
                            {booking.email && <span className="whitespace-nowrap">{booking.email}</span>}
                          </div>
                        </div>

                        <div className="text-sm text-slate-800 space-y-1">
                          <div className="inline-flex items-center gap-1 whitespace-nowrap">
                            <CalendarDays className="h-4 w-4 text-slate-600" />
                            {booking.date}
                          </div>
                          <div className="inline-flex items-center gap-1 whitespace-nowrap">
                            <Clock className="h-4 w-4 text-slate-600" />
                            {booking.time_slot}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                          {booking.channel === "online" ? (
                            <Video className="h-4 w-4 text-[#13274B]" />
                          ) : (
                            <MapPin className="h-4 w-4 text-[#13274B]" />
                          )}
                          <span className="whitespace-nowrap">{mode}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${badgeClass}`}>
                            {status}
                          </span>
                        </div>

                        <div className="text-sm text-slate-800 flex items-center whitespace-nowrap">
                          {booking.expert_name ? booking.expert_name : "-"}
                        </div>

                        <div className="text-right text-xs text-slate-500 whitespace-nowrap">{booking.id}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
