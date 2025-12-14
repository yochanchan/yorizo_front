import Link from "next/link"
import { CalendarClock, CalendarDays, ChevronRight, NotebookPen } from "lucide-react"

import { YoriCard } from "@/components/YoriCard"
import { YoriSectionCard } from "@/components/YoriSectionCard"
import { YorizoAvatar } from "@/components/YorizoAvatar"
import {
  getConsultations,
  listConsultationMemos,
  type ConsultationBookingListItem,
  type ConsultationMemoListItem,
} from "@/lib/api"

const USER_ID = "demo-user"
const BOOKING_LIMIT = 2
const MEMO_LIMIT = 5

const CHANNEL_LABEL: Record<string, string> = {
  online: "オンライン",
  "in-person": "対面",
}

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: "受付待ち",
  confirmed: "確定",
  done: "面談済み",
  cancelled: "キャンセル",
}

function formatYyyyMmDd(value?: string) {
  if (!value) return "--"
  const [datePart] = value.split("T")
  return (datePart || value).replace(/-/g, "/")
}

function formatChannel(value?: string) {
  if (!value) return "不明"
  return CHANNEL_LABEL[value] ?? "不明"
}

function formatBookingStatus(value?: string) {
  if (!value) return "不明"
  return BOOKING_STATUS_LABEL[value] ?? "不明"
}

export default async function AppointPage() {
  let bookings: ConsultationBookingListItem[] = []
  let memos: ConsultationMemoListItem[] = []
  let bookingError: string | null = null
  let memoError: string | null = null

  try {
    bookings = await getConsultations(USER_ID, BOOKING_LIMIT)
  } catch (err) {
    console.error(err)
    bookingError = "予約情報を取得できませんでした。時間をおいて再試行してください。"
  }

  try {
    memos = await listConsultationMemos(USER_ID, MEMO_LIMIT)
  } catch (err) {
    console.error(err)
    memoError = "相談メモ履歴を取得できませんでした。"
  }

  const visibleMemos = memos.slice(0, 4)
  const showMemoryLink = memos.length >= 5

  return (
    <main className="w-full">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col flex-1 pb-24 pt-6 space-y-5">
        <YoriSectionCard
          tone="muted"
          title="相談予約のご案内"
          description="お近くのよろず支援拠点につなぎます。相談メモもそのまま持ち込めます。"
          icon={<YorizoAvatar mood="expert" size="sm" />}
          data-testid="appoint-hero"
        />

        <YoriCard
          variant="primaryLink"
          title="相談予約をする"
          href="/yorozu"
          className="w-full"
          data-testid="appoint-cta"
        />

        <YoriSectionCard
          title="予約済みの日程"
          icon={<CalendarDays className="h-5 w-5 text-[var(--yori-ink-soft)]" />}
          data-testid="appoint-bookings"
        >
          {bookingError && <p className="text-sm text-rose-700">{bookingError}</p>}
          {!bookingError && bookings.length === 0 && (
            <p className="text-sm text-[var(--yori-ink-soft)]">未来の予約はまだありません。</p>
          )}
          {!bookingError && bookings.length > 0 && (
            <div className="divide-y divide-[var(--yori-outline)]">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start justify-between gap-3 py-3"
                  data-testid="booking-row"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">
                      {formatYyyyMmDd(booking.date)} {booking.time_slot}
                    </p>
                    <p className="text-xs text-[var(--yori-ink)] flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-[var(--yori-ink-soft)]" aria-hidden />
                      <span className="truncate">
                        {formatChannel(booking.channel)} {booking.expert_name ? `| ${booking.expert_name}` : ""}
                      </span>
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--yori-ink-soft)] tracking-wide">
                    {formatBookingStatus(booking.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </YoriSectionCard>

        <YoriSectionCard
          title="過去の相談メモ"
          icon={<NotebookPen className="h-5 w-5 text-[var(--yori-ink-soft)]" />}
          data-testid="appoint-memos"
        >
          {memoError && <p className="text-sm text-rose-700">{memoError}</p>}
          {!memoError && visibleMemos.length === 0 && (
            <p className="text-sm text-[var(--yori-ink-soft)]">相談メモがまだありません。</p>
          )}

          {!memoError && visibleMemos.length > 0 && (
            <div className="divide-y divide-[var(--yori-outline)]">
              {visibleMemos.map((memo) => (
                <Link
                  key={memo.conversation_id}
                  href={`/memory/${memo.conversation_id}/memo`}
                  className="flex items-center justify-between gap-3 px-1 py-3 rounded-lg hover:bg-[var(--yori-surface-muted)] transition-colors"
                  data-testid="memo-row"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-[var(--yori-ink-soft)]">{formatYyyyMmDd(memo.created_at)}</p>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--yori-ink-strong)] line-clamp-1">
                        {memo.current_point_preview || "今回気になっていることの記録がありません"}
                      </p>
                      <p className="text-sm text-[var(--yori-ink)] line-clamp-1">
                        {memo.important_point_preview || "専門家に伝えたいポイントの記録がありません"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--yori-ink-soft)]" aria-hidden />
                </Link>
              ))}
            </div>
          )}

          {showMemoryLink && !memoError && (
            <div className="pt-3">
              <Link
                href="/memory"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--yori-ink-strong)] underline underline-offset-4"
                data-testid="appoint-memory-link"
              >
                Yorizoの記憶へ
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </YoriSectionCard>
      </div>
    </main>
  )
}
