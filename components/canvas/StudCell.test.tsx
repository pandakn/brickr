import type { LegoColor } from "@/types"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { StudCell } from "./StudCell"

describe("StudCell", () => {
  const mockColor: LegoColor = {
    id: "red",
    name: "Bright Red",
    hex: "#FF0000",
    lab: [0, 0, 0],
  }

  it("renders nothing visible when color is null", () => {
    const { container } = render(
      <StudCell color={null} size={20} renderMode="stud" animationDelay={0} />
    )
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true")
  })

  it("renders a colored button with aria-label", () => {
    render(
      <StudCell
        color={mockColor}
        size={20}
        renderMode="flat"
        animationDelay={0}
      />
    )
    const button = screen.getByRole("button", { name: "Bright Red" })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle({ backgroundColor: "#FF0000" })
  })

  it("renders a stud when renderMode is stud", () => {
    const { container } = render(
      <StudCell
        color={mockColor}
        size={20}
        renderMode="stud"
        animationDelay={0}
      />
    )
    // The stud is an aria-hidden div inside the button
    const stud = container.querySelector(".rounded-full")
    expect(stud).toBeInTheDocument()
  })

  it("calls onClick when clicked", () => {
    const onClick = vi.fn()
    render(
      <StudCell
        color={mockColor}
        size={20}
        renderMode="flat"
        animationDelay={0}
        onClick={onClick}
      />
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalled()
  })

  it("applies animation delay", () => {
    const { container } = render(
      <StudCell
        color={mockColor}
        size={20}
        renderMode="flat"
        animationDelay={160}
      />
    )
    const wrapper = container.querySelector(".animate-build-in")
    expect(wrapper).toHaveStyle({ animationDelay: "160ms" })
  })
})
