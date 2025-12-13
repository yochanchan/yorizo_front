import { render, screen } from "@testing-library/react"

import ChatHistoryPage from "@/app/(yorizo)/memory/history/page"
import { getConversations } from "@/lib/api"

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    getConversations: jest.fn(),
  }
})

describe("ChatHistoryPage", () => {
  it("renders items that open the chat conversation", async () => {
    ;(getConversations as jest.Mock).mockResolvedValue([
      { id: "c1", title: "前回の相談", date: "2024-01-01" },
      { id: "c2", title: "資金繰りの悩み", date: "2024-01-02" },
    ])

    const view = await ChatHistoryPage()
    render(view)

    expect(screen.getByText("チャット履歴")).toBeInTheDocument()
    expect(screen.getByText("これまで乗り越えてきたことも思い出されますね")).toBeInTheDocument()

    expect(screen.getByRole("link", { name: "前回の相談 を開く" })).toHaveAttribute("href", "/chat?conversationId=c1")
    expect(screen.getByText("2024/01/01")).toBeInTheDocument()

    expect(screen.getByRole("link", { name: "資金繰りの悩み を開く" })).toHaveAttribute("href", "/chat?conversationId=c2")
    expect(screen.getByText("2024/01/02")).toBeInTheDocument()
  })
})

