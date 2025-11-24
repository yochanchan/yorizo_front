"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, CheckCircle, ChevronDown, ChevronUp, Loader2, RotateCcw, Sprout } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  listHomework,
  updateHomework,
  type HomeworkTask,
} from "@/lib/api"

const USER_ID = "demo-user"

export default function HomeworkPage() {
  const router = useRouter()
  const [pendingTasks, setPendingTasks] = useState<HomeworkTask[]>([])
  const [doneTasks, setDoneTasks] = useState<HomeworkTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const [pending, done] = await Promise.all([
        listHomework(USER_ID, "pending"),
        listHomework(USER_ID, "done"),
      ])
      setPendingTasks(pending)
      setDoneTasks(done)
    } catch (err) {
      console.error(err)
      setError("宿題リストを読み込めませんでした。時間をおいてもう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const summary = useMemo(() => {
    const total = pendingTasks.length + doneTasks.length
    const doneCount = doneTasks.length
    const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0
    return { total, doneCount, percent }
  }, [pendingTasks, doneTasks])

  const toggleStatus = async (task: HomeworkTask) => {
    setTogglingId(task.id)
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
      console.error(err)
      setError("更新に失敗しました。時間をおいてもう一度お試しください。")
    } finally {
      setTogglingId(null)
    }
  }

  const renderTaskCard = (task: HomeworkTask, isDone: boolean) => {
    return (
      <div
        key={task.id}
        className={`rounded-3xl border px-4 py-3 shadow-sm space-y-2 ${isDone ? "bg-slate-50 border-slate-200" : "bg-white/95 border-white/80"}`}
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
              〜 {task.due_date}
            </span>
          )}
          {!task.due_date && <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">期限なし</span>}
        </div>
        {task.conversation_id && (
          <p className="text-[11px] text-slate-500">会話ID: {task.conversation_id}</p>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 pt-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-600">今の宿題の状況</p>
          <h1 className="text-xl font-bold text-slate-800">宿題リスト</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#13274B] shadow-sm"
        >
          チャットへ戻る
        </button>
      </div>

      <div className="rounded-3xl bg-white/95 border border-white/80 shadow-sm p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>進捗サマリー</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span className="font-semibold text-[#13274B]">未完了: {pendingTasks.length}件</span>
          <span>完了: {doneTasks.length}件</span>
          <span className="text-xs text-slate-500">完了率 {summary.percent}%</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          読み込み中…
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">やることリスト</p>
              {togglingId && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />}
            </div>
            {pendingTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
                まだ宿題はありません。チャットで宿題を追加してみてください。
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((task) => renderTaskCard(task, false))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <button
              type="button"
              onClick={() => setShowDone((prev) => !prev)}
              className="w-full flex items-center justify-between rounded-2xl bg-white/95 border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm"
            >
              <span>完了した宿題 ({doneTasks.length}件)</span>
              {showDone ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showDone && (
              <div className="space-y-2">
                {doneTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
                    完了済みの宿題はまだありません。
                  </div>
                ) : (
                  doneTasks.map((task) => renderTaskCard(task, true))
                )}
              </div>
            )}
          </section>

          <div className="text-center text-xs text-slate-500 pt-2">
            <button
              type="button"
              onClick={fetchTasks}
              className="inline-flex items-center gap-1 text-[#13274B] font-semibold"
            >
              <RotateCcw className="h-4 w-4" /> 再読み込み
            </button>
          </div>
        </>
      )}
    </div>
  )
}
