"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { CalendarDays, Clock, Loader2, MapPin, Star } from "lucide-react"

import { YoriCard } from "@/components/YoriCard"
import { YoriSectionCard } from "@/components/YoriSectionCard"
import { getExpertAvailability, getExperts, type AvailabilityDay, type Expert } from "@/lib/api"

export default function SchedulePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const expertId = params?.id
  const [conversationId, setConversationId] = useState<string | null>(searchParams.get("conversationId"))

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
          const firstOpen = avail.find((day) => availableCountForDay(day) > 0) ?? avail[0]
          setSelectedDate(firstOpen?.date ?? null)
        }
      } catch (err) {
        console.error(err)
        setError("予約可能な枠を取得できませんでした。時間をおいて再度お試しください。")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [expertId])

  useEffect(() => {
    if (conversationId) return
    if (typeof window === "undefined") return
    const latest = window.localStorage.getItem("lastConversationId")
    if (latest) {
      setConversationId(latest)
    }
  }, [conversationId])

  const selectedDay = useMemo(
    () => availability.find((d) => d.date === selectedDate),
    [availability, selectedDate],
  )
  const slotsForSelectedDate = selectedDay?.slots ?? []
  const bookedSlotsForSelectedDate = useMemo(
    () => new Set(selectedDay?.booked_slots ?? []),
    [selectedDay?.booked_slots],
  )

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-")
    if (parts.length < 3) return dateStr
    const month = Number(parts[1])
    const day = Number(parts[2])
    return `${month}/${day}`
  }

  const availableCountForDay = (day: AvailabilityDay) => day.available_count

  const handleConfirm = () => {
    if (!expertId || !selectedDate || !selectedSlot) return
    const qs = new URLSearchParams({
      date: selectedDate,
      time: selectedSlot,
      channel,
    })
    if (conversationId) {
      qs.set("conversationId", conversationId)
    }
    router.push(`/yorozu/experts/${expertId}/confirm?${qs.toString()}`)
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
          <p className="text-lg font-bold text-[var(--yori-ink-strong)]">相談予約</p>
          <p className="text-sm text-[var(--yori-ink)]">翌日〜28日先の平日の空き枠のみ表示します</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[var(--yori-ink)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>読み込み中...</span>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {expert && (
        <YoriSectionCard
          title="選択中の専門家"
          description={expert.title ?? undefined}
          icon={<Star className="h-5 w-5 text-amber-500 fill-amber-400" />}
        >
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

      <YoriSectionCard
        title="日付を選択"
        description="空きのある平日のみ表示します。満席の日付は選択できません。"
        icon={<CalendarDays className="h-5 w-5 text-[var(--yori-ink-strong)]" />}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availability.map((day) => {
            const availableCount = availableCountForDay(day)
            const disabled = availableCount === 0
            return (
              <YoriCard
                key={day.date}
                variant="choiceRequired"
                title={formatDate(day.date)}
                description={disabled ? "満席" : `空き${availableCount}`}
                selected={selectedDate === day.date}
                disabled={disabled}
                onClick={() => {
                  setSelectedDate(day.date)
                  setSelectedSlot(null)
                }}
                className="w-full"
              />
            )
          })}
          {availability.length === 0 && (
            <p className="text-sm text-[var(--yori-ink)] col-span-2">現在予約可能な日程がありません。</p>
          )}
        </div>
      </YoriSectionCard>

      <YoriSectionCard
        title="時間を選択"
        description={selectedDate ? `${formatDate(selectedDate)} の空き枠` : "日付を選択してください"}
        icon={<Clock className="h-5 w-5 text-[var(--yori-ink-strong)]" />}
      >
        {selectedDate ? (
          <div className="grid grid-cols-2 gap-3">
            {slotsForSelectedDate.map((slot) => {
              const isBooked = bookedSlotsForSelectedDate.has(slot)
              return (
                <YoriCard
                  key={slot}
                  variant="choiceOptional"
                  title={slot}
                  description={isBooked ? "予約済み" : undefined}
                  selected={selectedSlot === slot}
                  disabled={isBooked}
                  onClick={() => setSelectedSlot(slot)}
                  className="w-full"
                />
              )
            })}
            {slotsForSelectedDate.length === 0 && (
              <p className="text-sm text-[var(--yori-ink)] col-span-2">この日は表示できる枠がありません。</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--yori-ink)]">日付を選択すると時間枠が表示されます。</p>
        )}
      </YoriSectionCard>

      <YoriSectionCard title="相談方法">
        <div className="grid grid-cols-2 gap-3">
          <YoriCard
            variant="choiceOptional"
            title="オンライン"
            selected={channel === "online"}
            onClick={() => setChannel("online")}
            className="w-full"
          />
          <YoriCard
            variant="choiceOptional"
            title="対面"
            selected={channel === "in-person"}
            onClick={() => setChannel("in-person")}
            className="w-full"
          />
        </div>
      </YoriSectionCard>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedSlot}
        className="btn-primary w-full py-3 text-center text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        この日時で相談を申し込む
      </button>
    </div>
  )
}
