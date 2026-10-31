import type { LegoColor } from '@/types'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { StudCell } from './StudCell'

describe('StudCell', () => {
  const mockColor: LegoColor = {
    id: 'red',
    name: 'Bright Red',
    hex: '#FF0000',
    lab: [0, 0, 0],
  }

  const emptyCell = () => screen.getByRole('button', { name: 'Empty position' })

  test('renders a decorative placeholder when empty and not clickable', () => {
    render(
      <StudCell color={null} size={20} renderMode="stud" animationDelay={0} />
    )
    const placeholder = screen.getByTestId('stud-cell-empty')
    expect(placeholder).toHaveAttribute('aria-hidden', 'true')
    expect(placeholder).not.toHaveAttribute('role')
    expect(placeholder).not.toHaveAttribute('tabindex')
    expect(placeholder).toHaveStyle({ width: '20px', height: '20px' })
  })

  test('renders an empty cell as a focusable, labelled button', () => {
    const onClick = vi.fn()
    render(
      <StudCell
        color={null}
        size={20}
        renderMode="stud"
        animationDelay={0}
        onClick={onClick}
      />
    )

    const cell = emptyCell()
    expect(cell).toHaveAttribute('tabindex', '0')
    expect(cell).not.toHaveAttribute('aria-hidden')

    cell.focus()
    expect(cell).toHaveFocus()
  })

  test('keeps the layout size for an empty cell', () => {
    render(
      <StudCell
        color={null}
        size={20}
        renderMode="stud"
        animationDelay={0}
        onClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('stud-cell-empty')).toHaveStyle({
      width: '20px',
      height: '20px',
    })
  })

  test('calls onClick when an empty cell is clicked', () => {
    const onClick = vi.fn()
    render(
      <StudCell
        color={null}
        size={20}
        renderMode="stud"
        animationDelay={0}
        onClick={onClick}
      />
    )

    fireEvent.click(emptyCell())
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('activates an empty cell with Enter', () => {
    const onClick = vi.fn()
    render(
      <StudCell
        color={null}
        size={20}
        renderMode="stud"
        animationDelay={0}
        onClick={onClick}
      />
    )

    fireEvent.keyDown(emptyCell(), { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('activates an empty cell with Space without double firing', () => {
    const onClick = vi.fn()
    render(
      <StudCell
        color={null}
        size={20}
        renderMode="stud"
        animationDelay={0}
        onClick={onClick}
      />
    )

    fireEvent.keyDown(emptyCell(), { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('renders a colored button with aria-label', () => {
    render(
      <StudCell
        color={mockColor}
        size={20}
        renderMode="flat"
        animationDelay={0}
      />
    )
    const button = screen.getByRole('button', { name: 'Bright Red' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle({ backgroundColor: '#FF0000' })
    expect(button).toHaveStyle({ width: '20px', height: '20px' })
  })

  test('renders a stud when renderMode is stud', () => {
    render(
      <StudCell
        color={mockColor}
        size={20}
        renderMode="stud"
        animationDelay={0}
      />
    )
    expect(screen.getByTestId('stud')).toBeInTheDocument()
  })

  test('does not render a stud when renderMode is flat', () => {
    render(
      <StudCell
        color={mockColor}
        size={20}
        renderMode="flat"
        animationDelay={0}
      />
    )
    expect(screen.queryByTestId('stud')).not.toBeInTheDocument()
  })

  test('calls onClick when a filled cell is clicked', () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Bright Red' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('activates a filled cell with Enter and Space', () => {
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

    const button = screen.getByRole('button', { name: 'Bright Red' })
    fireEvent.keyDown(button, { key: 'Enter' })
    fireEvent.keyDown(button, { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  test('applies animation delay', () => {
    render(
      <StudCell
        color={mockColor}
        size={20}
        renderMode="flat"
        animationDelay={160}
      />
    )
    expect(screen.getByTestId('stud-cell')).toHaveStyle({
      animationDelay: '160ms',
    })
  })
})
