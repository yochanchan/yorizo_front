import {
  chatTurn,
  guidedChatTurn,
  listHomework,
  createHomework,
  bulkCreateHomeworkSuggestions,
  updateHomework,
  deleteHomework,
  getConversations,
  getMemory,
  getConsultationMemo,
  listDocuments,
  getExperts,
  getExpertAvailability,
  getConversationDetail,
  getCompanyAnalysisReport,
  getConversationReport,
  getCompanyReport,
  getCompanyProfile,
  saveCompanyProfile,
  createConsultationBooking,
  uploadDocument,
  getAdminBookings,
  getAdminBooking,
  updateAdminBooking,
  getCaseExamples,
} from "@/lib/api"
import type {
  ChatTurnResponse,
  HomeworkTask,
  ConversationSummary,
  DocumentItem,
  AdminBooking,
  SimilarCase,
  MemoryResponse,
  ConsultationMemo,
  Expert,
  AvailabilityDay,
  ConversationDetail,
  CompanyAnalysisReport,
  ConversationReport,
  CompanyReport,
  CompanyProfile,
  ConsultationBookingResponse,
} from "@/lib/api"
import { ApiError } from "@/lib/api-client"

function mockFetchJson(data: any) {
  ;(global as any).fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(data),
  })
}

describe("lib/api high-level wrappers", () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn()
  })

  it("chatTurn calls /api/chat and returns response", async () => {
    const payload: ChatTurnResponse = {
      conversation_id: "c1",
      reply: "reply text",
      question: "question text",
      options: [],
      cta_buttons: [],
      allow_free_text: true,
      step: 1,
      done: false,
    }
    mockFetchJson(payload)

    const result = await chatTurn({ message: "hello" })

    expect(result).toEqual(payload)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("chatTurn preserves cta_buttons when present", async () => {
    const payload: ChatTurnResponse = {
      conversation_id: "c1",
      reply: "reply text",
      question: "",
      options: [],
      cta_buttons: [{ id: "hw", label: "宿題を作成する", action: "open_homework" }],
      allow_free_text: true,
      step: 1,
      done: false,
    }
    mockFetchJson(payload)

    const result = await chatTurn({ message: "hello" })

    expect(result.cta_buttons?.[0]?.id).toBe("hw")
  })

  it("guidedChatTurn calls /api/chat/guided and returns response", async () => {
    const payload: ChatTurnResponse = {
      conversation_id: "c2",
      reply: "guided reply",
      question: "guided question",
      options: [],
      cta_buttons: [],
      allow_free_text: true,
      step: 2,
      done: false,
    }
    mockFetchJson(payload)

    const result = await guidedChatTurn({ message: "hi" })

    expect(result.conversation_id).toBe("c2")
    expect(result.reply).toBe("guided reply")
  })

  it("listHomework builds query with user_id and status", async () => {
    const tasks: HomeworkTask[] = [
      {
        id: 1,
        user_id: "u1",
        title: "task",
        status: "pending",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ]
    mockFetchJson(tasks)

    const result = await listHomework("u1", "pending")

    expect(result).toHaveLength(1)
    const [url] = (global.fetch as jest.Mock).mock.calls[0]
    expect(String(url)).toContain("/api/homework?")
    expect(String(url)).toContain("user_id=u1")
    expect(String(url)).toContain("status_filter=pending")
  })

  it("getConversations returns empty array when conversations is missing", async () => {
    mockFetchJson({})

    const result = await getConversations("u1")

    expect(result).toEqual([])
  })

  it("getConversations returns conversations when present", async () => {
    const conversations: ConversationSummary[] = [
      { id: "c1", title: "title", date: "2024-01-01" },
    ]
    mockFetchJson({ conversations })

    const result = await getConversations("u1", 10, 0)

    expect(result).toEqual(conversations)
  })

  it("getMemory fetches memory by user id", async () => {
    const memory: MemoryResponse = {
      current_concerns: ["a"],
      important_points_for_expert: ["b"],
      nickname: "Yori",
      remembered_facts: [],
      past_conversations: [],
      summary: {
        current_summary: [],
        key_problems: [],
        homework: [],
        expert_points: [],
      },
    }
    mockFetchJson(memory)

    const result = await getMemory("u1")

    expect(result?.nickname).toBe("Yori")
  })

  it("getConsultationMemo fetches memo for conversation", async () => {
    const memo: ConsultationMemo = {
      current_points: ["a"],
      important_points: ["b"],
      updated_at: "2024-01-01",
    }
    mockFetchJson(memo)

    const result = await getConsultationMemo("conv-1")

    expect(result.current_points).toEqual(["a"])
  })

  it("listDocuments returns empty array when documents is missing", async () => {
    mockFetchJson({})

    const result = await listDocuments()

    expect(result).toEqual([])
  })

  it("listDocuments returns documents array when present", async () => {
    const docs: DocumentItem[] = [
      {
        id: "d1",
        filename: "file.pdf",
        uploaded_at: "2024-01-01",
        size_bytes: 123,
      },
    ]
    mockFetchJson({ documents: docs })

    const result = await listDocuments("u1")

    expect(result).toEqual(docs)
  })

  it("getAdminBookings builds query string correctly", async () => {
    const bookings: AdminBooking[] = [
      {
        id: "b1",
        expert_id: "e1",
        channel: "online",
        status: "pending",
        date: "2024-01-01",
        time_slot: "10:00",
        name: "test",
        created_at: "2024-01-01",
      },
    ]
    mockFetchJson({ bookings })

    const result = await getAdminBookings({
      limit: 5,
      channel: "online",
      status: "pending",
      expert_id: "e1",
    })

    expect(result).toEqual(bookings)
    const [url] = (global.fetch as jest.Mock).mock.calls[0]
    const urlStr = String(url)
    expect(urlStr).toContain("limit=5")
    expect(urlStr).toContain("channel=online")
    expect(urlStr).toContain("status=pending")
    expect(urlStr).toContain("expert_id=e1")
  })

  it("getCaseExamples builds query string and returns cases", async () => {
    const cases: SimilarCase[] = [
      {
        title: "case",
        industry: "it",
        result: "ok",
        actions: ["action"],
      },
    ]
    mockFetchJson({ cases })

    const result = await getCaseExamples({ channel: "online", industry: "it" })

    expect(result).toEqual(cases)
    const [url] = (global.fetch as jest.Mock).mock.calls[0]
    const urlStr = String(url)
    expect(urlStr).toContain("channel=online")
    expect(urlStr).toContain("industry=it")
  })

  it("createHomework posts payload and returns created task", async () => {
    const task: HomeworkTask = {
      id: 2,
      user_id: "u1",
      title: "new task",
      status: "pending",
      created_at: "2024-01-02",
      updated_at: "2024-01-02",
    }
    mockFetchJson(task)

    const result = await createHomework({ user_id: "u1", title: "new task" })

    expect(result.id).toBe(2)
    expect(result.title).toBe("new task")
  })

  it("bulkCreateHomeworkSuggestions posts suggestions and returns tasks", async () => {
    const tasks: HomeworkTask[] = [
      {
        id: 3,
        user_id: "u1",
        title: "bulk",
        status: "pending",
        created_at: "2024-01-03",
        updated_at: "2024-01-03",
      },
    ]
    mockFetchJson(tasks)

    const result = await bulkCreateHomeworkSuggestions({
      user_id: "u1",
      tasks: [{ title: "bulk" }],
    })

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("bulk")
  })

  it("updateHomework patches payload and returns updated task", async () => {
    const task: HomeworkTask = {
      id: 4,
      user_id: "u1",
      title: "updated",
      status: "done",
      created_at: "2024-01-01",
      updated_at: "2024-01-04",
    }
    mockFetchJson(task)

    const result = await updateHomework(4, { status: "done" })

    expect(result.status).toBe("done")
  })

  it("deleteHomework sends DELETE request", async () => {
    ;(global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: jest.fn(),
    })

    await expect(deleteHomework(5)).resolves.toBeUndefined()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("getExperts returns experts list", async () => {
    const experts: Expert[] = [
      {
        id: "e1",
        name: "Expert",
        tags: [],
        rating: 5,
        review_count: 10,
      },
    ]
    mockFetchJson(experts)

    const result = await getExperts()

    expect(result).toEqual(experts)
  })

  it("getExpertAvailability returns availability or empty array", async () => {
    const availability: AvailabilityDay[] = [{ date: "2024-01-01", slots: ["10:00"] }]
    mockFetchJson({ availability })

    const result = await getExpertAvailability("e1")

    expect(result).toEqual(availability)
  })

  it("getConversationDetail returns detail", async () => {
    const detail: ConversationDetail = {
      id: "c1",
      title: "Conversation",
      started_at: null,
      messages: [],
    }
    mockFetchJson(detail)

    const result = await getConversationDetail("c1")

    expect(result.id).toBe("c1")
  })

  it("getCompanyAnalysisReport returns report", async () => {
    const report: CompanyAnalysisReport = {
      company_id: "comp1",
      last_updated_at: null,
      summary: "summary",
      basic_info_note: "note",
      finance_scores: [],
      pain_points: [],
      strengths: [],
      weaknesses: [],
      action_items: [],
    }
    mockFetchJson(report)

    const result = await getCompanyAnalysisReport("comp1")

    expect(result.company_id).toBe("comp1")
  })

  it("getConversationReport handles direct report payload", async () => {
    const report: ConversationReport = {
      id: "r1",
      title: "Report",
      summary: [],
      key_topics: [],
      homework: [],
      self_actions: [],
    }
    mockFetchJson(report)

    const result = await getConversationReport("c1")

    expect(result.id).toBe("r1")
  })

  it("getConversationReport unwraps nested report when exists is true", async () => {
    const report: ConversationReport = {
      id: "r2",
      title: "Report2",
      summary: [],
      key_topics: [],
      homework: [],
      self_actions: [],
    }
    mockFetchJson({ exists: true, report })

    const result = await getConversationReport("c1")

    expect(result.id).toBe("r2")
  })

  it("getConversationReport throws when report does not exist", async () => {
    ;(global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ exists: false }),
    })

    await expect(getConversationReport("c1")).rejects.toEqual(
      expect.objectContaining({
        message: "conversation report not found",
      }),
    )
  })

  it("getCompanyReport returns report", async () => {
    const report: CompanyReport = {
      company: { id: "c1" },
      radar: { axes: [], periods: [] },
      qualitative: {
        keieisha: {},
        jigyo: {},
        kankyo: {},
        naibu: {},
      },
      current_state: "",
      future_goal: "",
      action_plan: "",
      snapshot_strengths: [],
      snapshot_weaknesses: [],
      thinking_questions: [],
    }
    mockFetchJson(report)

    const result = await getCompanyReport("c1")

    expect(result.company.id).toBe("c1")
  })

  it("getCompanyProfile returns profile on success", async () => {
    const profile: CompanyProfile = {
      user_id: "u1",
      company_name: "Company",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    }
    mockFetchJson(profile)

    const result = await getCompanyProfile("u1")

    expect(result?.company_name).toBe("Company")
  })

  it("getCompanyProfile returns null when 404 is returned", async () => {
    ;(global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ detail: "Not found" }),
    })

    const result = await getCompanyProfile("u1")

    expect(result).toBeNull()
  })

  it("saveCompanyProfile posts payload and returns profile", async () => {
    const profile: CompanyProfile = {
      user_id: "u1",
      company_name: "Saved",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    }
    mockFetchJson(profile)

    const result = await saveCompanyProfile("u1", { company_name: "Saved" })

    expect(result.company_name).toBe("Saved")
  })

  it("createConsultationBooking posts payload and returns booking", async () => {
    const booking: ConsultationBookingResponse = {
      booking_id: "b1",
      expert_id: "e1",
      date: "2024-01-01",
      time_slot: "10:00",
      channel: "online",
      message: "ok",
    }
    mockFetchJson(booking)

    const result = await createConsultationBooking({
      expert_id: "e1",
      date: "2024-01-01",
      time_slot: "10:00",
      channel: "online",
      name: "User",
    })

    expect(result.booking_id).toBe("b1")
  })

  it("uploadDocument sends multipart form and returns result", async () => {
    const uploadResult = {
      document_id: "d1",
      filename: "file.txt",
      uploaded_at: "2024-01-01",
      summary: "summary",
    }
    mockFetchJson(uploadResult)

    const file = new Blob(["hello"], { type: "text/plain" }) as unknown as File

    const result = await uploadDocument({
      file,
      doc_type: "other",
      period_label: "2024",
      user_id: "u1",
    })

    expect(result.document_id).toBe("d1")
  })

  it("getAdminBooking returns a single booking", async () => {
    const booking: AdminBooking = {
      id: "b1",
      expert_id: "e1",
      channel: "online",
      status: "pending",
      date: "2024-01-01",
      time_slot: "10:00",
      name: "test",
      created_at: "2024-01-01",
    }
    mockFetchJson(booking)

    const result = await getAdminBooking("b1")

    expect(result.id).toBe("b1")
  })

  it("updateAdminBooking patches booking fields", async () => {
    const booking: AdminBooking = {
      id: "b1",
      expert_id: "e1",
      channel: "online",
      status: "done",
      date: "2024-01-01",
      time_slot: "10:00",
      name: "test",
      created_at: "2024-01-01",
    }
    mockFetchJson(booking)

    const result = await updateAdminBooking("b1", { status: "done" })

    expect(result.status).toBe("done")
  })
})
