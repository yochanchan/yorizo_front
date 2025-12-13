import { render, screen } from "@testing-library/react"

import MemoryPage from "@/app/(yorizo)/memory/page"
import { getCompanyProfile, getConversations, listDocuments, listHomework } from "@/lib/api"

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    getConversations: jest.fn(),
    listHomework: jest.fn(),
    listDocuments: jest.fn(),
    getCompanyProfile: jest.fn(),
  }
})

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
}))

describe("MemoryPage", () => {
  it("renders navigation cards for chat, homework, report, and memo", async () => {
    ;(getConversations as jest.Mock).mockResolvedValue([
      { id: "c1", title: "相談のタイトル", date: "2024-01-01" },
    ])
    ;(listHomework as jest.Mock).mockResolvedValue([])
    ;(listDocuments as jest.Mock).mockResolvedValue([])
    ;(getCompanyProfile as jest.Mock).mockResolvedValue(null)

    const view = await MemoryPage()
    render(view)

    expect(screen.getByRole("link", { name: "チャットを再開する" })).toHaveAttribute("href", "/chat")
    expect(screen.getByRole("link", { name: /ToDoを確認/ })).toHaveAttribute("href", "/homework")
    expect(screen.getByRole("link", { name: /イマココレポート/ })).toHaveAttribute("href", "/report")
    expect(screen.getByRole("link", { name: "相談メモを見る" })).toHaveAttribute("href", "/memory/c1/memo")
  })
})
