import { render, screen } from "@testing-library/react"

import AdminBookingsPage from "@/app/admin/bookings/page"
import { getAdminBookings, type AdminBooking } from "@/lib/api"

jest.mock("@/app/admin/bookings/BookingDashboard", () => ({
  BookingDashboard: ({ bookings }: { bookings: AdminBooking[] }) => (
    <div data-testid="booking-dashboard-count">{bookings.length}</div>
  ),
}))

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api")
  return {
    ...actual,
    getAdminBookings: jest.fn(),
  }
})

const mockedGetAdminBookings = getAdminBookings as jest.MockedFunction<typeof getAdminBookings>

describe("AdminBookingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders bookings when API succeeds", async () => {
    const booking: AdminBooking = {
      id: "b1",
      expert_id: "e1",
      channel: "online",
      status: "pending",
      date: "2024-01-01",
      time_slot: "10:00",
      name: "test user",
      created_at: "2024-01-01",
      expert_name: "expert",
      user_id: "u1",
      user_name: "user name",
      phone: "000-0000-0000",
      email: "test@example.com",
      note: null,
      meeting_url: null,
      line_contact: null,
      conversation_id: null,
    }

    mockedGetAdminBookings.mockResolvedValue([booking])

    const ui = await AdminBookingsPage()
    render(ui)

    expect(screen.getByTestId("booking-dashboard-count")).toHaveTextContent("1")
    // 一覧テーブル側も 1 件分の名前が描画されることを確認
    expect(screen.getByText("test user")).toBeInTheDocument()
  })

  it("shows fallback banner and empty state when API fails", async () => {
    mockedGetAdminBookings.mockRejectedValue(new Error("network error"))

    const ui = await AdminBookingsPage()
    render(ui)

    expect(
      screen.getByText("予紁E��報を取得できませんでした。時間をおいて再度アクセスしてください。"),
    ).toBeInTheDocument()
    expect(screen.getByTestId("booking-dashboard-count")).toHaveTextContent("0")
  })
})

