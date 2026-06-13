# Authentication & Authorization Guide

## Overview

This application uses:
- **Devise** for user authentication (login, registration, password reset)
- **Pundit** for role-based access control (RBAC)
- **Encrypted passwords** with bcrypt
- **Session management** with remember-me functionality

## User Roles

### Roles Hierarchy
1. **User** (0) — Standard user, can view rooms and check-in
2. **Manager** (1) — Can create/edit rooms, manage layouts
3. **Admin** (2) — Full access, can manage users and permissions

### Permission Matrix

| Action | User | Manager | Admin |
|--------|------|---------|-------|
| View rooms | ✓ | ✓ | ✓ |
| View seats | ✓ | ✓ | ✓ |
| Check-in/out | ✓ | ✓ | ✓ |
| Create room | ✗ | ✓ | ✓ |
| Edit room | ✗ | ✓ | ✓ |
| Delete room | ✗ | ✗ | ✓ |
| Manage users | ✗ | ✗ | ✓ |

## Setup Instructions

### 1. Installation

```bash
# Install gems
bundle install

# Run Devise installer
rails generate devise:install

# Generate User model
rails generate devise User name:string role:integer

# Run migrations
rails db:migrate
```

### 2. Initial Configuration

Edit `config/environments/production.rb`:

```ruby
# SMTP configuration for password reset emails
config.action_mailer.smtp_settings = {
  address: 'smtp.gmail.com',
  port: 587,
  user_name: ENV['SMTP_USER'],
  password: ENV['SMTP_PASSWORD'],
  authentication: 'plain',
  enable_starttls_auto: true
}
```

### 3. Create Admin User

```bash
rails console

user = User.create!(
  email: 'admin@example.com',
  password: 'SecurePassword123!',
  password_confirmation: 'SecurePassword123!',
  name: 'Administrator',
  role: :admin
)
```

## Usage

### Login

```bash
GET  /users/sign_in          # Login page
POST /users/sign_in          # Submit login
```

### Registration

```bash
GET  /users/sign_up          # Registration page
POST /users                  # Create account
```

### Password Reset

```bash
GET  /users/password/new     # Request reset
POST /users/password         # Send reset link
GET  /users/password/edit    # Reset form
PUT  /users/password         # Update password
```

### Logout

```bash
DELETE /users/sign_out       # Logout
```

## Authorization (Pundit)

### Define Policies

```ruby
# app/policies/room_policy.rb
class RoomPolicy < ApplicationPolicy
  def create?
    user.manager?
  end

  def destroy?
    user.admin?
  end
end
```

### Use in Controllers

```ruby
class RoomsController < ApplicationController
  def create
    authorize Room
    # Only managers and admins can reach here
  end

  def destroy
    @room = Room.find(params[:id])
    authorize @room
    # Only admins can reach here
  end
end
```

### Use in Views

```erb
<% if policy(Room).create? %>
  <%= link_to 'New Room', new_room_path %>
<% end %>
```

## React Integration

### Current User

```jsx
import { usePage } from '@inertiajs/react'

function UserMenu() {
  const { auth } = usePage().props

  return (
    <div>
      <p>Logged in as: {auth.user.email}</p>
      {auth.is_admin && <p>Admin access</p>}
    </div>
  )
}
```

### Conditional Rendering

```jsx
export default function RoomActions({ room }) {
  const { auth } = usePage().props

  return (
    <div>
      {auth.is_manager && (
        <button onClick={() => editRoom(room)}>
          Edit
        </button>
      )}
      {auth.is_admin && (
        <button onClick={() => deleteRoom(room)}>
          Delete
        </button>
      )}
    </div>
  )
}
```

## Security Best Practices

### 1. Password Requirements

```ruby
# config/initializers/devise.rb
config.password_length = 8..128
config.password_regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/
```

### 2. Session Management

```ruby
# config/initializers/devise.rb
config.remember_for = 2.weeks
config.timeout_in = 30.minutes
```

### 3. CSRF Protection

All forms automatically include CSRF token via Rails.

### 4. Password Hashing

Passwords are hashed with bcrypt (10 rounds).

## Testing

### Authentication Tests

```ruby
require 'rails_helper'

RSpec.describe RoomsController, type: :controller do
  context 'when user not authenticated' do
    it 'redirects to login' do
      get :index
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context 'when user is authenticated' do
    before { sign_in create(:user) }

    it 'renders index' do
      get :index
      expect(response).to be_successful
    end
  end

  context 'when user is not authorized' do
    before { sign_in create(:user) }

    it 'denies access' do
      expect {
        post :create, params: { room: attributes_for(:room) }
      }.to raise_error(Pundit::NotAuthorizedError)
    end
  end
end
```

### Test Helpers

```ruby
# spec/support/devise.rb
RSpec.configure do |config|
  config.include Devise::Test::ControllerHelpers, type: :controller
  config.include Devise::Test::IntegrationHelpers, type: :request
end
```

### Sign In Helper

```ruby
# Sign in as user
before { sign_in create(:user) }

# Sign in as manager
before { sign_in create(:user, role: :manager) }

# Sign in as admin
before { sign_in create(:user, role: :admin) }
```

## Email Configuration

### Password Reset Emails

Edit `app/views/devise/mailer/reset_password_instructions.html.erb`:

```erb
<h2>Password Reset</h2>
<p>Click the link below to reset your password:</p>
<%= link_to 'Reset Password', edit_password_url(@resource, reset_password_token: @token) %>
```

### Confirmation Emails

Enable email confirmations:

```ruby
# app/models/user.rb
devise :confirmable
```

## Troubleshooting

### User can't login
1. Verify user exists: `User.find_by(email: 'user@example.com')`
2. Check password: `user.valid_password?('password')`
3. Verify account not locked: `user.access_locked?`

### Password reset not working
1. Verify SMTP configured: `Rails.application.config.action_mailer.default_url_options`
2. Check email delivery: `ActionMailer::Base.deliveries.last`
3. Test email delivery: `UserMailer.reset_password_instructions(user, token).deliver_now`

### Policy denying access unexpectedly
1. Check user role: `user.role`
2. Verify policy method exists: `RoomPolicy.new(user, room).create?`
3. Test policy directly: `Rails.application.config.pundit.namespace = 'policy'`

## Resources

- [Devise Documentation](https://github.com/heartcombo/devise)
- [Pundit Authorization](https://github.com/varvet/pundit)
- [Rails Security Guide](https://guides.rubyonrails.org/security.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
