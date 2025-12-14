import { render, screen } from "@testing-library/react"

import AppointPage from "@/app/(yorizo)/appoint/page"
import { getConsultations, listConsultationMemos } from "@/lib/api"

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    getConsultations: jest.fn(),
    listConsultationMemos: jest.fn(),
  }
})

describe("AppointPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders CTA, bookings, and memo history with memory link when 5+ memos", async () => {
    ;(getConsultations as jest.Mock).mockResolvedValue([
      {
        id: "b1",
        date: "2025-01-02",
        time_slot: "09:00-10:00",
        channel: "online",
        status: "pending",
        expert_name: "Expert A",
      },
      {
        id: "b2",
        date: "2025-01-03",
        time_slot: "10:00-11:00",
        channel: "in-person",
        status: "confirmed",
        expert_name: "Expert B",
      },
    ])
    ;(listConsultationMemos as jest.Mock).mockResolvedValue([
      {
        conversation_id: "c1",
        created_at: "2025-02-01T00:00:00Z",
        current_point_preview: "current 1",
        important_point_preview: "important 1",
      },
      {
        conversation_id: "c2",
        created_at: "2025-01-30T00:00:00Z",
        current_point_preview: "current 2",
        important_point_preview: "important 2",
      },
      {
        conversation_id: "c3",
        created_at: "2025-01-29T00:00:00Z",
        current_point_preview: "current 3",
        important_point_preview: "important 3",
      },
      {
        conversation_id: "c4",
        created_at: "2025-01-28T00:00:00Z",
        current_point_preview: "current 4",
        important_point_preview: "important 4",
      },
      {
        conversation_id: "c5",
        created_at: "2025-01-27T00:00:00Z",
        current_point_preview: "current 5",
        important_point_preview: "important 5",
      },
    ])

    const view = await AppointPage()
    render(view)

    expect(screen.getByTestId("appoint-hero")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "相談予約をする" })).toHaveAttribute("href", "/yorozu")

    const bookingRows = screen.getAllByTestId("booking-row")
    expect(bookingRows).toHaveLength(2)
    expect(screen.getByText("2025/01/02 09:00-10:00")).toBeInTheDocument()
    expect(screen.getByText("2025/01/03 10:00-11:00")).toBeInTheDocument()
    expect(screen.getByText("オンライン | Expert A")).toBeInTheDocument()
    expect(screen.getByText("対面 | Expert B")).toBeInTheDocument()
    expect(screen.getByText("受付待ち")).toBeInTheDocument()
    expect(screen.getByText("確定")).toBeInTheDocument()

    const memoRows = screen.getAllByTestId("memo-row")
    expect(memoRows).toHaveLength(4)
    expect(screen.queryByText("current 5")).not.toBeInTheDocument()

    const memoryLink = screen.getByTestId("appoint-memory-link")
    expect(memoryLink).toHaveAttribute("href", "/memory")
  })

  it("hides memory link when fewer than 5 memos", async () => {
    ;(getConsultations as jest.Mock).mockResolvedValue([])
    ;(listConsultationMemos as jest.Mock).mockResolvedValue([
      {
        conversation_id: "c1",
        created_at: "2025-02-01T00:00:00Z",
        current_point_preview: "only current",
        important_point_preview: "only important",
      },
    ])

    const view = await AppointPage()
    render(view)

    expect(screen.queryByTestId("appoint-memory-link")).not.toBeInTheDocument()
    expect(screen.getAllByTestId("memo-row")).toHaveLength(1)
  })
})
