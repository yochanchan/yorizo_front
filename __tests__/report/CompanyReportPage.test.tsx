import { act } from "react-dom/test-utils"
import { render, screen, waitFor } from "@testing-library/react"

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
  }),
}))

const mockReport: CompanyReport = {
  company: { id: "1", name: "Sample Company" },
  radar: { axes: ["売上持続性"], periods: [{ label: "最新", scores: [3], raw_values: [100] }] },
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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders main action cards and fetches report", async () => {
    ;(getCompanyReport as jest.Mock).mockResolvedValue(mockReport)
    render(<CompanyReportPage />)

    await waitFor(() => expect(getCompanyReport).toHaveBeenCalled())

    expect(screen.getByText("イマココレポート")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "チャットを再開" })).toHaveAttribute("href", "/chat")
    expect(screen.getByRole("link", { name: /ToDoを確認/ })).toHaveAttribute("href", "/homework")
    expect(screen.getByRole("link", { name: "専門家に相談" })).toHaveAttribute("href", "/yorozu")
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
