import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorAlert, SuccessAlert } from '../../app/javascript/components/ui/Alert'

describe('ErrorAlert', () => {
  it('displays error message', () => {
    render(<ErrorAlert message="Test error" />)
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  end)

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<ErrorAlert message="Test error" onDismiss={onDismiss} />)

    const dismissButton = screen.getByRole('button')
    await user.click(dismissButton)

    expect(onDismiss).toHaveBeenCalled()
  })
})

describe('SuccessAlert', () => {
  it('displays success message', () => {
    render(<SuccessAlert message="Success!" />)
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<SuccessAlert message="Success!" onDismiss={onDismiss} />)

    const dismissButton = screen.getByRole('button')
    await user.click(dismissButton)

    expect(onDismiss).toHaveBeenCalled()
  })
})
