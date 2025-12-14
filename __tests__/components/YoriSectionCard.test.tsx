import { render, screen } from "@testing-library/react"

import { YoriSectionCard } from "@/components/YoriSectionCard"

describe("YoriSectionCard", () => {
  it("renders title, description, children, and default tone class", () => {
    render(
      <YoriSectionCard title="セクションタイトル" description="説明文">
        <div>child content</div>
      </YoriSectionCard>,
    )

    const heading = screen.getByRole("heading", { name: "セクションタイトル" })
    expect(heading).toBeInTheDocument()
    expect(heading.closest("section")).toHaveClass("yori-card")
    expect(screen.getByText("説明文")).toBeInTheDocument()
    expect(screen.getByText("child content")).toBeInTheDocument()
  })

  it("applies muted tone when requested", () => {
    render(
      <YoriSectionCard tone="muted" title="Muted">
        muted body
      </YoriSectionCard>,
    )

    const mutedSection = screen.getByRole("heading", { name: "Muted" }).closest("section")
    expect(mutedSection).toHaveClass("yori-card-muted")
  })
})
