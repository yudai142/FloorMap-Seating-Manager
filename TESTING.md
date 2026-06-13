# Testing Guide

## Overview

This project uses:
- **RSpec** for backend (Rails models, controllers)
- **Vitest** for frontend (React components, utilities)
- **GitHub Actions** for CI/CD

## Running Tests Locally

### Backend Tests (RSpec)

```bash
# Run all tests
bundle exec rspec

# Run specific spec file
bundle exec rspec spec/models/room_spec.rb

# Run tests with coverage
bundle exec rspec --coverage

# Run tests in parallel
bundle exec rspec --parallel
```

### Frontend Tests (Vitest)

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

### Code Quality

```bash
# Run RuboCop
bundle exec rubocop

# Run security audits
bundle exec brakeman

# Run bundle audit
bundle audit
```

## Writing Tests

### Backend (RSpec)

#### Model Tests

```ruby
# spec/models/room_spec.rb
require 'rails_helper'

RSpec.describe Room, type: :model do
  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_numericality_of(:width).is_greater_than(0) }
  end

  describe 'associations' do
    it { is_expected.to have_many(:seats).dependent(:destroy) }
  end
end
```

#### Controller Tests

```ruby
# spec/controllers/rooms_controller_spec.rb
require 'rails_helper'

RSpec.describe RoomsController, type: :controller do
  describe 'GET #index' do
    it 'returns a success response' do
      get :index
      expect(response).to be_successful
    end
  end
end
```

#### Using Factory Bot

```ruby
# Create instances for testing
room = create(:room, name: 'Test Room')
seats = create_list(:seat, 5, room: room)

# Build without saving
unsaved_room = build(:room)
```

### Frontend (Vitest)

#### Component Tests

```typescript
// spec/components/Alert.spec.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorAlert } from '../../app/javascript/components/ui/Alert'

describe('ErrorAlert', () => {
  it('displays error message', () => {
    render(<ErrorAlert message="Test error" />)
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('calls onDismiss when dismissed', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<ErrorAlert message="Error" onDismiss={onDismiss} />)

    await user.click(screen.getByRole('button'))
    expect(onDismiss).toHaveBeenCalled()
  })
})
```

## Test Structure

```
spec/
├── models/
│   ├── room_spec.rb
│   └── seat_spec.rb
├── controllers/
│   ├── rooms_controller_spec.rb
│   ├── seats_controller_spec.rb
│   └── editors_controller_spec.rb
├── components/
│   ├── Alert.spec.tsx
│   ├── Rooms/
│   │   ├── Index.spec.tsx
│   │   └── Show.spec.tsx
│   └── Editor/
│       └── Canvas.spec.tsx
├── factories.rb
└── setup.ts
```

## Factories

Factory Bot factories are defined in `spec/factories.rb`:

```ruby
FactoryBot.define do
  factory :room do
    sequence(:name) { |n| "Room #{n}" }
    width { 800 }
    height { 600 }
  end

  factory :seat do
    room
    sequence(:label) { |n| "S#{n}" }
    x { 100 }
    y { 100 }
    occupied { false }
  end
end
```

## CI/CD

Tests run automatically on:
1. **Push to main** — all tests must pass
2. **Pull requests** — all tests must pass before merge

See `.github/workflows/tests.yml` for configuration.

### Check CI status

```bash
# View GitHub Actions
gh run list

# View specific run
gh run view <run-id>

# Re-run failed tests
gh run rerun <run-id>
```

## Best Practices

1. **Test-Driven Development** — write tests before implementation
2. **Keep tests focused** — one concept per test
3. **Use descriptive names** — `it 'creates a new room when valid params provided'`
4. **DRY principle** — use setup blocks and factories
5. **Mock external dependencies** — API calls, third-party services
6. **Test behavior, not implementation** — don't mock internal methods
7. **Keep coverage high** — aim for >80%

## Troubleshooting

### RSpec

**Issue:** Database not found
```bash
bundle exec rails db:create RAILS_ENV=test
```

**Issue:** Pending migrations
```bash
bundle exec rails db:migrate RAILS_ENV=test
```

### Vitest

**Issue:** Module not found
- Check `vitest.config.ts` alias configuration
- Verify `setup.ts` import paths

**Issue:** React component not rendering
- Ensure component is exported
- Check import paths in test file
- Verify all dependencies are installed

## Resources

- [RSpec Rails Documentation](https://rspec.info/)
- [Factory Bot Guide](https://github.com/thoughtbot/factory_bot/wiki)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/react)
