import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { GridSizePicker } from "./GridSizePicker"
import React from "react"

describe("GridSizePicker", () => {
  it("renders all size options", () => {
    const onChange = vi.fn()
    render(<GridSizePicker value={32} onChange={onChange} />)

    expect(screen.getByText("12×12")).toBeInTheDocument()
    expect(screen.getByText("25×25")).toBeInTheDocument()
    expect(screen.getByText("32×32")).toBeInTheDocument()
    expect(screen.getByText("40×40")).toBeInTheDocument()
    expect(screen.getByText("64×64")).toBeInTheDocument()
  })

  it("marks the current value as active", () => {
    const onChange = vi.fn()
    render(<GridSizePicker value={32} onChange={onChange} />)

    const activeBtn = screen.getByText("32×32")
    expect(activeBtn).toHaveAttribute("aria-pressed", "true")

    const inactiveBtn = screen.getByText("64×64")
    expect(inactiveBtn).toHaveAttribute("aria-pressed", "false")
  })

  it("calls onChange when a size is clicked", () => {
    const onChange = vi.fn()
    render(<GridSizePicker value={32} onChange={onChange} />)

    fireEvent.click(screen.getByText("64×64"))

    expect(onChange).toHaveBeenCalledWith(64)
  })
})
