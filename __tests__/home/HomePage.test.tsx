import { fireEvent, render, screen } from "@testing-library/react"

import HomePage from "@/app/(yorizo)/page"
import { getConversations } from "@/lib/api"

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    getConversations: jest.fn(),
  }
})

describe("HomePage", () => {
  it("renders main links and cards with latest conversation", async () => {
    ;(getConversations as jest.Mock).mockResolvedValue([{ id: "conv-1", title: "最新の相談", date: "2024-01-01" }])

    const view = await HomePage()
    render(view)

    expect(screen.getByRole("link", { name: "Yorizoとチャットで話す" })).toHaveAttribute("href", "/chat?reset=true")
    expect(screen.getByRole("link", { name: "過去の会話はこちら→" })).toHaveAttribute("href", "/memory/history")

    expect(screen.getByRole("link", { name: /ToDoを確認/ })).toHaveAttribute("href", "/homework")
    expect(screen.getByRole("link", { name: /イマココレポートを見る/ })).toHaveAttribute("href", "/report")
    expect(screen.getByRole("link", { name: /相談メモを開く/ })).toHaveAttribute("href", "/memory/conv-1/memo")
  })

  it("falls back to memory when no conversations exist", async () => {
    ;(getConversations as jest.Mock).mockResolvedValue([])

    const view = await HomePage()
    render(view)

    expect(screen.getByRole("link", { name: "過去の会話はこちら→" })).toHaveAttribute("href", "/memory/history")
    expect(screen.getByRole("link", { name: /相談メモを開く/ })).toHaveAttribute("href", "/memory")
  })

  it("keeps use-guide accordion closed by default and opens on click", async () => {
    ;(getConversations as jest.Mock).mockResolvedValue([])

    const view = await HomePage()
    const { container } = render(view)

    const accordionButton = screen.getByRole("button", { name: "Yorizoの使い方" })
    expect(accordionButton).toHaveAttribute("aria-expanded", "false")
    expect(container.querySelector("#use-guide-content")).toBeNull()

    fireEvent.click(accordionButton)

    expect(accordionButton).toHaveAttribute("aria-expanded", "true")
    expect(container.querySelector("#use-guide-content")).not.toBeNull()
    expect(screen.getAllByTestId("home-step-connector")).toHaveLength(2)
  })
})
