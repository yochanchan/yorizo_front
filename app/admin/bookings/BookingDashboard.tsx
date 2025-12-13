"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Phone, Video, Notebook, Sparkles, RefreshCcw } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  getConsultationMemo,
  getConversationReport,
  getConversations,
  getCaseExamples,
  getAdminBookings,
  type AdminBooking,
  type ConsultationMemo,
  type ConversationReport,
  type ConversationSummary,
  type SimilarCase,
} from "@/lib/api"

const channelLabel: Record<string, string> = {
  online: "オンライン",
  "in-person": "対面",
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
  cancelled: "bg-rose-50 border-rose-200 text-rose-700",
}

const statusDot: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-blue-500",
  done: "bg-emerald-500",
  cancelled: "bg-rose-500",
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function toYMD(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, "0")
  const d = `${date.getDate()}`.padStart(2, "0")
  return `${y}-${m}-${d}`
}

const cleanChoicePrefix = (text: string | null | undefined) => {
  const trimmed = (text ?? "").trim()
  return trimmed.replace(/^\[choice_id:[^\]]+\]\s*/i, "")
}

type Props = {
  bookings: AdminBooking[]
  expertId?: string
}

export function BookingDashboard({ bookings, expertId }: Props) {
  const [bookingsData, setBookingsData] = useState<AdminBooking[]>(bookings)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const [monthCursor, setMonthCursor] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [memo, setMemo] = useState<ConsultationMemo | null>(null)
  const [report, setReport] = useState<ConversationReport | null>(null)
  const [history, setHistory] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([])
  const [similarLoading, setSimilarLoading] = useState(false)
  const [similarError, setSimilarError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [derivedConversationId, setDerivedConversationId] = useState<string | null>(null)
  const memoCache = useRef<Record<string, ConsultationMemo>>({})
  const reportCache = useRef<Record<string, ConversationReport>>({})

  const persistCaches = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      window.sessionStorage.setItem("admin-memo-cache", JSON.stringify(memoCache.current))
      window.sessionStorage.setItem("admin-report-cache", JSON.stringify(reportCache.current))
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const memoRaw = window.sessionStorage.getItem("admin-memo-cache")
      const reportRaw = window.sessionStorage.getItem("admin-report-cache")
      if (memoRaw) {
        const parsed = JSON.parse(memoRaw)
        if (parsed && typeof parsed === "object") memoCache.current = parsed as Record<string, ConsultationMemo>
      }
      if (reportRaw) {
        const parsed = JSON.parse(reportRaw)
        if (parsed && typeof parsed === "object") reportCache.current = parsed as Record<string, ConversationReport>
      }
    } catch {
      // ignore parse errors
    }
  }, [persistCaches])

  const summaryItems = report?.summary ?? []
  const keyTopicItems = report?.key_topics ?? []
  const homeworkItems = report?.homework ?? []
  const memoPoints = memo?.current_points ?? []
  const memoImportantPoints = memo?.important_points ?? []

  const bookingById = useMemo(() => {
    const map: Record<string, AdminBooking> = {}
    bookingsData.forEach((b) => {
      map[b.id] = b
    })
    return map
  }, [bookingsData])

  const selectedBooking = selectedId ? bookingById[selectedId] : null

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const latest = await getAdminBookings({ limit: 100, expert_id: expertId })
      setBookingsData(latest)
    } catch (err) {
      console.error(err)
      setError("最新の予約取得に失敗しました")
    } finally {
      setRefreshing(false)
    }
  }, [expertId])

  useEffect(() => {
    if (bookingsData.length === 0) {
      setSelectedId(null)
      return
    }

    const currentValid = selectedId && bookingById[selectedId] ? selectedId : null
    if (currentValid) {
      return
    }

    const stored =
      typeof window !== "undefined" ? window.sessionStorage.getItem("admin-selected-booking") : null
    const fromUrl =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("selected")
        : null

    if (fromUrl && bookingById[fromUrl]) {
      setSelectedId(fromUrl)
      return
    }
    if (stored && bookingById[stored]) {
      setSelectedId(stored)
      return
    }

    const today = new Date()
    const upcoming = [...bookingsData]
      .sort((a, b) => a.date.localeCompare(b.date))
      .find((b) => new Date(`${b.date}T00:00:00`) >= today)
    const first = upcoming ?? bookingsData[0]
    setSelectedId(first.id)
    setSelectedDate(first.date)
  }, [bookingsData, bookingById, selectedId])

  useEffect(() => {
    if (!selectedId) return
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("admin-selected-booking", selectedId)
    }
  }, [selectedId])

  useEffect(() => {
    // フォーカス時のみ最新取得（初回はSSR渡しのデータをそのまま使う）
    if (bookingsData.length === 0) {
      void handleRefresh()
    }
    const handleFocus = () => {
      void handleRefresh()
    }
    window.addEventListener("focus", handleFocus)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleFocus()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [handleRefresh, bookingsData.length])

  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedBooking) return
      setLoading(true)
      setError(null)
      try {
        let activeConversationId: string | null = selectedBooking.conversation_id ?? null
        let conversations: ConversationSummary[] = []

        if (selectedBooking.user_id) {
          conversations = await getConversations(selectedBooking.user_id, 5, 0)
          setHistory(conversations)
        }

        if (!activeConversationId && conversations.length > 0) {
          activeConversationId = conversations[0].id
          setDerivedConversationId(conversations[0].id)
        } else {
          setDerivedConversationId(null)
        }

        if (activeConversationId) {
          const cachedMemo = memoCache.current[activeConversationId]
          const cachedReport = reportCache.current[activeConversationId]
          if (cachedMemo) setMemo(cachedMemo)
          if (cachedReport) setReport(cachedReport)

          if (!cachedMemo || !cachedReport) {
            const [memoRes, reportRes] = await Promise.all([
              cachedMemo ? Promise.resolve(cachedMemo) : getConsultationMemo(activeConversationId),
              cachedReport ? Promise.resolve(cachedReport) : getConversationReport(activeConversationId),
            ])
            memoCache.current[activeConversationId] = memoRes
            reportCache.current[activeConversationId] = reportRes
            persistCaches()
            setMemo(memoRes)
            setReport(reportRes)
          }
        }
      } catch (err) {
        console.error(err)
        setError("カルテ情報の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [selectedBooking, persistCaches])

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!selectedBooking) {
        setSimilarCases([])
        return
      }
      setSimilarLoading(true)
      setSimilarError(null)
      try {
        const cases = await getCaseExamples({ channel: selectedBooking.channel })
        setSimilarCases(cases)
      } catch (err) {
        console.error(err)
        setSimilarError("類似事例の取得に失敗しました")
        setSimilarCases([])
      } finally {
        setSimilarLoading(false)
      }
    }
    fetchSimilar()
  }, [selectedBooking])

  const days = useMemo(() => {
    const start = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1)
    const end = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0)
    const startWeekday = start.getDay()
    const total = startWeekday + end.getDate()
    const cells = Math.ceil(total / 7) * 7

    const dayList: { date: Date; iso: string; bookings: AdminBooking[] }[] = []
    for (let i = 0; i < cells; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() - startWeekday + i)
      const iso = toYMD(d)
      const dayBookings = bookingsData.filter((b) => b.date === iso)
      dayList.push({ date: d, iso, bookings: dayBookings })
    }
    return dayList
  }, [bookingsData, monthCursor])

  const todayIso = toYMD(new Date())

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">予約カレンダー</p>
            <h2 className="text-xl font-semibold text-slate-900">スケジュール</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#13274B]" : "text-slate-500"}`} />
              最新を取得
            </button>
            <button
              type="button"
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[140px] text-sm font-semibold text-slate-800 text-center">
              {monthCursor.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}
            </div>
            <button
              type="button"
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500 mb-2">
            {["日", "月", "火", "水", "木", "金", "土"].map((d, idx) => (
              <div
                key={d}
                className={`py-1 ${idx === 0 ? "text-rose-600" : idx === 6 ? "text-blue-600" : ""}`}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap justify-end gap-3 text-[10px] text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Video className="h-3 w-3 text-slate-600" />
              オンライン
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-600" />
              対面
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {days.map(({ date, iso, bookings: dayBookings }) => {
              const isCurrentMonth = date.getMonth() === monthCursor.getMonth()
              const isToday = iso === todayIso
              const hasBookings = dayBookings.length > 0
              const countLabel = hasBookings ? `${dayBookings.length}件` : ""
              const hasOnline = dayBookings.some((b) => b.channel === "online")
              const hasInPerson = dayBookings.some((b) => b.channel === "in-person")
              const isSunday = date.getDay() === 0
              const isSaturday = date.getDay() === 6
              const dayColor = (() => {
                if (isCurrentMonth) {
                  if (isSunday) return "text-rose-600"
                  if (isSaturday) return "text-blue-600"
                  return "text-slate-700"
                }
                return "text-slate-400"
              })()
              const statusMarks = Array.from(new Set(dayBookings.map((b) => b.status)))
              return (
                <button
                  key={iso + date.getDate()}
                  type="button"
                  onClick={() => {
                    setSelectedDate(iso)
                    if (dayBookings.length > 0) setSelectedId(dayBookings[0].id)
                    else setSelectedId(null)
                  }}
                  className={`min-h-[76px] sm:min-h-[88px] rounded-2xl border px-1.5 py-2 flex flex-col items-center justify-center gap-1 text-center transition ${
                    isCurrentMonth ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 text-slate-400"
                  } ${hasBookings ? "hover:border-[#13274B]/40" : ""} ${isToday ? "ring-2 ring-[#13274B]/40" : ""}`}
                >
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <span className={dayColor}>{date.getDate()}</span>
                    {hasBookings && <span className="text-[10px] font-semibold text-slate-700">{countLabel}</span>}
                  </div>
                  {hasBookings && (
                    <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] text-slate-600">
                      {hasOnline && <Video className="h-3 w-3 text-slate-600" aria-label="オンライン" />}
                      {hasInPerson && <MapPin className="h-3 w-3 text-slate-600" aria-label="対面" />}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        予約あり
                      </span>
                      {statusMarks.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          {statusMarks.map((st) => (
                            <span
                              key={`${iso}-${st}`}
                              className={`h-2.5 w-2.5 rounded-full ${statusDot[st] ?? "bg-slate-400"}`}
                              title={statusLabel[st] ?? st}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Notebook className="h-4 w-4 text-[#13274B]" />
            <div>
              <p className="text-xs text-slate-500">当日アジェンダ</p>
              <p className="text-sm font-semibold text-slate-800">
                {selectedDate ? `${formatDate(selectedDate)} の予約` : "日付を選択してください"}
              </p>
            </div>
          </div>
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {days
              .filter((d) => (selectedDate ? d.iso === selectedDate : false))
              .flatMap((d) => d.bookings)
              .map((b) => {
                const badgeClass = statusClass[b.status] ?? "bg-slate-50 border-slate-200 text-slate-600"
                const isActive = b.id === selectedId
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedId(b.id)}
                    className={`w-full text-left rounded-2xl border px-3 py-2 text-sm transition ${
                      isActive ? "border-[#13274B] bg-[#13274B]/5" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-[#13274B]" />
                      <span>{b.time_slot}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>{statusLabel[b.status] ?? b.status}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                        {b.channel === "online" ? <Video className="h-3.5 w-3.5 text-slate-600" /> : <MapPin className="h-3.5 w-3.5 text-slate-600" />}
                        {channelLabel[b.channel] ?? b.channel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-slate-800">
                      {b.channel === "online" ? <Video className="h-4 w-4 text-slate-600" /> : <MapPin className="h-4 w-4 text-slate-600" />}
                      <span className="truncate">{b.name}</span>
                    </div>
                  </button>
                )
              })}
            {selectedDate &&
              days.filter((d) => d.iso === selectedDate).every((d) => d.bookings.length === 0) && (
                <p className="text-xs text-slate-500">該当日の予約はありません</p>
              )}
            {!selectedDate && <p className="text-xs text-slate-500">日付を選択してください</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-500">カルテ</p>
              <h3 className="text-lg font-semibold text-slate-900">予約詳細</h3>
            </div>
            {selectedBooking && (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${
                  statusClass[selectedBooking.status] ?? "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                  {statusLabel[selectedBooking.status] ?? selectedBooking.status}
                </span>
                <Link
                  href={`/admin/bookings/${selectedBooking.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-[#13274B] shadow-sm hover:bg-slate-50"
                >
                  予約詳細を開く
                </Link>
              </div>
            )}
          </div>

          {selectedBooking ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-800">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-4 w-4 text-slate-600" />
                  {selectedBooking.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-600" />
                  {selectedBooking.time_slot}
                </span>
                <span className="inline-flex items-center gap-1">
                  {selectedBooking.channel === "online" ? <Video className="h-4 w-4 text-[#13274B]" /> : <MapPin className="h-4 w-4 text-[#13274B]" />}
                  {channelLabel[selectedBooking.channel] ?? selectedBooking.channel}
                </span>
              </div>
              <div className="space-y-1 text-sm text-slate-700">
                <p className="font-semibold">相談者: {selectedBooking.name}</p>
                {selectedBooking.user_name && <p className="text-xs text-slate-500">ユーザー名: {selectedBooking.user_name}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  {selectedBooking.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedBooking.phone}
                    </span>
                  )}
                  {selectedBooking.email && <span>{selectedBooking.email}</span>}
                </div>
                {selectedBooking.note && <p className="text-xs text-slate-600 whitespace-pre-line">メモ: {selectedBooking.note}</p>}
                {selectedBooking.meeting_url && (
                  <p className="text-xs text-slate-600 break-all">
                    オンラインURL:{" "}
                    <a className="text-[#13274B] underline" href={selectedBooking.meeting_url} target="_blank" rel="noreferrer">
                      {selectedBooking.meeting_url}
                    </a>
                  </p>
                )}
                {selectedBooking.line_contact && <p className="text-xs text-slate-600 break-all">LINE連絡先: {selectedBooking.line_contact}</p>}
                {selectedBooking.expert_name && <p className="text-xs text-slate-600">担当: {selectedBooking.expert_name}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">予約を選択してください</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Notebook className="h-4 w-4 text-[#13274B]" />
            <h3 className="text-sm font-semibold text-slate-900">会話要約・診断</h3>
          </div>
          {loading && <p className="text-xs text-slate-500">読み込み中...</p>}
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {!selectedBooking && <p className="text-sm text-slate-500">予約を選択してください。</p>}
          {selectedBooking && !selectedBooking.conversation_id && !loading && !error && !derivedConversationId && (
            <p className="text-sm text-slate-500">
              会話履歴が未紐付けです。予約詳細から conversation_id を設定してください。
            </p>
          )}
          {derivedConversationId && selectedBooking && !selectedBooking.conversation_id && (
            <p className="text-[11px] text-slate-500">
              この予約に紐付いた会話IDがないため、最新の会話（{derivedConversationId.slice(0, 6)}…）を仮表示しています。
              予約詳細から conversation_id を設定すると固定されます。
            </p>
          )}
          {memo && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">重要ポイント</p>
              <div className="grid gap-2">
                {memoPoints.map((p, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                    {p}
                  </div>
                ))}
              </div>
              {memoImportantPoints.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">相談員が押さえるべき点</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                    {memoImportantPoints.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {report && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">診断サマリ</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                  {summaryItems.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              {keyTopicItems.length ? (
                <div>
                  <p className="text-xs text-slate-500">重要トピック</p>
                  <div className="flex flex-wrap gap-2">
                    {keyTopicItems.map((t, idx) => (
                      <span key={idx} className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-[12px] font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {homeworkItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">ToDo</p>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {homeworkItems.map((h) => (
                      <li key={h.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div className="font-semibold">{h.title}</div>
                        {h.detail && <p className="text-xs text-slate-600 mt-1">{h.detail}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#13274B]" />
              <h3 className="text-sm font-semibold text-slate-900">類似成功例</h3>
            </div>
            <p className="text-[11px] text-slate-500">チャネルに合わせた2-3件</p>
          </div>
          <div className="space-y-3">
            {similarLoading && <p className="text-xs text-slate-500">読み込み中...</p>}
            {similarError && <p className="text-xs text-rose-600">{similarError}</p>}
            {!similarLoading && !similarError && similarCases.length === 0 && (
              <p className="text-sm text-slate-500">該当する事例がありません。</p>
            )}
            {similarCases.map((c, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{c.industry}</span>
                  <span className="font-semibold text-emerald-700">{c.result}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">{c.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {c.actions.map((a, aIdx) => (
                    <li key={aIdx} className="flex gap-2">
                      <span className="text-[#13274B]">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#13274B]" />
            <h3 className="text-sm font-semibold text-slate-900">過去相談履歴 (直近5件)</h3>
          </div>
          {selectedBooking && history.length === 0 && !loading && !error && (
            <p className="text-sm text-slate-500">履歴がありません。</p>
          )}
          <div className="space-y-2">
            {history.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{c.date}</span>
                  <span className="font-semibold text-slate-700">{c.id.slice(0, 6)}</span>
                </div>
                <p className="font-semibold text-slate-800">{cleanChoicePrefix(c.title)}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Link
                    href={`/admin/conversations/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-[#13274B] hover:bg-slate-50"
                  >
                    会話ログ（管理）
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
