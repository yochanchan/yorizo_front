import { apiFetch, ApiError, LLM_FALLBACK_MESSAGE } from "./api-client"

export { ApiError, type ApiResult, DEFAULT_API_ERROR_MESSAGE, LLM_FALLBACK_MESSAGE } from "./api-client"

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

export type Citation = {
  title: string
  path?: string | null
  page?: number | null
  score?: number | null
}

export type ChatTurnResponse = {
  conversation_id: string
  reply: string
  question: string
  options: ChatOption[]
  allow_free_text: boolean
  step: number
  done: boolean
  citations?: Citation[] | null
  checkpoint?: {
    index: number
    title: string
    summary: string
    updated_at: string
  } | null
  show_consult_memo?: boolean
  memo_available?: boolean
}

export type SpeechTokenResponse = {
  token: string
  region: string
  expires_in: number
}

export async function chatTurn(payload: ChatTurnRequest): Promise<ChatTurnResponse> {
  return apiFetch<ChatTurnResponse>("/api/chat", {
    method: "POST",
    json: payload,
    fallbackMessage: LLM_FALLBACK_MESSAGE,
  })
}

export async function guidedChatTurn(payload: ChatTurnRequest): Promise<ChatTurnResponse> {
  return apiFetch<ChatTurnResponse>("/api/chat/guided", {
    method: "POST",
    json: payload,
    fallbackMessage: LLM_FALLBACK_MESSAGE,
  })
}

export async function getSpeechToken(): Promise<SpeechTokenResponse> {
  return apiFetch<SpeechTokenResponse>("/api/speech/token", {
    method: "POST",
  })
}

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
  timeframe?: string
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
  return apiFetch<HomeworkTask[]>(`/api/homework?${query.toString()}`)
}

export async function createHomework(payload: HomeworkTaskCreate): Promise<HomeworkTask> {
  return apiFetch<HomeworkTask>("/api/homework", {
    method: "POST",
    json: payload,
  })
}

export async function bulkCreateHomeworkSuggestions(payload: {
  user_id: string
  conversation_id?: string
  tasks: { title: string; detail?: string; category?: string }[]
}): Promise<HomeworkTask[]> {
  return apiFetch<HomeworkTask[]>("/api/homework/bulk-from-suggestions", {
    method: "POST",
    json: payload,
  })
}

export async function updateHomework(taskId: number, payload: HomeworkTaskUpdate): Promise<HomeworkTask> {
  return apiFetch<HomeworkTask>(`/api/homework/${taskId}`, {
    method: "PATCH",
    json: payload,
  })
}

export async function deleteHomework(taskId: number): Promise<void> {
  await apiFetch(`/api/homework/${taskId}`, { method: "DELETE", parseJson: false })
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
  return apiFetch<MemoryResponse | null>(`/api/memory/${userId}`)
}

export type ConversationSummary = { id: string; title: string; date: string }

export async function getConversations(userId?: string, limit?: number, offset?: number): Promise<ConversationSummary[]> {
  const params = new URLSearchParams()
  if (userId) params.set("user_id", userId)
  if (limit) params.set("limit", String(limit))
  if (offset) params.set("offset", String(offset))
  const query = params.toString()
  const data = await apiFetch<{ conversations?: ConversationSummary[] }>(
    `/api/conversations${query ? `?${query}` : ""}`,
  )
  return data?.conversations ?? []
}

export type ConsultationMemo = {
  current_points: string[]
  important_points: string[]
  created_at: string
  updated_at: string
}

export async function getConsultationMemo(conversationId: string): Promise<ConsultationMemo> {
  return apiFetch<ConsultationMemo>(`/api/conversations/${conversationId}/memo`)
}

export async function refreshConsultationMemo(conversationId: string): Promise<ConsultationMemo> {
  return apiFetch<ConsultationMemo>(`/api/conversations/${conversationId}/memo/refresh`, {
    method: "POST",
  })
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
  booked_slots: string[]
  available_count: number
}

const EXPERTS_ENDPOINT = "/api/experts"

export async function getExperts(): Promise<Expert[]> {
  return apiFetch<Expert[]>(EXPERTS_ENDPOINT)
}

export async function getExpertAvailability(expertId: string): Promise<AvailabilityDay[]> {
  const data = await apiFetch<{ availability?: AvailabilityDay[] }>(`${EXPERTS_ENDPOINT}/${expertId}/availability`)
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
  return apiFetch<ConversationDetail>(`/api/conversations/${conversationId}`)
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
  const params = new URLSearchParams({ company_id: companyId })
  return apiFetch<CompanyAnalysisReport>(`/api/reports/company-analysis?${params.toString()}`)
}

export type ReportHomework = {
  id?: number | null
  title: string
  detail?: string | null
  timeframe?: string | null
  status?: "pending" | "in_progress" | "done" | null
}

export type ReportSelfAction = {
  id: number
  title: string
  detail?: string | null
  status: "pending" | "in_progress" | "done"
  due_date?: string | null
  updated_at?: string | null
}

export type ConversationReport = {
  id: string
  title: string
  summary: string[]
  key_topics: string[]
  homework: ReportHomework[]
  self_actions: ReportSelfAction[]
  category?: string | null
  created_at?: string
  strengths?: string[]
  weaknesses?: string[]
  for_expert?: string[]
}

export async function getConversationReport(conversationId: string): Promise<ConversationReport> {
  const data = await apiFetch<
    ConversationReport | { exists?: boolean; report?: ConversationReport }
  >(`/api/conversations/${conversationId}/report`)

  if (data && typeof data === "object" && "exists" in data) {
    if (data.exists === false || !data.report) {
      throw new ApiError("conversation report not found")
    }
    return data.report as ConversationReport
  }

  return data as ConversationReport
}

export type KpiValue = {
  key: string
  label: string
  value_display?: string | null
  raw?: number | null
  unit?: string | null
  score?: number | null
}

export type RadarPeriod = {
  label: string
  scores: number[]
  raw_values: (number | null)[]
  kpis?: KpiValue[]
}

export type RadarSection = {
  axes: string[]
  periods: RadarPeriod[]
}

export interface CompanySummary {
  id: string | number
  company_name?: string | null
  name?: string | null
  industry?: string | null
  employees?: number | null
  employees_range?: string | null
  annual_sales_range?: string | null
  annual_revenue_range?: string | null
}

export type QualitativeBlock = {
  keieisha: Record<string, string>
  jigyo: Record<string, string>
  kankyo: Record<string, string>
  naibu: Record<string, string>
}

export type CompanyReport = {
  company: CompanySummary
  radar: RadarSection
  qualitative: QualitativeBlock
  current_state: string
  future_goal: string
  action_plan: string
  snapshot_strengths: string[]
  snapshot_weaknesses: string[]
  desired_image?: string | null
  gap_summary?: string | null
  thinking_questions: string[]
}

export async function getCompanyReport(companyId: string): Promise<CompanyReport> {
  return apiFetch<CompanyReport>(`/api/companies/${companyId}/report`)
}

export type CompanyProfile = {
  user_id: string
  company_name?: string | null
  industry?: string | null
  employees_range?: string | null
  annual_sales_range?: string | null
  location_prefecture?: string | null
  years_in_business?: number | null
  business_type?: string | null
  founded_year?: number | null
  city?: string | null
  main_bank?: string | null
  has_loan?: string | null
  has_rent?: string | null
  owner_age?: string | null
  main_concern?: string | null
  created_at: string
  updated_at: string
}

export type CompanyProfilePayload = Omit<CompanyProfile, "user_id" | "created_at" | "updated_at">

export async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  try {
    return await apiFetch<CompanyProfile>(`/api/company-profile/${userId}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function saveCompanyProfile(userId: string, payload: CompanyProfilePayload): Promise<CompanyProfile> {
  return apiFetch<CompanyProfile>(`/api/company-profile/${userId}`, {
    method: "POST",
    json: payload,
  })
}

export type ConsultationBookingPayload = {
  expert_id: string
  user_id?: string
  conversation_id?: string
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
  conversation_id?: string | null
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
  return apiFetch<ConsultationBookingResponse>("/api/consultations", {
    method: "POST",
    json: payload,
  })
}

export type ConsultationBookingListItem = {
  id: string
  date: string
  time_slot: string
  channel: string
  status: string
  expert_name?: string | null
}

export async function getConsultations(
  userId: string,
  limit?: number,
  dateFrom?: string,
): Promise<ConsultationBookingListItem[]> {
  const params = new URLSearchParams({ user_id: userId })
  if (limit !== undefined) params.set("limit", String(limit))
  if (dateFrom) params.set("date_from", dateFrom)
  const data = await apiFetch<{ bookings?: ConsultationBookingListItem[] }>(
    `/api/consultations?${params.toString()}`,
  )
  return data?.bookings ?? []
}

export type ConsultationMemoListItem = {
  conversation_id: string
  created_at: string
  current_point_preview: string
  important_point_preview: string
}

export async function listConsultationMemos(userId: string, limit?: number): Promise<ConsultationMemoListItem[]> {
  const params = new URLSearchParams({ user_id: userId })
  if (limit !== undefined) params.set("limit", String(limit))
  const data = await apiFetch<{ memos?: ConsultationMemoListItem[] }>(
    `/api/consultation-memos?${params.toString()}`,
  )
  return data?.memos ?? []
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
  fiscal_year?: number | null
}

export type UploadDocumentPayload = {
  file: File
  doc_type: DocumentType
  period_label: string
  fiscal_year?: number
  user_id?: string
  company_id?: string
  conversation_id?: string
}

export async function uploadDocument(payload: UploadDocumentPayload): Promise<DocumentUploadResult> {
  const form = new FormData()
  form.append("file", payload.file)
  form.append("doc_type", payload.doc_type)
  form.append("period_label", payload.period_label)
  if (payload.fiscal_year !== undefined && payload.fiscal_year !== null) {
    form.append("fiscal_year", String(payload.fiscal_year))
  }
  if (payload.user_id) form.append("user_id", payload.user_id)
  if (payload.company_id) form.append("company_id", payload.company_id)
  if (payload.conversation_id) form.append("conversation_id", payload.conversation_id)

  return apiFetch<DocumentUploadResult>("/api/documents/upload", {
    method: "POST",
    body: form,
  })
}

export async function listDocuments(userId?: string): Promise<DocumentItem[]> {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : ""
  const data = await apiFetch<{ documents?: DocumentItem[] }>(`/api/documents${query}`)
  return data?.documents ?? []
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiFetch(`/api/documents/${documentId}`, { method: "DELETE", parseJson: false })
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
  const data = await apiFetch<{ bookings?: AdminBooking[] }>(`/api/admin/bookings${qs ? `?${qs}` : ""}`)
  return data?.bookings ?? []
}

export async function getAdminBooking(id: string): Promise<AdminBooking> {
  return apiFetch<AdminBooking>(`/api/admin/bookings/${id}`)
}

export async function updateAdminBooking(
  id: string,
  payload: {
    status?: string
    note?: string | null
    conversation_id?: string | null
    meeting_url?: string | null
    line_contact?: string | null
  },
): Promise<AdminBooking> {
  return apiFetch<AdminBooking>(`/api/admin/bookings/${id}`, {
    method: "PATCH",
    json: payload,
  })
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
  const data = await apiFetch<{ cases?: SimilarCase[] }>(`/api/case-examples${qs ? `?${qs}` : ""}`)
  return data?.cases ?? []
}
