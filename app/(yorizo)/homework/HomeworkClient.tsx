"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CheckCircle, ChevronDown, ChevronUp, Sprout } from "lucide-react"

import { ApiError, updateHomework, type HomeworkTask } from "@/lib/api"

type Props = {
  initialPending: HomeworkTask[]
  initialDone: HomeworkTask[]
}

export function HomeworkClient({ initialPending, initialDone }: Props) {
  const [pendingTasks, setPendingTasks] = useState<HomeworkTask[]>(initialPending)
  const [doneTasks, setDoneTasks] = useState<HomeworkTask[]>(initialDone)
  const [error, setError] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const summary = useMemo(() => {
    const total = pendingTasks.length + doneTasks.length
    const doneCount = doneTasks.length
    const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0
    return { total, doneCount, percent }
  }, [pendingTasks, doneTasks])

  const toggleStatus = async (task: HomeworkTask) => {
    setTogglingId(task.id)
    setError(null)
    try {
      const newStatus = task.status === "pending" ? "done" : "pending"
      const updated = await updateHomework(task.id, { status: newStatus })
      if (newStatus === "done") {
        setPendingTasks((prev) => prev.filter((t) => t.id !== task.id))
        setDoneTasks((prev) => [...prev, updated])
      } else {
        setDoneTasks((prev) => prev.filter((t) => t.id !== task.id))
        setPendingTasks((prev) => [...prev, updated])
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "更新に失敗しました。時間をおいてもう一度お試しください。"
      setError(message)
    } finally {
      setTogglingId(null)
    }
  }

  const renderTaskCard = (task: HomeworkTask, isDone: boolean) => {
    return (
      <div
        key={task.id}
        className={`rounded-3xl border px-4 py-3 shadow-sm space-y-2 ${
          isDone ? "bg-slate-50 border-slate-200" : "bg-white/95 border-white/80"
        }`}
      >
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className={`text-sm font-semibold ${isDone ? "text-slate-600 line-through" : "text-slate-800"}`}>
              {task.title}
            </p>
            {task.detail && <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">{task.detail}</p>}
          </div>
          <button
            type="button"
            onClick={() => toggleStatus(task)}
            disabled={togglingId === task.id}
            className={`text-xs rounded-full px-3 py-1 font-semibold border ${
              isDone ? "border-slate-300 text-slate-500 bg-white" : "border-emerald-200 text-emerald-700 bg-emerald-50"
            }`}
          >
            {togglingId === task.id ? "更新中…" : isDone ? "戻す" : "完了"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
          {task.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 border border-pink-100 px-2 py-0.5">
              <Sprout className="h-3 w-3 text-pink-500" />
              {task.category}
            </span>
          )}
          {task.due_date && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5">
              <CalendarDays className="h-3 w-3" />
              期限: {task.due_date}
            </span>
          )}
          {!task.due_date && <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">期限なし</span>}
        </div>
        {task.conversation_id && <p className="text-[11px] text-slate-500">会話ID: {task.conversation_id}</p>}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 pt-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--yori-ink-soft)]">宿題</p>
          <h1 className="text-2xl font-bold text-[var(--yori-ink-strong)]">やることリスト</h1>
          <p className="text-sm text-[var(--yori-ink)]">チャットから出てきた宿題をここで管理します。</p>
        </div>
        <div className="text-right text-xs text-[var(--yori-ink-soft)]">
          <p className="font-semibold text-[var(--yori-ink-strong)]">{summary.doneCount} / {summary.total} 完了</p>
          <p className="text-[11px]">達成率 {summary.percent}%</p>
        </div>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">進行中</p>
        </div>
        <div className="space-y-2">
          {pendingTasks.length === 0 && <p className="text-xs text-[var(--yori-ink-soft)]">未完了の宿題はありません。</p>}
          {pendingTasks.map((task) => renderTaskCard(task, false))}
        </div>
      </section>

      <section className="space-y-2">
        <button
          type="button"
          onClick={() => setShowDone((prev) => !prev)}
          className="flex items-center justify-between w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-2 text-sm font-semibold text-[var(--yori-ink-strong)]"
        >
          <span>完了済み</span>
          {showDone ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showDone && (
          <div className="space-y-2">
            {doneTasks.length === 0 && (
              <p className="text-xs text-[var(--yori-ink-soft)]">完了済みの宿題はありません。</p>
            )}
            {doneTasks.map((task) => renderTaskCard(task, true))}
          </div>
        )}
      </section>
    </div>
  )
}
