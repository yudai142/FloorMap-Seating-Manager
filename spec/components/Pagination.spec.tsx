import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pagination from '../../app/javascript/components/ui/Pagination'

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    baseUrl: '/',
    queryParams: {}
  }

  it('renders pagination component', () => {
    render(<Pagination {...defaultProps} />)
    
    expect(screen.getByText('前へ')).toBeInTheDocument()
    expect(screen.getByText('次へ')).toBeInTheDocument()
  })

  it('displays page numbers', () => {
    render(<Pagination {...defaultProps} />)

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument()
    }
  })

  it('highlights current page', () => {
    render(<Pagination {...defaultProps} currentPage={2} />)

    const currentPageButton = screen.getByRole('link', { name: '2' })
    expect(currentPageButton).toHaveClass('bg-cyan-500', 'text-white')
  })

  it('disables prev button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />)

    const prevButton = screen.getByText('前へ')
    expect(prevButton.closest('a')).toHaveClass('opacity-50')
  })

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={5} />)

    const nextButton = screen.getByText('次へ')
    expect(nextButton.closest('a')).toHaveClass('opacity-50')
  })

  it('generates correct pagination links', () => {
    render(<Pagination {...defaultProps} baseUrl="/rooms" />)

    const links = screen.getAllByRole('link')
    const firstPageLink = links[0]
    expect(firstPageLink).toHaveAttribute('href', expect.stringContaining('/rooms'))
  })
})
