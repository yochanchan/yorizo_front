import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import ChatClient from "@/app/(yorizo)/chat/ChatClient"
import { useChatSpeechRecognition } from "@/components/voice/useChatSpeechRecognition"
import { ApiError, LLM_FALLBACK_MESSAGE, getConversationDetail, guidedChatTurn } from "@/lib/api"

const pushMock = jest.fn()
const replaceMock = jest.fn()

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    guidedChatTurn: jest.fn(),
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

type VoiceState = {
  status: "idle" | "recording" | "transcribing"
  error: string | null
  elapsed: number
  start: jest.Mock
  stop: jest.Mock
}

let voiceState: VoiceState = {
  status: "idle",
  error: null,
  elapsed: 0,
  start: jest.fn(),
  stop: jest.fn(),
}

let latestTranscriptHandler: ((text: string) => void) | null = null

jest.mock("@/components/voice/useChatSpeechRecognition", () => ({
  useChatSpeechRecognition: jest.fn((options: { onTranscript: (text: string) => void }) => {
    latestTranscriptHandler = options?.onTranscript
    return voiceState
  }),
}))

const mockedGuidedChatTurn = guidedChatTurn as jest.MockedFunction<typeof guidedChatTurn>
const mockedGetConversationDetail = getConversationDetail as jest.MockedFunction<typeof getConversationDetail>
const mockedUseChatSpeechRecognition = useChatSpeechRecognition as jest.MockedFunction<
  typeof useChatSpeechRecognition
>

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
    voiceState = {
      status: "idle",
      error: null,
      elapsed: 0,
      start: jest.fn(),
      stop: jest.fn(),
    }
    latestTranscriptHandler = null
    mockedUseChatSpeechRecognition.mockImplementation((options: { onTranscript: (text: string) => void }) => {
      latestTranscriptHandler = options?.onTranscript
      return voiceState
    })
  })

  it("shows the consultation memo CTA after the first user answer and enables it once conversationId is set", async () => {
    let resolveTurn: (value: any) => void = () => {}
    const turnPromise = new Promise<any>((resolve) => {
      resolveTurn = resolve
    })
    mockedGuidedChatTurn.mockReturnValueOnce(turnPromise as any)

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    expect(screen.queryByTestId("chat-open-memo")).toBeNull()

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "入力テキスト")
    await user.click(screen.getByRole("button", { name: "送信" }))

    const memoButton = await screen.findByTestId("chat-open-memo")
    expect(memoButton).toBeDisabled()

    resolveTurn({
      conversation_id: "c1",
      reply: "返答です",
      question: "",
      options: [],
      allow_free_text: true,
      step: 1,
      done: false,
    })

    await waitFor(() => expect(screen.getByTestId("chat-open-memo")).toBeEnabled())

    await user.click(screen.getByTestId("chat-open-memo"))
    expect(pushMock).toHaveBeenCalledWith("/memory/c1/memo")
  })

  it("keeps input UI visible and allows sending even when done is true", async () => {
    mockedGuidedChatTurn
      .mockResolvedValueOnce({
        conversation_id: "done-1",
        reply: "完了しました",
        question: "",
        options: [],
        allow_free_text: false,
        step: 5,
        done: true,
      })
      .mockResolvedValueOnce({
        conversation_id: "done-1",
        reply: "続きです",
        question: "",
        options: [],
        allow_free_text: true,
        step: 5,
        done: true,
      })

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "終わり")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => expect(screen.getByText("完了しました")).toBeInTheDocument())

    const input = screen.getByTestId("chat-input") as HTMLTextAreaElement
    expect(input).toBeInTheDocument()
    expect(input).not.toBeDisabled()
    expect(screen.getByTestId("chat-mic")).toBeInTheDocument()

    await user.type(input, " 続き")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => expect(mockedGuidedChatTurn).toHaveBeenCalledTimes(2))
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
        "気になるテーマを選んでください。どれも当てはまらなければ「その他」を選んでください。",
      ),
    ).toBeInTheDocument()
    expect(screen.queryByTestId("chat-open-memo")).toBeNull()
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

  it("keeps quick options and mic available even when allow_free_text is false", async () => {
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

    await user.click(screen.getAllByTestId("chat-quick-option")[0])
    await waitFor(() => expect(mockedGuidedChatTurn).toHaveBeenCalled())
    expect(screen.getByTestId("chat-mic")).toBeInTheDocument()
    expect(screen.getByTestId("chat-input")).not.toBeDisabled()
  })

  it("shows transcribing overlay with the fixed text", () => {
    voiceState = { ...voiceState, status: "transcribing" }
    render(<ChatClient initialConversationId={null} />)

    expect(screen.getByTestId("chat-voice-overlay")).toBeInTheDocument()
    expect(screen.getByText("文字起こし中…")).toBeInTheDocument()
    expect(screen.getByTestId("chat-send")).toBeDisabled()
    expect(screen.getByTestId("chat-input")).toBeDisabled()
  })

  it("shows recording overlay with timer and stop button", async () => {
    const stopMock = jest.fn()
    voiceState = { ...voiceState, status: "recording", elapsed: 12, stop: stopMock }
    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    expect(screen.getByTestId("chat-voice-overlay")).toBeInTheDocument()
    expect(screen.getByText("00:12")).toBeInTheDocument()

    await user.click(screen.getByTestId("chat-voice-stop"))
    expect(stopMock).toHaveBeenCalled()
  })

  it("appends transcripts with a single space and avoids leading spaces", async () => {
    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    const input = screen.getByTestId("chat-input") as HTMLTextAreaElement
    expect(latestTranscriptHandler).toBeTruthy()

    act(() => {
      latestTranscriptHandler?.("音声テキスト")
    })
    expect(input.value).toBe("音声テキスト")

    await user.clear(input)
    await user.type(input, "行1\n\n")
    act(() => {
      latestTranscriptHandler?.("音声テキスト")
    })

    expect(input.value).toBe("行1 音声テキスト")
  })

  it("disables chat inputs when voice input is busy and re-enables when idle", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ChatClient initialConversationId={null} />)

    const input = screen.getByTestId("chat-input") as HTMLTextAreaElement
    const sendButton = screen.getByTestId("chat-send")
    const quickOption = screen.getAllByTestId("chat-quick-option")[0]
    const micButton = screen.getByTestId("chat-mic")

    await user.type(input, "入力中")

    expect(sendButton).toBeEnabled()
    expect(quickOption).toBeEnabled()
    expect(input).not.toBeDisabled()
    expect(micButton).toBeEnabled()

    voiceState = { ...voiceState, status: "recording" }
    rerender(<ChatClient initialConversationId={null} />)

    expect(screen.getByTestId("chat-send")).toBeDisabled()
    expect(screen.getAllByTestId("chat-quick-option")[0]).toBeDisabled()
    expect(screen.getByTestId("chat-input")).toBeDisabled()
    expect(screen.getByTestId("chat-mic")).toBeDisabled()

    voiceState = { ...voiceState, status: "idle" }
    rerender(<ChatClient initialConversationId={null} />)

    expect(screen.getByTestId("chat-send")).toBeEnabled()
    expect(screen.getAllByTestId("chat-quick-option")[0]).toBeEnabled()
    expect(screen.getByTestId("chat-input")).not.toBeDisabled()
    expect(screen.getByTestId("chat-mic")).toBeEnabled()
  })

  it("shows fallback message when the chat API fails", async () => {
    mockedGuidedChatTurn
      .mockRejectedValueOnce(new ApiError(LLM_FALLBACK_MESSAGE))
      .mockResolvedValueOnce({
        conversation_id: "recovered-1",
        reply: "復帰しました",
        question: "",
        options: [],
        allow_free_text: true,
        step: 1,
        done: false,
      })

    const user = userEvent.setup()
    render(<ChatClient initialConversationId={null} />)

    await user.type(screen.getByPlaceholderText("ご相談内容を入力してください"), "エラーのはず")
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => {
      expect(screen.getByText(LLM_FALLBACK_MESSAGE)).toBeInTheDocument()
    })

    expect(screen.queryByTestId("chat-error")).toBeNull()
    expect(screen.getAllByTestId("chat-quick-option")[0]).toBeEnabled()

    await user.type(screen.getByTestId("chat-input"), "もう一度")
    expect(screen.getByTestId("chat-send")).toBeEnabled()
    await user.click(screen.getByRole("button", { name: "送信" }))

    await waitFor(() => {
      expect(screen.getByText("復帰しました")).toBeInTheDocument()
    })
  })
})
