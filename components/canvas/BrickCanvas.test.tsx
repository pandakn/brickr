import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrickCanvas } from "./BrickCanvas"
import React from "react"
import type { LegoColor } from "@/types"

describe("BrickCanvas", () => {
  it("renders empty state when matrix is empty", () => {
    render(
      <BrickCanvas
        matrix={[]}
        renderMode="stud"
        showGrid={false}
        cellSize={20}
        isBuilding={false}
        buildKey={0}
        onCellClick={vi.fn()}
      />
    )
    expect(screen.getByLabelText("Empty brick canvas")).toBeInTheDocument()
  })

  it("renders a grid of cells and handles clicks", () => {
    const onCellClick = vi.fn()
    const mockColor: LegoColor = {
      id: "red",
      name: "Red",
      hex: "#FF0000",
      lab: [0, 0, 0],
    }
    const matrix: (LegoColor | null)[][] = [
      [mockColor, null],
      [null, mockColor],
    ]

    render(
      <BrickCanvas
        matrix={matrix}
        renderMode="stud"
        showGrid={false}
        cellSize={20}
        isBuilding={false}
        buildKey={0}
        onCellClick={onCellClick}
      />
    )

    const cells = screen.getAllByRole('button', { name: 'Red' })
    expect(cells).toHaveLength(2)

    // Click the first cell
    fireEvent.click(cells[0])
    expect(onCellClick).toHaveBeenCalledWith(0, 0)
  })
})
