import { render, screen } from "@testing-library/react"

import { BottomNav } from "@/components/BottomNav"

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

describe("BottomNav", () => {
  it("renders 4 tabs for main routes", () => {
    render(<BottomNav />)

    expect(screen.getByText("ホーム")).toBeInTheDocument()
    expect(screen.getByText("チャット")).toBeInTheDocument()
    expect(screen.getByText("イマココ")).toBeInTheDocument()
    expect(screen.getByText("相談予約")).toBeInTheDocument()
    expect(screen.getByLabelText("相談予約")).toHaveAttribute("href", "/appoint")
  })
})
