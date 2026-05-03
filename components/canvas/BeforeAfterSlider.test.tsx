import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { BeforeAfterSlider } from "./BeforeAfterSlider"

describe("BeforeAfterSlider", () => {
  test("renders both original image and lego canvas", () => {
    const LegoCanvas = <div data-testid="lego-canvas">Lego</div>
    render(<BeforeAfterSlider originalSrc="test.jpg" legoCanvas={LegoCanvas} />)

    expect(screen.getByAltText("Original image")).toBeInTheDocument()
    expect(screen.getByTestId("lego-canvas")).toBeInTheDocument()
  })

  test("renders labels", () => {
    render(
      <BeforeAfterSlider originalSrc="test.jpg" legoCanvas={<div>Lego</div>} />
    )

    expect(screen.getByText("Original")).toBeInTheDocument()
    expect(screen.getByText("LEGO")).toBeInTheDocument()
  })
})
