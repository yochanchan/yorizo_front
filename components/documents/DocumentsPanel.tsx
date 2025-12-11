"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { BarChart2, ClipboardList, FileQuestion, FileText, Loader2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
  type DocumentItem,
  type DocumentType,
  type UploadDocumentPayload,
} from "@/lib/api"

type FilterType = DocumentType | "all"

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  financial_statement: "決算書",
  trial_balance: "月次・試算表",
  plan: "事業計画",
  other: "その他",
}

const typeOptions: { value: DocumentType; label: string }[] = [
  { value: "financial_statement", label: "決算書" },
  { value: "trial_balance", label: "月次・試算表" },
  { value: "plan", label: "事業計画・資金繰り表" },
  { value: "other", label: "その他" },
]

function formatDate(value?: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("ja-JP")
}

function typeIcon(type?: DocumentType | null) {
  switch (type) {
    case "financial_statement":
      return FileText
    case "trial_balance":
      return BarChart2
    case "plan":
      return ClipboardList
    default:
      return FileQuestion
  }
}

type DocumentsPanelProps = {
  companyId: string
  userId?: string
}

export function DocumentsPanel({ companyId, userId = "demo-user" }: DocumentsPanelProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<DocumentType>("financial_statement")
  const [periodLabel, setPeriodLabel] = useState("")
  const [fiscalYear, setFiscalYear] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")

  useEffect(() => {
    if (docType !== "financial_statement") {
      setFiscalYear("")
    }
  }, [docType])

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true)
        const data = await listDocuments(userId)
        setDocuments(data)
      } catch (err) {
        console.error(err)
        setError("資料の取得に失敗しました。もう一度お試しください。")
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [userId])

  const filteredDocs = useMemo(() => {
    if (filter === "all") return documents
    return documents.filter((doc) => doc.doc_type === filter)
  }, [documents, filter])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSelectedFile(file ?? null)
    setSuccess(null)
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedPeriod = periodLabel.trim()
    if (!selectedFile || !trimmedPeriod) {
      setError("資料の種類と対象期間、ファイルを入力してください。")
      return
    }
    let fiscalYearValue: number | undefined
    if (docType === "financial_statement") {
      const parsed = Number(fiscalYear.trim())
      if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) {
        setError("対象期間は西暦4桁（例: 2024）で入力してください。")
        return
      }
      fiscalYearValue = parsed
    }
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: UploadDocumentPayload = {
        file: selectedFile,
        doc_type: docType,
        period_label: trimmedPeriod,
        user_id: userId,
        company_id: companyId,
        fiscal_year: fiscalYearValue,
      }
      const result = await uploadDocument(payload)
      setSuccess("資料をアップロードしました。")
      setPeriodLabel("")
      setFiscalYear("")
      setSelectedFile(null)
      setDocuments((prev) => [
        {
          id: result.document_id,
          filename: result.filename,
          uploaded_at: result.uploaded_at,
          size_bytes: 0,
          doc_type: docType,
          period_label: payload.period_label,
          fiscal_year: fiscalYearValue,
        },
        ...prev,
      ])
    } catch (err) {
      console.error(err)
      setError("アップロードに失敗しました。ファイル形式とサイズを確認してください。")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">資料の種類</label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDocType(opt.value)}
                  className={`rounded-full border px-3 py-2 text-sm ${
                    docType === opt.value
                      ? "border-[var(--yori-ink-strong)] bg-[var(--yori-ink-strong)] text-white"
                      : "border-[var(--yori-outline)] bg-white text-[var(--yori-ink)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">対象期間</label>
            <input
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="例: 2024年度決算 / 2024年9月月次"
              className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
            />
          </div>
          {docType === "financial_statement" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">
                対象年度（西暦4桁）
                <span className="text-rose-600 ml-1 text-[10px]">必須</span>
              </label>
              <input
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                placeholder="例: 2024"
                inputMode="numeric"
                pattern="\\d*"
                className="w-full rounded-2xl border border-[var(--yori-outline)] bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--yori-tertiary)]"
              />
              <p className="text-[11px] text-[var(--yori-ink-soft)]">決算書の場合は西暦で入力してください。</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--yori-ink-strong)]">ファイル</label>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--yori-outline)] bg-[var(--yori-surface-muted)] px-4 py-3 text-sm text-[var(--yori-ink)] cursor-pointer">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-[var(--yori-ink-soft)]" />
              <span className="truncate">
                {selectedFile ? selectedFile.name : "ファイルを選択／ここをクリックしてファイルを選ぶ"}
              </span>
            </div>
            <input type="file" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {success && <p className="text-xs text-emerald-600">{success}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="btn-primary px-5 py-3 text-sm font-semibold inline-flex items-center gap-2 disabled:bg-slate-300"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            資料をアップロード
          </button>
        </div>
      </form>

      <div className="space-y-3 rounded-2xl border border-[var(--yori-outline)] bg-white p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--yori-ink-strong)]">保存済みの資料</p>
            <p className="text-xs text-[var(--yori-ink-soft)]">アップロードした資料は診断とレポートに活用されます。</p>
          </div>
          <span className="text-[11px] text-[var(--yori-ink-soft)]">合計 {documents.length} 件</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "financial_statement", "trial_balance", "plan", "other"] as FilterType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`yori-chip ${filter === t ? "bg-[var(--yori-secondary)] text-[var(--yori-ink-strong)]" : ""}`}
            >
              {t === "all" ? "すべて" : DOC_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[var(--yori-ink-soft)]">読み込み中…</p>
        ) : filteredDocs.length === 0 ? (
          <p className="text-sm text-[var(--yori-ink-soft)]">
            まだ資料が登録されていません。決算書などをアップロードすると、レポートでの助言がより具体的になります。
          </p>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map((doc) => {
              const Icon = typeIcon(doc.doc_type as DocumentType | undefined)
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-[18px] bg-[var(--yori-surface-muted)] px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--yori-secondary)] flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[var(--yori-ink-strong)]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[var(--yori-ink-strong)]">
                        {doc.period_label || doc.filename}
                      </span>
                      <span className="text-[11px] text-[var(--yori-ink-soft)]">
                        {(doc.doc_type && DOC_TYPE_LABELS[doc.doc_type as DocumentType]) || "資料"}・{formatDate(doc.uploaded_at)}
                      </span>
                      {doc.fiscal_year ? (
                        <span className="text-[11px] text-[var(--yori-ink-soft)]">対象年度: {doc.fiscal_year}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/api/documents/${doc.id}/download`)}
                      className="btn-ghost text-xs px-3 py-2"
                    >
                      ダウンロード
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteDocument(doc.id)
                          setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
                        } catch (err) {
                          console.error(err)
                          setError("削除に失敗しました。")
                        }
                      }}
                      className="text-xs text-rose-600 hover:underline px-2 py-1"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
