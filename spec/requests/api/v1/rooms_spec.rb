require 'rails_helper'

RSpec.describe 'API V1 Rooms', type: :request do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }
  let(:headers) { { 'CONTENT_TYPE' => 'application/json' } }

  path '/api/v1/rooms' do
    get 'List all rooms with pagination' do
      tags 'Rooms'
      parameter name: :page, in: :query, type: :integer, description: 'Page number'
      parameter name: :q, in: :query, type: :object, description: 'Search query (ransack format)'

      response '200', 'success' do
        let!(:rooms) { create_list(:room, 3) }

        before { sign_in user }

        schema type: :object, properties: {
          rooms: { type: :array, items: { '$ref': '#/components/schemas/Room' } },
          pagination: {
            type: :object,
            properties: {
              current_page: { type: :integer },
              total_pages: { type: :integer },
              total_count: { type: :integer }
            }
          }
        }

        run_test!
      end
    end

    post 'Create a new room' do
      tags 'Rooms'
      security [{ bearerAuth: [] }]
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          room: {
            type: :object,
            properties: {
              name: { type: :string },
              width: { type: :integer },
              height: { type: :integer }
            },
            required: ['name']
          }
        }
      }

      response '201', 'created' do
        let(:body) { { room: { name: 'New Room', width: 800, height: 600 } } }

        before { sign_in user }

        schema type: :object, properties: {
          id: { type: :integer },
          name: { type: :string },
          width: { type: :integer },
          height: { type: :integer }
        }

        run_test!
      end
    end
  end

  path '/api/v1/rooms/{id}' do
    get 'Get a room with seats' do
      tags 'Rooms'
      parameter name: :id, in: :path, type: :integer, required: true

      response '200', 'success' do
        let(:room) { create(:room) }
        let(:id) { room.id }

        before do
          create_list(:seat, 3, room: room)
          sign_in user
        end

        schema type: :object, properties: {
          id: { type: :integer },
          name: { type: :string },
          width: { type: :integer },
          height: { type: :integer },
          seats: {
            type: :array,
            items: { '$ref': '#/components/schemas/Seat' }
          }
        }

        run_test!
      end
    end
  end
end
