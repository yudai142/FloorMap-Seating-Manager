# API Documentation Guide

## Overview

This application uses **rswag** to automatically generate Swagger/OpenAPI documentation from RSpec tests. The API documentation is interactive and up-to-date with your code.

## Generating API Documentation

### Generate Swagger Spec

```bash
# Generate swagger spec from RSpec tests
SWAGGER_DRY_RUN=0 bundle exec rake rswag:specs:swaggerize

# View generated spec
cat swagger/v1/swagger.yaml
```

### Access API Documentation UI

```bash
# Development
http://localhost:3000/api-docs

# Swagger UI will be available at this endpoint
```

## API Endpoints

### Rooms API

#### List all rooms
```http
GET /rooms HTTP/1.1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "rooms": [
    {
      "id": 1,
      "name": "Conference Room",
      "width": 800,
      "height": 600,
      "created_at": "2026-06-13T10:00:00Z",
      "updated_at": "2026-06-13T10:00:00Z"
    }
  ]
}
```

#### Create a new room
```http
POST /rooms HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "room": {
    "name": "New Room",
    "width": 1000,
    "height": 800
  }
}
```

**Response (201):**
```json
{
  "id": 2,
  "name": "New Room",
  "width": 1000,
  "height": 800,
  "created_at": "2026-06-13T11:00:00Z",
  "updated_at": "2026-06-13T11:00:00Z"
}
```

**Error (403 Forbidden):**
```json
{
  "message": "アクセス権限がありません"
}
```

#### Get a specific room
```http
GET /rooms/1 HTTP/1.1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "name": "Conference Room",
  "width": 800,
  "height": 600,
  "created_at": "2026-06-13T10:00:00Z",
  "updated_at": "2026-06-13T10:00:00Z"
}
```

### Seats API

#### List all seats in a room
```http
GET /rooms/1/seats HTTP/1.1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "seats": [
    {
      "id": 1,
      "room_id": 1,
      "label": "S1",
      "x": 100,
      "y": 100,
      "occupied": false,
      "occupant_name": null,
      "created_at": "2026-06-13T10:00:00Z",
      "updated_at": "2026-06-13T10:00:00Z"
    }
  ]
}
```

#### Create a new seat
```http
POST /rooms/1/seats HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "seat": {
    "label": "S2",
    "x": 200,
    "y": 100
  }
}
```

**Response (201):**
```json
{
  "id": 2,
  "room_id": 1,
  "label": "S2",
  "x": 200,
  "y": 100,
  "occupied": false,
  "occupant_name": null,
  "created_at": "2026-06-13T11:00:00Z",
  "updated_at": "2026-06-13T11:00:00Z"
}
```

#### Check-in to a seat
```http
POST /seats/1/check_in HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "occupant_name": "John Doe"
}
```

**Response:**
```json
{
  "id": 1,
  "room_id": 1,
  "label": "S1",
  "x": 100,
  "y": 100,
  "occupied": true,
  "occupant_name": "John Doe",
  "created_at": "2026-06-13T10:00:00Z",
  "updated_at": "2026-06-13T11:05:00Z"
}
```

#### Check-out from a seat
```http
POST /seats/1/check_out HTTP/1.1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "room_id": 1,
  "label": "S1",
  "x": 100,
  "y": 100,
  "occupied": false,
  "occupant_name": null,
  "created_at": "2026-06-13T10:00:00Z",
  "updated_at": "2026-06-13T11:10:00Z"
}
```

## Writing API Documentation in Tests

### Basic Endpoint Documentation

```ruby
describe 'API Endpoint' do
  path '/resource' do
    get 'Get all resources' do
      tags 'Resources'
      produces 'application/json'

      response '200', 'Success' do
        schema type: :object,
               properties: {
                 resources: { type: :array }
               }

        let(:user) { create(:user) }
        before { sign_in user }

        run_test!
      end
    end
  end
end
```

### With Parameters

```ruby
path '/resources/{id}' do
  get 'Get a resource' do
    parameter name: :id, in: :path, type: :integer, required: true

    response '200', 'Success' do
      let(:resource) { create(:resource) }
      let(:id) { resource.id }

      run_test!
    end

    response '404', 'Not found' do
      let(:id) { 999 }
      run_test!
    end
  end
end
```

### With Request Body

```ruby
post 'Create resource' do
  parameter name: :resource, in: :body, schema: {
    type: :object,
    properties: {
      name: { type: :string },
      description: { type: :string }
    },
    required: [:name]
  }

  response '201', 'Created' do
    let(:resource) { { name: 'New Resource' } }
    run_test!
  end
end
```

## Using the API from Client

### JavaScript/React

```javascript
// Fetch room details
const response = await fetch('/rooms/1', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

const room = await response.json()
```

### cURL

```bash
# List rooms
curl -X GET http://localhost:3000/rooms \
  -H "Authorization: Bearer your_token"

# Create room
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "room": {
      "name": "Meeting Room",
      "width": 800,
      "height": 600
    }
  }'

# Check-in
curl -X POST http://localhost:3000/seats/1/check_in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "occupant_name": "John Doe"
  }'
```

### Postman

1. Import Swagger spec: `swagger/v1/swagger.yaml`
2. Each endpoint will be auto-populated with:
   - Request parameters
   - Expected responses
   - Example values
3. Set authorization token in Postman environment

## API Versioning

### Version Strategy

- **Current version:** v1 (2026-06-13)
- **Deprecation period:** 6 months
- **Sunset:** Endpoints marked as deprecated will be removed after deprecation period

### Version Location

```
/api/v1/rooms       # Version in path
/api/v2/rooms       # Future version
```

## Error Handling

### Standard Error Responses

**400 Bad Request:**
```json
{
  "errors": {
    "room": ["can't be blank"]
  }
}
```

**401 Unauthorized:**
```json
{
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "message": "アクセス権限がありません"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**422 Unprocessable Entity:**
```json
{
  "errors": {
    "width": ["must be greater than 0"],
    "height": ["must be greater than 0"]
  }
}
```

**500 Internal Server Error:**
```json
{
  "message": "Internal Server Error"
}
```

## Security

### Authentication

- All endpoints require authentication
- Use Bearer token in Authorization header
- Token obtained via `/users/sign_in`

### Authorization

- User role determines allowed actions
- Managers can create/edit resources
- Admins have full access
- Authorization errors return 403 Forbidden

## Rate Limiting

Not currently implemented. Future versions will include:
- 100 requests per minute per user
- 1000 requests per day per user

## API Testing

### Run API Tests

```bash
# Run only API tests
bundle exec rspec spec/requests/

# Run with coverage
bundle exec rspec spec/requests/ --coverage

# Generate fresh swagger spec
SWAGGER_DRY_RUN=0 bundle exec rake rswag:specs:swaggerize
```

## Changelog

### v1.0.0 (2026-06-13)
- Initial API release
- Rooms CRUD endpoints
- Seats management endpoints
- Check-in/check-out functionality
- Role-based access control

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [rswag Documentation](https://github.com/rswag/rswag)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [REST API Design Best Practices](https://restfulapi.net/)
