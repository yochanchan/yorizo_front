import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import ConfirmPage from "@/app/(yorizo)/yorozu/experts/[id]/confirm/page"
import { ApiError, createConsultationBooking, getConversations, getExperts } from "@/lib/api"

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    createConsultationBooking: jest.fn(),
    getExperts: jest.fn(),
    getConversations: jest.fn(),
  }
})

const replaceMock = jest.fn()
const backMock = jest.fn()

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "expert-1" }),
  useRouter: () => ({
    push: jest.fn(),
    replace: replaceMock,
    refresh: jest.fn(),
    back: backMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => {
      const params: Record<string, string> = {
        date: "2025-01-05",
        time: "10:00-11:00",
        channel: "online",
      }
      return params[key] ?? null
    },
  }),
}))

const expert = {
  id: "expert-1",
  name: "テスト専門家",
  title: "中小企業診断士",
  organization: "テスト機関",
  tags: [],
  rating: 4.8,
  review_count: 10,
}

describe("ConfirmPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getExperts as jest.Mock).mockResolvedValue([expert])
    ;(getConversations as jest.Mock).mockResolvedValue([])
  })

  it("prefills contact fields and allows editing", async () => {
    render(<ConfirmPage />)

    const nameInput = await screen.findByLabelText("お名前")
    expect(nameInput).toHaveValue("ARIMAX")

    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, "Edited User")
    expect(nameInput).toHaveValue("Edited User")

    const phoneInput = screen.getByLabelText("電話番号")
    expect(phoneInput).toHaveValue("090-9999-9999")
    await userEvent.clear(phoneInput)
    await userEvent.type(phoneInput, "080-1111-2222")
    expect(phoneInput).toHaveValue("080-1111-2222")
  })

  it("opens and closes the privacy policy modal", async () => {
    render(<ConfirmPage />)

    const policyButton = await screen.findByRole("button", { name: /個人情報・プライバシーポリシー/i })
    await userEvent.click(policyButton)

    expect(screen.getByText("入力いただいた情報は相談対応のみに利用します。")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "閉じる" }))
    await waitFor(() =>
      expect(screen.queryByText("入力いただいた情報は相談対応のみに利用します。")).not.toBeInTheDocument(),
    )
  })

  it("submits successfully and redirects to /appoint", async () => {
    ;(createConsultationBooking as jest.Mock).mockResolvedValue({})
    render(<ConfirmPage />)

    await userEvent.click(screen.getByRole("button", { name: "この内容で予約する" }))

    await waitFor(() => expect(createConsultationBooking).toHaveBeenCalled())
    expect(replaceMock).toHaveBeenCalledWith("/appoint")
  })

  it("shows 409 error and guidance to reselect schedule", async () => {
    ;(createConsultationBooking as jest.Mock).mockRejectedValue(new ApiError("conflict", 409))
    render(<ConfirmPage />)

    await userEvent.click(screen.getByRole("button", { name: "この内容で予約する" }))

    await waitFor(() =>
      expect(screen.getByText("この時間枠は既に予約されています。別の枠を選んでください")).toBeInTheDocument(),
    )
    expect(backMock).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "日程を選び直す" })).toBeInTheDocument()
  })
})
