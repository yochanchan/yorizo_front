import { API_BASE_URL } from "./config"

export type ChatOption = { id: string; label: string; value?: string | null }

export type ChatTurnRequest = {
  conversation_id?: string
  user_id?: string
  selection?: {
    type: "choice" | "free_text"
    id?: string
    label?: string
    text?: string
  }
  message?: string
  selected_option_id?: string
  category?: string
}

export type ChatCTAButton = {
  id: string
  label: string
  action: string
}

export type ChatTurnResponse = {
  conversation_id: string
  reply: string
  question: string
  options: ChatOption[]
  cta_buttons?: ChatCTAButton[]
  allow_free_text: boolean
  step: number
  done: boolean
}

export async function chatTurn(payload: ChatTurnRequest): Promise<ChatTurnResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`chat failed: ${res.status}`)
  return res.json()
}

export async function guidedChatTurn(payload: ChatTurnRequest): Promise<ChatTurnResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/guided`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  })
  if (!res.ok) {
    let message = "Yorizoとの通信に失敗しました。時間をおいて再度お試しください。"
    try {
      const data = await res.json()
      if (data?.detail && typeof data.detail === "string") {
        message = data.detail
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }
  return res.json()
}

// Homework
export type HomeworkTask = {
  id: number
  user_id: string
  conversation_id?: string | null
  title: string
  detail?: string | null
  category?: string | null
  timeframe?: string | null
  status: "pending" | "in_progress" | "done"
  due_date?: string | null
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export type HomeworkTaskCreate = {
  user_id: string
  conversation_id?: string
  title: string
  detail?: string
  category?: string
  due_date?: string
  status?: "pending" | "done"
}

export type HomeworkTaskUpdate = Partial<Omit<HomeworkTaskCreate, "user_id" | "conversation_id">> & {
  status?: "pending" | "done"
  completed_at?: string | null
}

export async function listHomework(userId: string, status?: "pending" | "done"): Promise<HomeworkTask[]> {
  const query = new URLSearchParams({ user_id: userId })
  if (status) query.set("status_filter", status)
  const res = await fetch(`${API_BASE_URL}/api/homework?${query.toString()}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`homework list failed: ${res.status}`)
  return res.json()
}

export async function createHomework(payload: HomeworkTaskCreate): Promise<HomeworkTask> {
  const res = await fetch(`${API_BASE_URL}/api/homework`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`homework create failed: ${res.status}`)
  return res.json()
}

export async function bulkCreateHomeworkSuggestions(payload: {
  user_id: string
  conversation_id?: string
  tasks: { title: string; detail?: string; category?: string }[]
}): Promise<HomeworkTask[]> {
  const res = await fetch(`${API_BASE_URL}/api/homework/bulk-from-suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`homework bulk create failed: ${res.status}`)
  return res.json()
}

export async function updateHomework(taskId: number, payload: HomeworkTaskUpdate): Promise<HomeworkTask> {
  const res = await fetch(`${API_BASE_URL}/api/homework/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`homework update failed: ${res.status}`)
  return res.json()
}

export async function deleteHomework(taskId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/homework/${taskId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`homework delete failed: ${res.status}`)
}

export type CompanyProfileSummary = {
  company_name?: string | null
  industry?: string | null
  employees_range?: string | null
  annual_sales_range?: string | null
  location_prefecture?: string | null
}

export type MemorySummary = {
  current_summary: string[]
  key_problems: string[]
  homework: HomeworkTask[]
  expert_points: string[]
  company_profile?: CompanyProfileSummary | null
}

export type MemoryResponse = {
  current_concerns: string[]
  important_points_for_expert: string[]
  nickname: string
  remembered_facts: string[]
  past_conversations: { id: string; title: string; date: string }[]
  summary: MemorySummary
}

export async function getMemory(userId: string): Promise<MemoryResponse | null> {
  const res = await fetch(`${API_BASE_URL}/api/memory/${userId}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`memory fetch failed: ${res.status}`)
  return res.json()
}

export type ConversationSummary = { id: string; title: string; date: string }

export async function getConversations(userId?: string, limit?: number, offset?: number): Promise<ConversationSummary[]> {
  const params = new URLSearchParams()
  if (userId) params.set("user_id", userId)
  if (limit) params.set("limit", String(limit))
  if (offset) params.set("offset", String(offset))
  const query = params.toString() ? `?${params.toString()}` : ""
  const res = await fetch(`${API_BASE_URL}/api/conversations${query}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`conversations fetch failed: ${res.status}`)
  const data = await res.json()
  return data?.conversations ?? []
}

export type ConsultationMemo = {
  current_points: string[]
  important_points: string[]
  updated_at: string
}

export async function getConsultationMemo(conversationId: string): Promise<ConsultationMemo> {
  const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/memo`, { cache: "no-store" })
  if (!res.ok) throw new Error(`memo fetch failed: ${res.status}`)
  return res.json()
}

export async function refreshConsultationMemo(conversationId: string): Promise<ConsultationMemo> {
  const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/memo/refresh`, {
    method: "POST",
  })
  if (!res.ok) throw new Error(`memo refresh failed: ${res.status}`)
  return res.json()
}

export type Expert = {
  id: string
  name: string
  avatar_url?: string | null
  title?: string | null
  organization?: string | null
  tags: string[]
  rating: number
  review_count: number
  location_prefecture?: string | null
  description?: string | null
}

export type AvailabilityDay = {
  date: string
  slots: string[]
}

const EXPERTS_ENDPOINT = `${API_BASE_URL}/api/experts`

export async function getExperts(): Promise<Expert[]> {
  const res = await fetch(EXPERTS_ENDPOINT, { cache: "no-store" })
  if (!res.ok) throw new Error(`experts fetch failed: ${res.status}`)
  return res.json()
}

export async function getExpertAvailability(expertId: string): Promise<AvailabilityDay[]> {
  const res = await fetch(`${EXPERTS_ENDPOINT}/${expertId}/availability`, { cache: "no-store" })
  if (!res.ok) throw new Error(`availability fetch failed: ${res.status}`)
  const data = await res.json()
  return data?.availability ?? []
}

export type ConversationMessage = {
  id: string
  role: string
  content: string
  created_at: string
}

export type ConversationDetail = {
  id: string
  title: string
  started_at: string | null
  ended_at?: string | null
  category?: string | null
  status?: string | null
  step?: number | null
  messages: ConversationMessage[]
}

export async function getConversationDetail(conversationId: string): Promise<ConversationDetail> {
  const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`conversation fetch failed: ${res.status}`)
  return res.json()
}

export type LocalBenchmarkScore = {
  label: string
  description: string
  score: number | null
  raw_value?: number | null
  industry_avg?: number | null
  thresholds?: Record<string, unknown> | null
  reason?: string | null
}

export type CompanyAnalysisCategory = {
  category: string
  items: string[]
}

export type LocalBenchmarkAxis = {
  id: string
  label: string
  score: number
  reason?: string | null
}

export type LocalBenchmark = {
  axes: LocalBenchmarkAxis[]
}

export type CompanyAnalysisReport = {
  company_id: string
  last_updated_at: string | null
  summary: string
  basic_info_note: string
  finance_scores: LocalBenchmarkScore[]
  pain_points: CompanyAnalysisCategory[]
  strengths: string[]
  weaknesses: string[]
  action_items: string[]
  local_benchmark?: LocalBenchmark | null
}

export async function getCompanyAnalysisReport(companyId: string): Promise<CompanyAnalysisReport> {
  const url = new URL(`${API_BASE_URL}/api/reports/company-analysis`)
  url.searchParams.set("company_id", companyId)
  const res = await fetch(url.toString(), { cache: "no-store" })
  if (!res.ok) throw new Error(`company analysis fetch failed: ${res.status}`)
  return res.json()
}

export type ReportHomework = {
  id?: number | null
  title: string
  detail?: string | null
  timeframe?: string | null
  status?: "pending" | "in_progress" | "done" | null
}

export type ConversationReport = {
  id: string
  title: string
  category?: string | null
  created_at: string
  summary: string[]
  financial_analysis: string[]
  strengths: string[]
  weaknesses: string[]
  homework: ReportHomework[]
  key_topics?: string[]
  for_expert?: string[]
  local_benchmark?: LocalBenchmark | null
}

export async function getConversationReport(conversationId: string): Promise<ConversationReport> {
  const res = await fetch(`${API_BASE_URL}/api/report/${conversationId}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`conversation report fetch failed: ${res.status}`)
  return res.json()
}

export type CompanyProfile = {
  user_id: string
  company_name?: string | null
  industry?: string | null
  employees_range?: string | null
  annual_sales_range?: string | null
  location_prefecture?: string | null
  years_in_business?: number | null
  created_at: string
  updated_at: string
}

export type CompanyProfilePayload = Omit<CompanyProfile, "user_id" | "created_at" | "updated_at">

export async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  const res = await fetch(`${API_BASE_URL}/api/company-profile/${userId}`, { cache: "no-store" })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`company profile fetch failed: ${res.status}`)
  return res.json()
}

export async function saveCompanyProfile(userId: string, payload: CompanyProfilePayload): Promise<CompanyProfile> {
  const res = await fetch(`${API_BASE_URL}/api/company-profile/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`company profile save failed: ${res.status}`)
  return res.json()
}

export type ConsultationBookingPayload = {
  expert_id: string
  user_id?: string
  date: string
  time_slot: string
  channel: "online" | "in-person"
  name: string
  phone?: string
  email?: string
  note?: string
  meeting_url?: string
  line_contact?: string
}

export type ConsultationBookingResponse = {
  booking_id: string
  expert_id: string
  date: string
  time_slot: string
  channel: string
  meeting_url?: string | null
  line_contact?: string | null
  message: string
}

export async function createConsultationBooking(
  payload: ConsultationBookingPayload,
): Promise<ConsultationBookingResponse> {
  const res = await fetch(`${API_BASE_URL}/api/consultations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`consultation booking failed: ${res.status}`)
  return res.json()
}

export type DocumentType = "financial_statement" | "trial_balance" | "plan" | "other"

export type DocumentUploadResult = {
  document_id: string
  filename: string
  uploaded_at: string
  summary: string
  storage_path?: string
  ingested?: boolean
}

export type DocumentItem = {
  id: string
  filename: string
  uploaded_at: string
  size_bytes: number
  mime_type?: string | null
  doc_type?: DocumentType | null
  period_label?: string | null
  storage_path?: string
  ingested?: boolean
}

export type UploadDocumentPayload = {
  file: File
  doc_type: DocumentType
  period_label: string
  user_id?: string
  company_id?: string
  conversation_id?: string
}

export async function uploadDocument(payload: UploadDocumentPayload): Promise<DocumentUploadResult> {
  const form = new FormData()
  form.append("file", payload.file)
  form.append("doc_type", payload.doc_type)
  form.append("period_label", payload.period_label)
  if (payload.user_id) form.append("user_id", payload.user_id)
  if (payload.company_id) form.append("company_id", payload.company_id)
  if (payload.conversation_id) form.append("conversation_id", payload.conversation_id)

  const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: "POST",
    body: form,
  })
  if (!res.ok) throw new Error(`document upload failed: ${res.status}`)
  return res.json()
}

export async function listDocuments(userId?: string): Promise<DocumentItem[]> {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : ""
  const res = await fetch(`${API_BASE_URL}/api/documents${query}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`documents fetch failed: ${res.status}`)
  const data = await res.json()
  return data?.documents ?? []
}


export type AdminBooking = {
  id: string
  expert_id: string
  expert_name?: string | null
  user_id?: string | null
  user_name?: string | null
  channel: string
  status: string
  conversation_id?: string | null
  date: string
  time_slot: string
  name: string
  phone?: string | null
  email?: string | null
  note?: string | null
  meeting_url?: string | null
  line_contact?: string | null
  created_at: string
}

export async function getAdminBookings(params?: {
  limit?: number
  offset?: number
  channel?: string
  status?: string
  date_from?: string
  date_to?: string
  expert_id?: string
}): Promise<AdminBooking[]> {
  const query = new URLSearchParams()
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.offset) query.set("offset", String(params.offset))
  if (params?.channel) query.set("channel", params.channel)
  if (params?.status) query.set("status", params.status)
  if (params?.date_from) query.set("date_from", params.date_from)
  if (params?.date_to) query.set("date_to", params.date_to)
  if (params?.expert_id) query.set("expert_id", params.expert_id)
  const qs = query.toString()
  const res = await fetch(`${API_BASE_URL}/api/admin/bookings${qs ? `?${qs}` : ""}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`admin bookings fetch failed: ${res.status}`)
  const data = await res.json()
  return data?.bookings ?? []
}


export async function getAdminBooking(id: string): Promise<AdminBooking> {
  const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`admin booking fetch failed: ${res.status}`)
  return res.json()
}

export async function updateAdminBooking(
  id: string,
  payload: { status?: string; note?: string | null; conversation_id?: string | null; meeting_url?: string | null; line_contact?: string | null },
): Promise<AdminBooking> {
  const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`admin booking update failed: ${res.status}`)
  return res.json()
}

export type SimilarCase = {
  title: string
  industry: string
  result: string
  actions: string[]
}

export async function getCaseExamples(params?: { channel?: string; industry?: string }): Promise<SimilarCase[]> {
  const query = new URLSearchParams()
  if (params?.channel) query.set("channel", params.channel)
  if (params?.industry) query.set("industry", params.industry)
  const qs = query.toString()
  const res = await fetch(`${API_BASE_URL}/api/case-examples${qs ? `?${qs}` : ""}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`case examples fetch failed: ${res.status}`)
  const data = await res.json()
  return data?.cases ?? []
}
