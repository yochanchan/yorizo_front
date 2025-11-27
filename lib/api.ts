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

export type ChatTurnResponse = {
  conversation_id: string
  reply: string
  question: string
  options: ChatOption[]
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
  status: "pending" | "done"
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

export type MemoryResponse = {
  current_concerns: string[]
  important_points_for_expert: string[]
  nickname: string
  remembered_facts: string[]
  past_conversations: { id: string; title: string; date: string }[]
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

export async function getExperts(): Promise<Expert[]> {
  const res = await fetch(`${API_BASE_URL}/api/experts`, { cache: "no-store" })
  if (!res.ok) throw new Error(`experts fetch failed: ${res.status}`)
  return res.json()
}

export async function getExpertAvailability(expertId: string): Promise<AvailabilityDay[]> {
  const res = await fetch(`${API_BASE_URL}/api/experts/${expertId}/availability`, { cache: "no-store" })
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
  messages: ConversationMessage[]
}

export async function getConversationDetail(conversationId: string): Promise<ConversationDetail> {
  const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`conversation fetch failed: ${res.status}`)
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
}

export type ConsultationBookingResponse = {
  booking_id: string
  expert_id: string
  date: string
  time_slot: string
  channel: string
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
