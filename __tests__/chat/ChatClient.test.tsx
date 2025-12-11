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

  it("shows thinking row with spinner and mascot while waiting for a reply", async () => {
    let resolveTurn: ((value: any) => void) | null = null
    mockedGuidedChatTurn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveTurn = resolve
        }),
    )

    const user = userEvent.setup()
    render(<ChatClient topic="sales" initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "進行テスト")
    await user.click(screen.getByRole("button", { name: "送信" }))

    const thinkingRow = await screen.findByRole("status", { name: /yorizoが考えています/ })
    const image = thinkingRow.querySelector('img[aria-hidden="true"]')
    expect(image).toBeTruthy()
    const spinnerClass = thinkingRow.querySelector("svg")?.getAttribute("class") ?? ""
    expect(spinnerClass).toContain("animate-spin")

    resolveTurn?.({
      conversation_id: "c-thinking",
      reply: "このあと改善案をまとめます。",
      question: "",
      options: [],
      allow_free_text: true,
      step: 2,
      done: false,
    })

    await waitFor(() => expect(screen.getByText("このあと改善案をまとめます。")).toBeInTheDocument())
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

    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "cta-1",
      reply: "CTA is kept in the API response only.",
      question: "What would you like to do next?",
      options: [],
      allow_free_text: true,
      step: 2,
      done: false,
    })

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "CTA check")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => {
      expect(screen.getByText("CTA is kept in the API response only.")).toBeInTheDocument()
    })
    expect(screen.queryByRole("button", { name: /宿題を作成する/ })).toBeNull()
  })
})
