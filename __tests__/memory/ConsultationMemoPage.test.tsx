import { render, screen, waitFor } from "@testing-library/react"

import ConsultationMemoPage from "@/app/(yorizo)/memory/[conversationId]/memo/page"
import { getConsultationMemo, type ConsultationMemo } from "@/lib/api"

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    getConsultationMemo: jest.fn(),
  }
})

jest.mock("next/navigation", () => ({
  useParams: () => ({ conversationId: "conv-123" }),
}))

const mockedGetMemo = getConsultationMemo as jest.MockedFunction<typeof getConsultationMemo>

describe("ConsultationMemoPage", () => {
  it("shows thinking, renders memo with created_at, CTAs, and omits removed controls", async () => {
    let resolveMemo: (value: ConsultationMemo) => void = () => {}
    const memoPromise = new Promise<ConsultationMemo>((resolve) => {
      resolveMemo = resolve
    })
    mockedGetMemo.mockReturnValue(memoPromise)

    render(<ConsultationMemoPage />)

    expect(screen.getByText("相談メモ（作成日：--）")).toBeInTheDocument()
    expect(screen.getByTestId("memo-thinking")).toBeInTheDocument()
    expect(screen.getByText("相談メモを生成しています...")).toBeInTheDocument()

    resolveMemo({
      current_points: ["first point", "second point"],
      important_points: ["important detail"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    })

    await waitFor(() => expect(screen.getByText("相談メモ（作成日：2024/01/01）")).toBeInTheDocument())
    expect(screen.getByText("first point")).toBeInTheDocument()
    expect(screen.getByText("second point")).toBeInTheDocument()
    expect(screen.getByText("important detail")).toBeInTheDocument()

    expect(screen.getByRole("link", { name: /チャットに戻る（同一会話）/ })).toHaveAttribute(
      "href",
      "/chat?conversationId=conv-123",
    )
    expect(screen.getByRole("link", { name: "相談予約をする" })).toHaveAttribute(
      "href",
      "/yorozu?conversationId=conv-123",
    )
    expect(screen.getByRole("link", { name: /もう一度チャットで整理する/ })).toHaveAttribute(
      "href",
      "/chat?reset=true",
    )

    expect(screen.queryByText("コピー")).toBeNull()
    expect(screen.queryByText("最新取り込み")).toBeNull()
    expect(screen.queryByText(/更新日/)).toBeNull()
    expect(screen.queryByText(/相談予定日/)).toBeNull()
    expect(screen.queryByText(/感想/)).toBeNull()
  })
})
