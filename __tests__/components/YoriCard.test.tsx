import { render, screen } from "@testing-library/react"

import { YoriCard } from "@/components/YoriCard"

jest.mock("next/link", () => {
  function MockLink({ children, href, ...rest }: any) {
    return (
      <a href={href as string} {...rest}>
        {children}
      </a>
    )
  }
  return MockLink
})

describe("YoriCard", () => {
  it("renders a primary link with arrow and without description", () => {
    render(<YoriCard variant="primaryLink" title="チャットを始める" description="ignore me" href="/chat" />)

    expect(screen.getByRole("link", { name: "チャットを始める" })).toHaveAttribute("href", "/chat")
    expect(screen.queryByText("ignore me")).not.toBeInTheDocument()
    expect(screen.getByTestId("yori-card-arrow")).toBeInTheDocument()
  })

  it("renders a secondary link with description and arrow", () => {
    render(
      <YoriCard
        variant="link"
        title="イマココレポートを見る"
        description="診断をまとめて確認"
        href="/report"
      />,
    )

    expect(screen.getByRole("link", { name: /イマココレポートを見る/ })).toHaveAttribute("href", "/report")
    expect(screen.getByText("診断をまとめて確認")).toBeInTheDocument()
    expect(screen.getByTestId("yori-card-arrow")).toBeInTheDocument()
  })

  it("renders info card without arrow", () => {
    render(<YoriCard variant="info" title="メモ" description="説明だけのカード" />)

    expect(screen.getByText("メモ")).toBeInTheDocument()
    expect(screen.queryByTestId("yori-card-arrow")).not.toBeInTheDocument()
  })

  it("marks required choice as selected", () => {
    render(<YoriCard variant="choiceRequired" title="選択肢A" selected onClick={() => {}} />)

    const button = screen.getByRole("button", { name: "選択肢A" })
    expect(button).toHaveAttribute("data-selected", "true")
    expect(button.className).toContain("border-[var(--yori-primary)]")
  })

  it("renders optional choice state", () => {
    render(<YoriCard variant="choiceOptional" title="タグA" onClick={() => {}} />)

    const button = screen.getByRole("button", { name: "タグA" })
    expect(button).toHaveAttribute("data-variant", "choiceOptional")
    expect(button.className).toContain("border-dashed")
  })
})
