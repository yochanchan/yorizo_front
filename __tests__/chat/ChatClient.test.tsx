import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import ChatClient from "@/app/(yorizo)/chat/ChatClient"
import { ApiError, LLM_FALLBACK_MESSAGE, guidedChatTurn } from "@/lib/api"

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

beforeAll(() => {
  if (!(global as any).crypto) {
    ;(global as any).crypto = require("crypto").webcrypto
  }
  if (!(global as any).crypto.randomUUID) {
    ;(global as any).crypto.randomUUID = () => "test-uuid"
  }
})

describe("ChatClient", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("sends a message and renders assistant reply", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "c1",
      reply: "こんにちは、どんな状況ですか？",
      question: "次に気になっていることを教えてください。",
      options: [],
      cta_buttons: [],
      allow_free_text: true,
      step: 2,
      done: false,
    })

    const user = userEvent.setup()
    render(<ChatClient topic="sales" initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "テストです")
    await user.click(screen.getByRole("button", { name: "送信" }))

    expect(await screen.findByText("テストです")).toBeInTheDocument()
    expect(await screen.findByText("こんにちは、どんな状況ですか？")).toBeInTheDocument()
    expect(screen.getByText("次に気になっていることを教えてください。")).toBeInTheDocument()
  })

  it("shows fallback message when the chat API fails", async () => {
    mockedGuidedChatTurn.mockRejectedValue(new ApiError(LLM_FALLBACK_MESSAGE))

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "失敗テスト")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => {
      expect(screen.getByText(LLM_FALLBACK_MESSAGE)).toBeInTheDocument()
    })
  })
})
