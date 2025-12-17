import { act } from "react-dom/test-utils"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import CompanyReportPage from "@/app/(yorizo)/components/report/CompanyReportPage"
import { getCompanyReport, type CompanyReport } from "@/lib/api"

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    getCompanyReport: jest.fn(),
  }
})

jest.mock("@/lib/hooks/useCompanyProfile", () => ({
  useCompanyProfile: () => ({ data: null, isLoading: false }),
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}))

const mockReport: CompanyReport = {
  company: { id: "1", name: "Sample Company" },
  radar: {
    axes: ["売上持続性"],
    periods: [
      { label: "最新", scores: [3], raw_values: [100] },
      { label: "前期", scores: [2], raw_values: [90] },
      { label: "前々期", scores: [1], raw_values: [80] },
    ],
  },
  qualitative: { keieisha: {}, jigyo: {}, kankyo: {}, naibu: {} },
  current_state: "現状メモ",
  future_goal: "",
  action_plan: "",
  snapshot_strengths: [],
  snapshot_weaknesses: [],
  desired_image: "",
  gap_summary: "",
  thinking_questions: [],
}

describe("CompanyReportPage", () => {
  beforeAll(() => {
    // Recharts depends on ResizeObserver; stub it for jsdom.
    // @ts-expect-error jsdom missing ResizeObserver
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders main action cards and fetches report", async () => {
    ;(getCompanyReport as jest.Mock).mockResolvedValue(mockReport)
    const user = userEvent.setup()
    render(<CompanyReportPage />)

    await waitFor(() => expect(getCompanyReport).toHaveBeenCalled())

    expect(screen.getByText("イマココレポート")).toBeInTheDocument()
    expect(
      screen.getByText(
        "決算情報やチャットの内容などから、「いまの会社のバランス」と「気になるポイント」をまとめました。",
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText("チャット・ToDo・PDFをまとめて“いま”を俯瞰します。次の一歩もここから。"),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        "直近の決算やお話の内容から、「いまの会社のバランス」と「気になるポイント」をわかりやすく整理しました。まずは全体のイメージをつかんでみてください。",
      ),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "戻る" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "レポートを更新" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "よろず支援拠点に相談する" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "もう一度タイプ診断する" })).not.toBeInTheDocument()

    const balanceHeading = screen.getByRole("heading", { name: "経営バランス診断" })
    const balanceSection = balanceHeading.closest("section")
    expect(balanceSection).not.toBeNull()
    if (balanceSection) {
      expect(within(balanceSection).getByText("現状メモ")).toBeInTheDocument()
      expect(within(balanceSection).queryByRole("button", { name: /もっと見る|閉じる/ })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole("button", { name: /もっと見る/ })).not.toBeInTheDocument()

    expect(screen.getByText("最新決算期")).toBeInTheDocument()
    expect(screen.getByText("前期決算期")).toBeInTheDocument()
    expect(screen.queryByText("前々期決算期")).not.toBeInTheDocument()
    expect(screen.queryByText("前々期")).not.toBeInTheDocument()

    const kpiGuideButton = screen.getByRole("button", { name: "指標の見方" })
    expect(kpiGuideButton).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("heading", { name: "収益性" })).not.toBeInTheDocument()

    await user.click(kpiGuideButton)

    expect(kpiGuideButton).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("heading", { name: "収益性" })).toBeInTheDocument()
    expect(screen.getByText("営業利益率")).toBeInTheDocument()
    expect(screen.getByText("営業利益 ÷ 売上高")).toBeInTheDocument()
  })

  it("shows the thinking row during report loading", async () => {
    let resolveReport: ((value: CompanyReport) => void) | null = null
    ;(getCompanyReport as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReport = resolve
        }),
    )

    render(<CompanyReportPage />)

    const thinkingRow = await screen.findByRole("status", { name: /レポートを生成中です/ })
    const image = thinkingRow.querySelector('img[aria-hidden="true"]')
    expect(image).toBeTruthy()

    await act(async () => {
      resolveReport?.(mockReport)
    })
  })
})
