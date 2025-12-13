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
    ; (getConversations as jest.Mock).mockResolvedValue([{ id: "conv-1", title: "最新の相談", date: "2024-01-01" }])

    const view = await HomePage()
    render(view)

    expect(screen.getByText("今日はどんな気分？")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Yorizoとchatで話す" })).toHaveAttribute("href", "/chat?reset=true")
    expect(screen.getByRole("link", { name: "過去の会話はこちら→" }).getAttribute("href")).toContain("/report/conv-1")

    expect(screen.getByRole("link", { name: /To Doを確認/ })).toHaveAttribute("href", "/homework")
    expect(screen.getByRole("link", { name: /イマココレポートを見る/ })).toHaveAttribute("href", "/report")
    expect(screen.getByRole("link", { name: /相談メモを開く/ }).getAttribute("href")).toContain("/report/conv-1")
  })

  it("falls back to memory when no conversations exist", async () => {
    ; (getConversations as jest.Mock).mockResolvedValue([])

    const view = await HomePage()
    render(view)

    expect(screen.getByRole("link", { name: "過去の会話はこちら→" })).toHaveAttribute("href", "/memory")
    expect(screen.getByRole("link", { name: /相談メモを開く/ })).toHaveAttribute("href", "/memory")
  })

  it("keeps use-guide accordion closed by default and opens on click", async () => {
    ; (getConversations as jest.Mock).mockResolvedValue([])

    const view = await HomePage()
    render(view)

    const accordionButton = screen.getByRole("button", { name: "Yorizoの使い方" })
    expect(accordionButton).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText(/Yorizoと話して「いま」を見直し、次の一歩へ/)).not.toBeInTheDocument()

    fireEvent.click(accordionButton)

    expect(accordionButton).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Yorizoと話して「いま」を見直し、次の一歩へ")).toBeInTheDocument()
    expect(screen.getByText("Yorizoと話す")).toBeInTheDocument()
    expect(screen.getByText("イマココレポート")).toBeInTheDocument()
    expect(screen.getByText("相談メモ")).toBeInTheDocument()
    expect(screen.getAllByTestId("home-step-connector")).toHaveLength(2)
    expect(screen.getByText("3 ステップで頭と気持ちを整える")).toBeInTheDocument()
  })
})
