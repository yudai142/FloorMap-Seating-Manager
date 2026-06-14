import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoomsIndex from '../../../app/javascript/components/Rooms/Index'

// Mock InertiaJS
vi.mock('@inertiajs/react', () => ({
  useForm: () => ({
    data: { name: '', width: 800, height: 600 },
    setData: vi.fn(),
    post: vi.fn(),
    processing: false,
    errors: {}
  }),
  Link: ({ href, children }: any) => <a href={href}>{children}</a>
}))

describe('RoomsIndex', () => {
  const defaultProps = {
    rooms: [
      { id: 1, name: 'Room A', width: 800, height: 600 },
      { id: 2, name: 'Room B', width: 1000, height: 800 }
    ],
    errors: [],
    can_create: true,
    pagination: {
      current_page: 1,
      total_pages: 2,
      total_count: 2
    },
    search_query: {}
  }

  it('renders room list', () => {
    render(<RoomsIndex {...defaultProps} />)

    expect(screen.getByText('Room A')).toBeInTheDocument()
    expect(screen.getByText('Room B')).toBeInTheDocument()
  })

  it('displays search form', () => {
    render(<RoomsIndex {...defaultProps} />)

    expect(screen.getByPlaceholderText('ルーム名で検索')).toBeInTheDocument()
  })

  it('shows total count', () => {
    render(<RoomsIndex {...defaultProps} />)

    expect(screen.getByText(/合計 2 件の上面図/)).toBeInTheDocument()
  })

  it('renders pagination component', () => {
    render(<RoomsIndex {...defaultProps} />)

    expect(screen.getByText('前へ')).toBeInTheDocument()
    expect(screen.getByText('次へ')).toBeInTheDocument()
  })

  it('displays no rooms message when empty', () => {
    render(<RoomsIndex {...defaultProps} rooms={[]} />)

    expect(screen.getByText('上面図がまだ作成されていません')).toBeInTheDocument()
  })

  it('renders create button when allowed', () => {
    render(<RoomsIndex {...defaultProps} can_create={true} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.some(btn => btn.textContent?.includes('新規作成'))).toBe(true)
  })
})
