import { render, screen } from '@testing-library/react'

function Dummy() {
  return <div>Hello FloorMap</div>
}

test('renders dummy component', () => {
  render(<Dummy />)
  expect(screen.getByText('Hello FloorMap')).toBeInTheDocument()
})
