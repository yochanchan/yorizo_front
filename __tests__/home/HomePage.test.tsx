import { render, screen } from "@testing-library/react"

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
  it("renders main navigation cards", async () => {
    ;(getConversations as jest.Mock).mockResolvedValue([{ id: "conv-1", title: "最新相談", date: "2024-01-01" }])

    const view = await HomePage()
    render(view)

    expect(screen.getByRole("link", { name: "チャットを始める" })).toHaveAttribute("href", "/chat?reset=true")
    expect(screen.getByRole("link", { name: "かんたんチェックをはじめる" })).toHaveAttribute("href", "/wizard")
    expect(screen.getByRole("link", { name: /イマココレポートを見る/ })).toHaveAttribute("href", "/report")
    expect(screen.getByRole("link", { name: /相談メモを開く/ }).getAttribute("href")).toContain("/report/conv-1")
  })
})
