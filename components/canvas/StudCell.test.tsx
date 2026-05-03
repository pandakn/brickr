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

  test('renders nothing visible when color is null', () => {
    render(
      <StudCell color={null} size={20} renderMode="stud" animationDelay={0} />
    )
    expect(screen.getByTestId('stud-cell-empty')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
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

  test('calls onClick when clicked', () => {
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
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
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
