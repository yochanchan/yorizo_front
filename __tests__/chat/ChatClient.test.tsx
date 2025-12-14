import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import ChatClient from "@/app/(yorizo)/chat/ChatClient"
import { ApiError, LLM_FALLBACK_MESSAGE, getConversationDetail, guidedChatTurn } from "@/lib/api"

const pushMock = jest.fn()
const replaceMock = jest.fn()

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
    push: pushMock,
    replace: replaceMock,
    refresh: jest.fn(),
    back: jest.fn(),
  }),
}))

jest.mock("@/components/voice/ChatSpeechInput", () => ({
  ChatSpeechInput: ({
    onTranscript,
    disabled,
    onStatusChange,
  }: {
    onTranscript: (text: string) => void
    onStatusChange?: (s: "idle" | "recording" | "transcribing") => void
    disabled?: boolean
  }) => (
    <div data-testid="chat-speech-input">
      <button
        type="button"
        data-testid="mock-speech-button"
        disabled={disabled}
        onClick={() => onTranscript("音声テキスト")}
      >
        mock speech
      </button>
      <button type="button" data-testid="mock-status-recording" onClick={() => onStatusChange?.("recording")}>
        recording
      </button>
      <button type="button" data-testid="mock-status-transcribing" onClick={() => onStatusChange?.("transcribing")}>
        transcribing
      </button>
      <button type="button" data-testid="mock-status-idle" onClick={() => onStatusChange?.("idle")}>
        idle
      </button>
    </div>
  ),
}))

const mockedGuidedChatTurn = guidedChatTurn as jest.MockedFunction<typeof guidedChatTurn>
const mockedGetConversationDetail = getConversationDetail as jest.MockedFunction<typeof getConversationDetail>

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
    pushMock.mockReset()
    replaceMock.mockReset()
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

  it("shows progress updates and clamps to 5/5", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "c1",
      reply: "返答です",
      question: "",
      options: [],
      allow_free_text: true,
      step: 6,
      done: false,
    })

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    expect(screen.getByTestId("chat-step-indicator")).toHaveTextContent("ステップ 0 / 5")

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "入力テキスト")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => expect(screen.getByTestId("chat-step-indicator")).toHaveTextContent("ステップ 5 / 5"))
    expect(screen.getByText("返答です")).toBeInTheDocument()
  })

  it("hides input UI and shows the consultation memo card when done", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "done-1",
      reply: "完了しました",
      question: "",
      options: [],
      allow_free_text: false,
      step: 5,
      done: true,
    })

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "終わり")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => expect(screen.getByText("相談メモをまとめました")).toBeInTheDocument())
    const memoButton = screen.getByRole("button", { name: "相談メモを開く" })

    await user.click(memoButton)
    expect(pushMock).toHaveBeenCalledWith("/memory/done-1/memo")
    expect(screen.queryByPlaceholderText("ご相談内容を入力してください")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chat-speech-input")).not.toBeInTheDocument()
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
          content: JSON.stringify({ reply: "過去の返答", allow_free_text: true, done: false, step: 3 }),
          created_at: "",
        },
      ],
    })

    render(<ChatClient initialConversationId="old-1" />)

    await waitFor(() => expect(screen.getByText("過去の返答")).toBeInTheDocument())
    expect(
      screen.getByText(
        "まず、気になっているテーマを1つ選んでください。どれもピンとこなければ「その他」を選んでください。",
      ),
    ).toBeInTheDocument()
    expect(screen.getByTestId("chat-step-indicator")).toHaveTextContent("ステップ 3 / 5")
  })

  it("scrolls window to the bottom with smooth behavior when new messages arrive", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "scroll-1",
      reply: "スクロールしてください",
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
      reply: "スクロール top",
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

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "スクロール top")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => expect(scrollTopSetter).toHaveBeenCalledWith(180))
  })

  it("keeps quick options and speech input available even when allow_free_text is false", async () => {
    mockedGuidedChatTurn.mockResolvedValue({
      conversation_id: "opt-1",
      reply: "選択肢を選びました",
      question: "",
      options: [],
      allow_free_text: false,
      step: 2,
      done: false,
    })

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.click(screen.getByRole("button", { name: "売上が不安" }))
    await waitFor(() => expect(mockedGuidedChatTurn).toHaveBeenCalled())
    expect(screen.getByTestId("chat-speech-input")).toBeInTheDocument()
    expect(screen.getByTestId("chat-input")).not.toBeDisabled()
  })

  it("appends transcripts with a single space and avoids leading spaces", async () => {
    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    const input = screen.getByTestId("chat-input") as HTMLTextAreaElement
    const speechButton = screen.getByTestId("mock-speech-button")

    await user.click(speechButton)
    expect(input.value).toBe("音声テキスト")

    await user.clear(input)
    await user.type(input, "行1\n\n")
    await user.click(speechButton)

    expect(input.value).toBe("行1 音声テキスト")
  })

  it("disables chat inputs when voice input is busy and re-enables when idle", async () => {
    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    const input = screen.getByTestId("chat-input") as HTMLTextAreaElement
    const sendButton = screen.getByTestId("chat-send")
    const attachButton = screen.getByTestId("chat-attach")
    const quickOption = screen.getAllByTestId("chat-quick-option")[0]

    await user.type(input, "入力中")

    expect(sendButton).toBeEnabled()
    expect(attachButton).toBeEnabled()
    expect(quickOption).toBeEnabled()
    expect(input).not.toBeDisabled()

    await user.click(screen.getByTestId("mock-status-recording"))

    await waitFor(() => {
      expect(sendButton).toBeDisabled()
      expect(attachButton).toBeDisabled()
      expect(quickOption).toBeDisabled()
      expect(input).toBeDisabled()
    })

    await user.click(screen.getByTestId("mock-status-idle"))

    await waitFor(() => {
      expect(sendButton).toBeEnabled()
      expect(attachButton).toBeEnabled()
      expect(quickOption).toBeEnabled()
      expect(input).not.toBeDisabled()
    })
  })

  it("shows fallback message when the chat API fails", async () => {
    mockedGuidedChatTurn.mockRejectedValue(new ApiError(LLM_FALLBACK_MESSAGE))

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "エラーのはず")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => {
      expect(screen.getByText(LLM_FALLBACK_MESSAGE)).toBeInTheDocument()
    })
    expect(screen.queryByRole("button", { name: /ToDo/ })).toBeNull()
  })
})
