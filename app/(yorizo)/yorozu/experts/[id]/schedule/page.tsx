"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CalendarDays, Clock, Loader2, MapPin, Star } from "lucide-react"
import { getExpertAvailability, getExperts, type AvailabilityDay, type Expert } from "@/lib/api"

export default function SchedulePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const expertId = params?.id

  const [expert, setExpert] = useState<Expert | null>(null)
  const [availability, setAvailability] = useState<AvailabilityDay[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [channel, setChannel] = useState<"online" | "in-person">("online")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!expertId) return
      try {
        const [experts, avail] = await Promise.all([getExperts(), getExpertAvailability(expertId)])
        setExpert(experts.find((e) => e.id === expertId) ?? null)
        setAvailability(avail)
        if (avail.length > 0) {
          setSelectedDate(avail[0].date)
        }
      } catch (err) {
        console.error(err)
        setError("予約可能な枠を取得できませんでした。")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [expertId])

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    const day = availability.find((d) => d.date === selectedDate)
    return day?.slots ?? []
  }, [availability, selectedDate])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const handleConfirm = () => {
    if (!expertId || !selectedDate || !selectedSlot) return
    router.push(
      `/yorozu/experts/${expertId}/confirm?date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(
        selectedSlot,
      )}&channel=${channel}`,
    )
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
          <p className="text-xs text-slate-500">予約可能な日付を選択してください</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>読み込み中...</span>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}

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

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CalendarDays className="h-4 w-4" />
          <span>予約可能日</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {availability.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => {
                setSelectedDate(day.date)
                setSelectedSlot(null)
              }}
              className={`rounded-2xl border px-2 py-2 text-xs font-semibold ${
                selectedDate === day.date
                  ? "border-amber-400 bg-amber-50 text-[#13274B]"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {formatDate(day.date)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Clock className="h-4 w-4" />
          <span>時間を選択</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {slotsForSelectedDate.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`rounded-full px-3 py-2 text-xs font-semibold border ${
                selectedSlot === slot
                  ? "bg-[#13274B] text-white border-[#13274B]"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              {slot}
            </button>
          ))}
          {slotsForSelectedDate.length === 0 && (
            <p className="text-xs text-slate-500">この日は予約枠がありません。</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">相談方法を選択</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setChannel("online")}
            className={`rounded-full py-3 text-sm font-semibold border ${
              channel === "online"
                ? "bg-[#13274B] text-white border-[#13274B]"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            オンライン
          </button>
          <button
            type="button"
            onClick={() => setChannel("in-person")}
            className={`rounded-full py-3 text-sm font-semibold border ${
              channel === "in-person"
                ? "bg-[#13274B] text-white border-[#13274B]"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            対面
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedSlot}
        className="w-full rounded-full bg-[#13274B] text-white py-3 text-sm font-semibold shadow-sm active:scale-98 transition-transform disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        この日時で相談予約へ進む
      </button>
    </div>
  )
}
