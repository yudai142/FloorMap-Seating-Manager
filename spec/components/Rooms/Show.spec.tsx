import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoomsShow from '../../../app/javascript/components/Rooms/Show'

// Mock ActionCable
vi.mock('../../../app/javascript/channels/room_channel', () => ({
  subscribeToRoom: () => ({
    unsubscribe: vi.fn()
  })
}))

describe('RoomsShow', () => {
  const defaultProps = {
    room: {
      id: 1,
      name: 'Conference Room',
      width: 800,
      height: 600
    },
    seats: [
      { id: 1, label: 'A-1', x: 100, y: 100, occupied: false, occupant_name: null },
      { id: 2, label: 'A-2', x: 200, y: 100, occupied: true, occupant_name: '山田太郎' }
    ]
  }

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('renders room details', () => {
    render(<RoomsShow {...defaultProps} />)

    expect(screen.getByText('Conference Room')).toBeInTheDocument()
    expect(screen.getByText('800 × 600')).toBeInTheDocument()
  })

  it('displays seat list', () => {
    render(<RoomsShow {...defaultProps} />)

    expect(screen.getByText('A-1')).toBeInTheDocument()
    expect(screen.getByText('A-2')).toBeInTheDocument()
  })

  it('shows occupied seat with occupant name', () => {
    render(<RoomsShow {...defaultProps} />)

    expect(screen.getByText('山田太郎')).toBeInTheDocument()
  })

  it('opens check-in modal when clicking empty seat', async () => {
    const user = userEvent.setup()
    render(<RoomsShow {...defaultProps} />)

    const seat = screen.getByText('A-1')
    await user.click(seat)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('名前')).toBeInTheDocument()
    })
  })

  it('displays CSV download button', () => {
    render(<RoomsShow {...defaultProps} />)

    const downloadButton = screen.getByText('座席情報をダウンロード')
    expect(downloadButton).toHaveAttribute('href', expect.stringContaining('/export_csv'))
  })

  it('closes modal when clicking cancel', async () => {
    const user = userEvent.setup()
    render(<RoomsShow {...defaultProps} />)

    const seat = screen.getByText('A-1')
    await user.click(seat)

    await waitFor(() => {
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })

    await user.click(screen.getByText('キャンセル'))

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('名前')).not.toBeInTheDocument()
    })
  })
})
