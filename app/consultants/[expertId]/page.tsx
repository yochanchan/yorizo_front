import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getAdminBookings } from "@/lib/api"
import { BookingDashboard } from "@/app/admin/bookings/BookingDashboard"

type Props = {
  params: { expertId: string }
}

export default async function ConsultantDashboardPage({ params }: Props) {
  const expertId = params.expertId
  if (!expertId) {
    notFound()
  }

  const bookings = await getAdminBookings({ limit: 100, expert_id: expertId })
  if (!bookings || bookings.length === 0) {
    redirect("/consultants")
  }

  return (
    <div className="w-full px-6 md:px-10 py-8 md:py-12 bg-slate-50">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        <header className="space-y-2 md:flex md:items-baseline md:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">相談員ダッシュボード</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">担当スケジュールとカルテ</h1>
            <p className="text-sm text-slate-600">
              あなたが担当する予約のみを表示しています。カレンダーから選択すると、会話要約やToDoを確認できます。
            </p>
          </div>
          <Link
            href="/consultants"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#13274B] shadow-sm hover:bg-slate-50"
          >
            相談員を選び直す
          </Link>
        </header>

        <BookingDashboard bookings={bookings} expertId={expertId} />
      </div>
    </div>
  )
}
