require 'rails_helper'

RSpec.configure do |config|
  # Swagger/OpenAPI configuration
  config.swagger_root = Rails.root.join('swagger').to_s

  config.swagger_docs = {
    'v1/swagger.yaml' => {
      openapi: '3.0.0',
      info: {
        title: 'FloorMap Seating Manager API',
        version: 'v1',
        description: '座席配置管理アプリケーション API',
        contact: {
          name: 'Support'
        },
        license: {
          name: 'MIT'
        }
      },
      paths: {},
      components: {
        securitySchemes: {
          api_key: {
            type: :apiKey,
            name: :Authorization,
            in: :header,
            description: 'Authentication token'
          }
        },
        schemas: {
          Room: {
            type: :object,
            properties: {
              id: { type: :integer },
              name: { type: :string },
              width: { type: :integer },
              height: { type: :integer },
              created_at: { type: :string, format: :date_time },
              updated_at: { type: :string, format: :date_time }
            },
            required: [:id, :name, :width, :height]
          },
          Seat: {
            type: :object,
            properties: {
              id: { type: :integer },
              room_id: { type: :integer },
              label: { type: :string },
              x: { type: :integer },
              y: { type: :integer },
              occupied: { type: :boolean },
              occupant_name: { type: :string, nullable: true },
              created_at: { type: :string, format: :date_time },
              updated_at: { type: :string, format: :date_time }
            },
            required: [:id, :room_id, :label, :x, :y, :occupied]
          },
          Error: {
            type: :object,
            properties: {
              message: { type: :string },
              errors: { type: :object }
            }
          }
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development'
        },
        {
          url: '{baseUrl}',
          description: 'Production',
          variables: {
            baseUrl: {
              default: 'https://api.example.com'
            }
          }
        }
      ]
    }
  }

  config.swagger_format = :yaml
end
