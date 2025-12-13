import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import ChatClient from "@/app/(yorizo)/chat/ChatClient"
import { ApiError, LLM_FALLBACK_MESSAGE, getConversationDetail, guidedChatTurn } from "@/lib/api"

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    guidedChatTurn: jest.fn(),
    uploadDocument: jest.fn(),
    getConversationDetail: jest.fn(),
  }
})

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
}))

const mockedGuidedChatTurn = guidedChatTurn as jest.MockedFunction<typeof guidedChatTurn>
const mockedGetConversationDetail = getConversationDetail as jest.MockedFunction<typeof getConversationDetail>

beforeAll(() => {
  if (!(global as any).crypto) {
    ; (global as any).crypto = require("crypto").webcrypto
  }
  if (!(global as any).crypto.randomUUID) {
    ; (global as any).crypto.randomUUID = () => "test-uuid"
  }
})

describe("ChatClient", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("places the step indicator after the last assistant message and before quick options", () => {
    render(<ChatClient initialConversationId={null} />)

    const lastAssistantMessage = screen.getByText(
      "まず、気になっているテーマを1つ選んでください。どれもピンとこなければ「その他」を選んでください。",
    )
    const stepIndicator = screen.getByTestId("chat-step-indicator")
    const quickOptionsTitle = screen.getByText("気になるテーマを選んでください")

    expect(lastAssistantMessage.compareDocumentPosition(stepIndicator) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(stepIndicator.compareDocumentPosition(quickOptionsTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("shows 0/5 progress, updates to 5/5, and no guide label is rendered", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "c1",
      reply: "返信が届きました",
      question: "",
      options: [],
      allow_free_text: true,
      step: 6,
      done: false,
    })

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    expect(screen.getByText("ステップ 0 / 5")).toBeInTheDocument()
    expect(screen.queryByText(/ガイド/)).toBeNull()

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "こんにちは")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => expect(screen.getByText("ステップ 5 / 5")).toBeInTheDocument())
    expect(screen.getByText("返信が届きました")).toBeInTheDocument()
    expect(
      screen.getByText("まず、気になっているテーマを1つ選んでください。どれもピンとこなければ「その他」を選んでください。"),
    ).toBeInTheDocument()
  })

  it("hides input UI and shows the consultation memo card when done", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "done-1",
      reply: "完了です",
      question: "",
      options: [],
      allow_free_text: false,
      step: 5,
      done: true,
    })

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "完了テスト")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => expect(screen.getByText("相談メモをまとめました")).toBeInTheDocument())
    const stepIndicator = screen.getByTestId("chat-step-indicator")
    const memoTitle = screen.getByText("相談メモをまとめました")
    expect(stepIndicator.compareDocumentPosition(memoTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText("完了です").compareDocumentPosition(stepIndicator) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole("button", { name: "相談メモを開く" })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText("ご相談内容を入力してください")).not.toBeInTheDocument()
    expect(screen.queryByTestId("voice-toggle")).not.toBeInTheDocument()
  })

  it("keeps the initial message when loading a past conversation", async () => {
    mockedGetConversationDetail.mockResolvedValue({
      id: "old-1",
      title: "",
      started_at: null,
      status: "in_progress",
      step: 3,
      messages: [
        {
          id: "a1",
          role: "assistant",
          content: JSON.stringify({ reply: "過去の回答", allow_free_text: true, done: false, step: 3 }),
          created_at: "",
        },
      ],
    })

    render(<ChatClient initialConversationId="old-1" />)

    await waitFor(() => expect(screen.getByText("過去の回答")).toBeInTheDocument())
    expect(
      screen.getByText("まず、気になっているテーマを1つ選んでください。どれもピンとこなければ「その他」を選んでください。"),
    ).toBeInTheDocument()
    expect(screen.getByText("ステップ 3 / 5")).toBeInTheDocument()
  })

  it("scrolls window to the bottom with smooth behavior when new messages arrive", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "scroll-1",
      reply: "スクロールテスト",
      question: "",
      options: [],
      allow_free_text: true,
      step: 1,
      done: false,
    })

    Object.defineProperty(document.documentElement, "scrollHeight", { value: 480, configurable: true })
    const scrollTo = jest.fn()
    // @ts-expect-error jsdom global
    window.scrollTo = scrollTo

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "スクロール")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "smooth",
        top: 480,
      }),
    )
  })

  it("falls back to scrollTop when scrollTo is unavailable", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "scroll-2",
      reply: "スクロールトップ",
      question: "",
      options: [],
      allow_free_text: true,
      step: 2,
      done: false,
    })

    // @ts-expect-error jsdom global
    window.scrollTo = undefined
    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    const container = screen.getByTestId("chat-messages") as HTMLElement
    Object.defineProperty(container, "scrollTo", { value: undefined, configurable: true })
    const scrollTopSetter = jest.fn()
    Object.defineProperty(container, "scrollTop", { set: scrollTopSetter, configurable: true })
    Object.defineProperty(container, "scrollHeight", { value: 180, configurable: true })

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "スクロールなし")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => expect(scrollTopSetter).toHaveBeenCalledWith(180))
  })

  it("keeps quick options and voice input controls available during the flow", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "opt-1",
      reply: "選択肢を受け取りました",
      question: "",
      options: [],
      allow_free_text: true,
      step: 2,
      done: false,
    })

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.click(screen.getByRole("button", { name: "売上が不安" }))
    await waitFor(() => expect(mockedGuidedChatTurn).toHaveBeenCalled())
    expect(screen.getByTestId("voice-toggle")).toBeInTheDocument()
  })

  it("shows fallback message when the chat API fails", async () => {
    mockedGuidedChatTurn.mockRejectedValue(new ApiError(LLM_FALLBACK_MESSAGE))

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "失敗パス")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => {
      expect(screen.getByText(LLM_FALLBACK_MESSAGE)).toBeInTheDocument()
    })
    expect(screen.queryByRole("button", { name: /ToDoを作成する/ })).toBeNull()
  })
})
