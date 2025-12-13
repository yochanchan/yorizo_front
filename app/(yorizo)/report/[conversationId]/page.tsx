"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderOpen,
  RefreshCcw,
  Save,
} from "lucide-react"

import { ThinkingRow } from "@/components/ThinkingRow"
import {
  getConversationDetail,
  getConversationReport,
  listDocuments,
  type ConversationDetail,
  type ConversationReport,
  type DocumentItem,
} from "@/lib/api"
import { cleanConversationTitle } from "@/lib/utils"

const USER_ID = "demo-user"
const LOCAL_STORAGE_PREFIX = "consultation-memo-"

const STATUS_STYLES = {
  pending: {
    label: "未着手",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  in_progress: {
    label: "進行中",
    className: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  done: {
    label: "完了",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
} as const

type StatusKey = keyof typeof STATUS_STYLES

type MemoDraft = {
  recentConcerns: string
  currentState: string
  idealState: string
  discussionPoints: string
  background: string
  documentIds: string[]
}

type TextSectionProps = {
  title: string
  helper?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

function TextSection({ title, helper, placeholder, value, onChange }: TextSectionProps) {
  return (
    <div className="yori-card p-4 space-y-2">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{title}</p>
        {helper && <p className="text-xs text-[var(--yori-ink-soft)]">{helper}</p>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[color:var(--yori-line-strong)] bg-white px-3 py-3 text-sm text-[var(--yori-ink-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)] min-h-[110px] leading-relaxed"
      />
    </div>
  )
}

function StatusBadge({ status }: { status: StatusKey }) {
  const style = STATUS_STYLES[status]
  return <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${style.className}`}>{style.label}</span>
}

export default function ConsultationMemoPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const router = useRouter()

  const [report, setReport] = useState<ConversationReport | null>(null)
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [draftSaved, setDraftSaved] = useState<string | null>(null)
  const goToBooking = () => {
    const qs = conversationId ? `?conversationId=${conversationId}` : ""
    router.push(`/yorozu${qs}`)
  }

  const [recentConcerns, setRecentConcerns] = useState("")
  const [currentState, setCurrentState] = useState("")
  const [idealState, setIdealState] = useState("")
  const [discussionPoints, setDiscussionPoints] = useState("")
  const [background, setBackground] = useState("")

  const storageKey = useMemo(() => (conversationId ? `${LOCAL_STORAGE_PREFIX}${conversationId}` : null), [conversationId])

  useEffect(() => {
    if (!conversationId) return
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [reportData, conversationDetail] = await Promise.all([
          getConversationReport(conversationId),
          getConversationDetail(conversationId),
        ])
        if (!mounted) return
        setReport(reportData)
        setConversation(conversationDetail)
      } catch (err) {
        console.error(err)
        if (!mounted) return
        setError("相談メモを取得できませんでした。時間をおいて再試行してください。")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [conversationId, refreshKey])

  useEffect(() => {
    let active = true
    const fetchDocs = async () => {
      try {
        setDocumentsLoading(true)
        const items = await listDocuments(USER_ID)
        if (!active) return
        setDocuments(items)
      } catch (err) {
        console.error(err)
        if (!active) return
        setDocumentsError("資料リストを取得できませんでした。")
      } finally {
        if (active) setDocumentsLoading(false)
      }
    }
    void fetchDocs()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as MemoDraft
      setRecentConcerns(parsed.recentConcerns ?? "")
      setCurrentState(parsed.currentState ?? "")
      setIdealState(parsed.idealState ?? "")
      setDiscussionPoints(parsed.discussionPoints ?? "")
      setBackground(parsed.background ?? "")
      setSelectedDocumentIds(parsed.documentIds ?? [])
      setDraftSaved("ローカルに保存した内容を読み込みました。")
    } catch {
      // ignore corrupted drafts
    }
  }, [storageKey])

  useEffect(() => {
    if (!report) return
    const joinList = (items?: string[]) => (items && items.length > 0 ? items.join("\n") : "")

    setRecentConcerns((prev) => (prev.trim() ? prev : joinList(report.summary)))
    setCurrentState((prev) => (prev.trim() ? prev : joinList(report.key_topics)))
    setDiscussionPoints((prev) => (prev.trim() ? prev : joinList(report.for_expert)))
    setIdealState((prev) =>
      prev.trim() || !report.strengths?.length ? prev : joinList(report.strengths),
    )
    setBackground((prev) =>
      prev.trim() || !report.weaknesses?.length ? prev : joinList(report.weaknesses),
    )
  }, [report])

  const memoTitle = useMemo(() => {
    const title = conversation?.title ?? report?.title ?? ""
    return cleanConversationTitle(title)
  }, [conversation, report])

  const memoDate = useMemo(() => {
    const raw = conversation?.started_at ?? report?.created_at
    if (!raw) return ""
    return new Date(raw).toLocaleDateString("ja-JP")
  }, [conversation, report])

  const selfActions = report?.self_actions ?? []

  const handleRefresh = () => setRefreshKey((prev) => prev + 1)

  const handleSaveDraft = () => {
    if (!storageKey || typeof window === "undefined") return
    const payload: MemoDraft = {
      recentConcerns,
      currentState,
      idealState,
      discussionPoints,
      background,
      documentIds: selectedDocumentIds,
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
      setDraftSaved("メモを保存しました（ブラウザ内に保存）")
    } catch (err) {
      console.error(err)
      setError("ローカル保存に失敗しました。ブラウザの設定をご確認ください。")
    }
  }

  const handleToggleDocument = (id: string) => {
    setSelectedDocumentIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  const summaryItems = report?.summary ?? []
  const keyTopics = report?.key_topics ?? []
  const expertPoints = report?.for_expert ?? []

  return (
    <div className="yori-report w-full flex flex-col gap-5 pb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--yori-ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> 戻る
        </button>
        <div className="text-xs font-semibold text-[var(--yori-ink-soft)] bg-[var(--yori-secondary)] px-3 py-1 rounded-full border border-[color:var(--yori-line-strong)]">
          相談メモ
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--yori-ink-soft)] underline underline-offset-4"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          最新の整理を再取得
        </button>
      </div>

      {loading && (
        <ThinkingRow text="相談メモを読み込み中です…" className="text-sm" />
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {!loading && !report && (
        <div className="yori-card p-5 space-y-2">
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">まだ相談メモがありません</p>
          <p className="text-sm text-[var(--yori-ink)]">まずはYorizoとチャットをしてモヤモヤを言語化しましょう。</p>
          <button
            type="button"
            onClick={() => router.push(`/chat?conversationId=${conversationId ?? ""}`)}
            className="btn-primary w-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            チャットに戻る
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {report && (
        <>
          <header className="yori-card p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--yori-secondary)] border border-[color:var(--yori-line-strong)] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--yori-ink-strong)]" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-[var(--yori-ink-soft)]">今回の相談メモ</p>
                <h1 className="text-xl font-bold text-[var(--yori-ink-strong)]">{memoTitle}</h1>
                <div className="flex items-center gap-2 text-xs text-[var(--yori-ink-soft)]">
                  <CalendarDays className="h-4 w-4" />
                  <span>{memoDate || "日付未設定"}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
              ここに書いた内容は、よろず支援や商工会など人に相談するときの“台本”になります。必要に応じて自由に書き換えてください。
            </p>
          </header>

          <section className="yori-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[var(--yori-ink-strong)]" />
              <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">自分で取り組むこと（自己解決アクション）</p>
            </div>
            {selfActions.length > 0 ? (
              <div className="space-y-3">
                {selfActions.map((action) => (
                  <div key={action.id} className="rounded-2xl border border-[color:var(--yori-line-strong)] bg-white p-3 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">{action.title}</p>
                      <StatusBadge status={(action.status || "pending") as StatusKey} />
                    </div>
                    {action.detail && <p className="text-sm text-[var(--yori-ink)] leading-relaxed whitespace-pre-wrap">{action.detail}</p>}
                    <div className="text-[11px] text-[var(--yori-ink-soft)] flex items-center gap-2">
                      {action.due_date && <span>期限: {new Date(action.due_date).toLocaleDateString("ja-JP")}</span>}
                      {action.updated_at && <span>更新: {new Date(action.updated_at).toLocaleDateString("ja-JP")}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--yori-ink)]">まだToDoの登録がありません。チャットの中で決まった取り組みがここに表示されます。</p>
            )}
          </section>

          <div className="grid gap-4">
            <TextSection
              title="最近の気になること"
              helper="今のモヤモヤをそのまま書いてください。"
              placeholder="例）売上に山谷があり、仕入の支払いが重なる月に資金繰りが厳しい。"
              value={recentConcerns}
              onChange={setRecentConcerns}
            />
            <TextSection
              title="今の状況・数字のメモ"
              helper="数字・事実・すでに取り組んでいることなどをまとめましょう。"
              placeholder="例）昨年比で来店数が80%程度。新メニューを始めたが原価が高い。"
              value={currentState}
              onChange={setCurrentState}
            />
            <TextSection
              title="本当はこうなりたい（理想の姿）"
              helper="1〜2年後にどうなっていたいかを言葉にしてください。"
              placeholder="例）月次で安定して黒字を出し、スタッフが安心して働けるチームにしたい。"
              value={idealState}
              onChange={setIdealState}
            />
            <TextSection
              title="今回、相談したいこと・一緒に決めたいこと"
              helper="箇条書きで構いません。迷っていることを書き出しましょう。"
              placeholder="例）価格改定をするかどうか。採用をいつから始めるか。"
              value={discussionPoints}
              onChange={setDiscussionPoints}
            />
            <TextSection
              title="相談前に知っておいてほしい背景"
              helper="家族構成やこれまで受けたアドバイスなど、共有したいことをどうぞ。"
              placeholder="例）以前別の窓口で棚卸の方法を教わった。家族が手伝っている。"
              value={background}
              onChange={setBackground}
            />

            <div className="yori-card p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">一緒に見せたい資料</p>
                <p className="text-xs text-[var(--yori-ink-soft)]">Yorizoにアップロード済みの資料を選択できます。相談相手に見せたい資料をチェックしてください。</p>
              </div>
              {documentsLoading && (
                <ThinkingRow text="資料を読み込み中..." className="text-xs" gap="compact" />
              )}
              {documentsError && <p className="text-xs text-rose-600">{documentsError}</p>}
              {!documentsLoading && documents.length === 0 && (
                <p className="text-sm text-[var(--yori-ink)]">まだ資料がアップロードされていません。</p>
              )}
              <div className="space-y-2">
                {documents.map((doc) => (
                  <label key={doc.id} className="flex items-center gap-3 rounded-2xl border border-[color:var(--yori-line-strong)] bg-white/80 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedDocumentIds.includes(doc.id)}
                      onChange={() => handleToggleDocument(doc.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[var(--yori-ink-strong)]">{doc.filename}</span>
                      <span className="text-xs text-[var(--yori-ink-soft)]">
                        {doc.doc_type || "種類未設定"} / {doc.period_label || "期間未設定"}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="yori-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-[var(--yori-ink-strong)]">
              <Save className="h-4 w-4" />
              <span>ここまでのメモを保存</span>
            </div>
            <p className="text-xs text-[var(--yori-ink-soft)]">ブラウザに一時保存します。別端末には同期されません。</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              >
                保存する
                <Check className="h-4 w-4" />
              </button>
              {draftSaved && <span className="text-xs text-[var(--yori-ink-soft)]">{draftSaved}</span>}
            </div>
          </div>

          <div className="yori-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-[var(--yori-ink-strong)]" />
              <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">Yorizoの整理メモ</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">今回の整理</p>
                {summaryItems.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)] leading-relaxed">
                    {summaryItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--yori-ink)]">まだ整理中です。</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">今回の論点</p>
                {keyTopics.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)]">
                    {keyTopics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--yori-ink)]">まだ論点は抽出されていません。</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">専門家に伝えると良さそうなこと</p>
              {expertPoints.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)] leading-relaxed">
                  {expertPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--yori-ink)]">必要に応じて入力してください。</p>
              )}
            </div>
          </div>

          <div className="yori-card p-5 space-y-3">
            <p className="text-base font-semibold text-[var(--yori-ink-strong)]">よろず支援に相談する</p>
            <p className="text-sm text-[var(--yori-ink)]">まとまったメモを持って、支援機関と次の一歩を一緒に考えましょう。</p>
            <button
              type="button"
              onClick={goToBooking}
              className="btn-primary w-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              よろず支援に相談する
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/chat?reset=true")}
              className="btn-ghost w-full px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              もう一度チャットで整理する
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
