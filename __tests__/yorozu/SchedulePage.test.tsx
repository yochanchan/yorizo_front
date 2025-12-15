import { render, screen, waitFor } from "@testing-library/react"

import SchedulePage from "@/app/(yorizo)/yorozu/experts/[id]/schedule/page"
import { getExpertAvailability, getExperts } from "@/lib/api"

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    getExpertAvailability: jest.fn(),
    getExperts: jest.fn(),
  }
})

const pushMock = jest.fn()
const backMock = jest.fn()

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "expert-1" }),
  useRouter: () => ({
    push: pushMock,
    back: backMock,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}))

const availability = [
  {
    date: "2025-01-02",
    slots: ["10:00-11:00", "11:00-12:00", "14:00-15:00", "15:00-16:00"],
    booked_slots: ["10:00-11:00", "11:00-12:00", "14:00-15:00", "15:00-16:00"],
    available_count: 0,
  },
  {
    date: "2025-01-03",
    slots: ["10:00-11:00", "11:00-12:00", "14:00-15:00", "15:00-16:00"],
    booked_slots: ["11:00-12:00"],
    available_count: 3,
  },
]

const expert = {
  id: "expert-1",
  name: "テスト専門家",
  title: "中小企業診断士",
  organization: "テスト機関",
  tags: [],
  rating: 4.8,
  review_count: 10,
}

describe("SchedulePage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getExperts as jest.Mock).mockResolvedValue([expert])
    ;(getExpertAvailability as jest.Mock).mockResolvedValue(availability)
  })

  it("disables dates with no availability", async () => {
    render(<SchedulePage />)

    await waitFor(() => expect(screen.getByText("1/2")).toBeInTheDocument())

    const fullLabel = screen.getByText("満席")
    const fullDateButton = fullLabel.closest("button")
    expect(fullDateButton).toHaveAttribute("aria-disabled", "true")

    const availableDate = screen.getByText("1/3").closest("button")
    expect(availableDate).not.toHaveAttribute("aria-disabled", "true")
  })

  it("shows booked slots as disabled", async () => {
    render(<SchedulePage />)

    await waitFor(() => expect(screen.getByText("11:00-12:00")).toBeInTheDocument())
    const bookedLabel = screen.getByText("予約済み")
    const bookedButton = bookedLabel.closest("button")
    expect(bookedButton).toHaveAttribute("aria-disabled", "true")
  })

  it("renders new default slot and hides removed one", async () => {
    render(<SchedulePage />)

    await waitFor(() => expect(screen.getByText("15:00-16:00")).toBeInTheDocument())
    expect(screen.queryByText("16:00-17:00")).not.toBeInTheDocument()
  })
})
