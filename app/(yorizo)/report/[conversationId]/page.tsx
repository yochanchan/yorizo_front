"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CalendarDays, Check, ChevronRight, FileText, FolderOpen, Loader2, RefreshCcw, Save } from "lucide-react"

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
        className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm text-[var(--yori-ink-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)] min-h-[110px] leading-relaxed"
      />
    </div>
  )
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

  const [notExists, setNotExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [draftSaved, setDraftSaved] = useState<string | null>(null)

  const [recentConcerns, setRecentConcerns] = useState("")
  const [currentState, setCurrentState] = useState("")
  const [idealState, setIdealState] = useState("")
  const [discussionPoints, setDiscussionPoints] = useState("")
  const [background, setBackground] = useState("")

  // Conversation + report
  useEffect(() => {
    if (!conversationId) return
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [reportEnvelope, conversationDetail] = await Promise.all([
          getConversationReport(conversationId),
          getConversationDetail(conversationId),
        ])
        if (!mounted) return

        const responseReport = (reportEnvelope as any)?.report ?? reportEnvelope
        if ((reportEnvelope as any)?.exists === false || !responseReport) {
          setNotExists(true)
          setReport(null)
        } else {
          setReport(responseReport as ConversationReport)
        }
        setConversation(conversationDetail)
      } catch (err) {
        console.error(err)
        if (!mounted) return
        setError("相談メモを取得できませんでした。時間をおいて再試行してください。")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [conversationId, refreshKey])

  // Documents for checkbox list
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
    fetchDocs()
    return () => {
      active = false
    }
  }, [])

  // Restore local draft
  useEffect(() => {
    if (!conversationId || typeof window === "undefined") return
    const stored = localStorage.getItem(`consultation-memo-${conversationId}`)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as MemoDraft
      setRecentConcerns(parsed.recentConcerns || "")
      setCurrentState(parsed.currentState || "")
      setIdealState(parsed.idealState || "")
      setDiscussionPoints(parsed.discussionPoints || "")
      setBackground(parsed.background || "")
      setSelectedDocumentIds(parsed.documentIds || [])
      setDraftSaved("ローカルに保存した内容を読み込みました。")
    } catch {
      // ignore parse errors
    }
  }, [conversationId])

  // Prefill from report data (only if the field is empty)
  useEffect(() => {
    if (!report) return
    const joinList = (items?: string[]) => (items && items.length > 0 ? items.join("\n") : "")
    if (!recentConcerns.trim()) setRecentConcerns(joinList(report.summary))
    if (!currentState.trim()) setCurrentState(joinList(report.key_topics))
    if (!discussionPoints.trim()) setDiscussionPoints(joinList(report.for_expert))
    if (!idealState.trim() && report.strengths?.length) {
      setIdealState(joinList(report.strengths))
    }
    if (!background.trim() && report.weaknesses?.length) {
      setBackground(joinList(report.weaknesses))
    }
  }, [report, recentConcerns, currentState, discussionPoints, idealState, background])

  const memoTitle = useMemo(() => {
    const title = conversation?.title ?? report?.title ?? ""
    return cleanConversationTitle(title)
  }, [conversation, report])

  const memoDate = useMemo(() => {
    const raw = conversation?.ended_at ?? conversation?.started_at ?? report?.created_at
    if (!raw) return ""
    return new Date(raw).toLocaleDateString("ja-JP")
  }, [conversation, report])

  const handleRefresh = () => setRefreshKey((prev) => prev + 1)

  const handleSaveDraft = () => {
    if (!conversationId || typeof window === "undefined") return
    const payload: MemoDraft = {
      recentConcerns,
      currentState,
      idealState,
      discussionPoints,
      background,
      documentIds: selectedDocumentIds,
    }
    try {
      localStorage.setItem(`consultation-memo-${conversationId}`, JSON.stringify(payload))
      setDraftSaved("メモを保存しました（ローカル保存）。")
    } catch (err) {
      console.error(err)
      setError("ローカル保存に失敗しました。ブラウザのストレージ設定を確認してください。")
    }
  }

  const handleToggleDocument = (id: string) => {
    setSelectedDocumentIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  const summaryItems = report?.summary ?? []
  const keyTopics = report?.key_topics ?? []
  const expertPoints = report?.for_expert ?? []

  return (
    <div className="w-full flex flex-col gap-5 pb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--yori-ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> 戻る
        </button>
        <div className="text-xs font-semibold text-[var(--yori-ink-soft)] bg-[var(--yori-secondary)] px-3 py-1 rounded-full border border-[var(--yori-outline)]">
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
        <div className="flex items-center gap-2 text-sm text-[var(--yori-ink-soft)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>相談メモを読み込み中です…</span>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {notExists && !loading && (
        <div className="yori-card p-5 space-y-2">
          <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">相談メモはまだ作成されていません。</p>
          <p className="text-sm text-[var(--yori-ink)]">チャットを進めて、整理が完了したら相談メモが確認できます。</p>
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
              <div className="h-10 w-10 rounded-full bg-[var(--yori-secondary)] border border-[var(--yori-outline)] flex items-center justify-center">
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
              相談窓口に行く前に、経営のモヤモヤや伝えたい情報を整理しておくためのメモです。編集内容はブラウザ内に保存されます。
            </p>
          </header>

          <div className="grid gap-4">
            <TextSection
              title="最近の気になること"
              helper="売上に波がある、先々の資金繰りが不安、など今のモヤモヤを書き出してください。"
              placeholder="例）売上はあるのに手元にお金が残らない感じがする。仕入れが増えていて先の支払いが心配。"
              value={recentConcerns}
              onChange={setRecentConcerns}
            />
            <TextSection
              title="いまの状況（現状）"
              helper="数字・事実・これまでやってきたことなどを整理してください。"
              placeholder="例）ここ半年は来店数が前年同期比90%ほど。新メニューを出したが原価が高い。"
              value={currentState}
              onChange={setCurrentState}
            />
            <TextSection
              title="本当はこうなりたい（理想の姿）"
              helper="1〜3年くらい先に、どうなっていたらうれしいかを書いてください。"
              placeholder="例）月次で安定して黒字を出し、スタッフが安心して働ける環境にしたい。"
              value={idealState}
              onChange={setIdealState}
            />
            <TextSection
              title="今回、相談したいこと・一緒に決めたいこと"
              helper="箇条書きで構いません。迷っているポイントや決めたいことを書いてください。"
              placeholder="例）価格改定をするかどうか。採用をいつから始めるか。"
              value={discussionPoints}
              onChange={setDiscussionPoints}
            />
            <TextSection
              title="相談員に事前に知っておいてほしいこと"
              helper="家族構成やこれまで受けたアドバイスなど、背景情報があれば共有してください。"
              placeholder="例）以前別の窓口で棚卸しの方法を教わった。家族が手伝っている。"
              value={background}
              onChange={setBackground}
            />

            <div className="yori-card p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">一緒に見てほしい資料</p>
                <p className="text-xs text-[var(--yori-ink-soft)]">
                  Yorizoにアップ済みの資料を選べます。チェックを付けた資料のIDを相談メモにひもづけます。
                </p>
              </div>
              {documentsLoading && (
                <div className="flex items-center gap-2 text-xs text-[var(--yori-ink-soft)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>資料を読み込み中...</span>
                </div>
              )}
              {documentsError && <p className="text-xs text-rose-600">{documentsError}</p>}
              {!documentsLoading && documents.length === 0 && (
                <p className="text-sm text-[var(--yori-ink)]">まだ資料がアップされていません。</p>
              )}
              <div className="space-y-2">
                {documents.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--yori-outline)] bg-white/80 px-3 py-2"
                  >
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
            <p className="text-xs text-[var(--yori-ink-soft)]">
              ブラウザに一時保存します。別端末には同期されません。
            </p>
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
              <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">Yorizoの整理（参考）</p>
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
                  <p className="text-sm text-[var(--yori-ink)] leading-relaxed">相談内容は準備中です。</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">今回の重要ポイント</p>
                {keyTopics.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--yori-ink)]">
                    {keyTopics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--yori-ink)]">ポイントはまだありません。</p>
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
                <p className="text-sm text-[var(--yori-ink)]">まだ整理されていません。</p>
              )}
            </div>
          </div>

          <div className="yori-card p-5 space-y-3">
            <p className="text-base font-semibold text-[var(--yori-ink-strong)]">よろず支援に相談する</p>
            <p className="text-sm text-[var(--yori-ink)]">
              まとまったメモを持って、相談員と次の一歩を一緒に考えてみましょう。
            </p>
            <button
              type="button"
              onClick={() => router.push("/yorozu")}
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
