require 'swagger_helper'

describe 'FloorMap API', type: :request do
  path '/rooms' do
    get 'List all rooms' do
      tags 'Rooms'
      produces 'application/json'
      security [{ api_key: [] }]

      response '200', 'Rooms retrieved successfully' do
        schema type: :object,
               properties: {
                 rooms: {
                   type: :array,
                   items: { '$ref' => '#/components/schemas/Room' }
                 }
               }

        let(:user) { create(:user) }
        before { sign_in user }

        run_test!
      end

      response '401', 'Unauthorized' do
        let(:Authorization) { 'invalid_token' }
        run_test!
      end
    end

    post 'Create a new room' do
      tags 'Rooms'
      consumes 'application/json'
      produces 'application/json'
      security [{ api_key: [] }]

      parameter name: :room, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string, example: 'Conference Room' },
          width: { type: :integer, example: 800 },
          height: { type: :integer, example: 600 }
        },
        required: [:name, :width, :height]
      }

      response '201', 'Room created successfully' do
        schema { '$ref' => '#/components/schemas/Room' }

        let(:user) { create(:user, role: :manager) }
        let(:room) { { name: 'New Room', width: 1000, height: 800 } }

        before { sign_in user }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['name']).to eq('New Room')
        end
      end

      response '403', 'Forbidden - User is not a manager' do
        let(:user) { create(:user, role: :user) }
        let(:room) { { name: 'New Room', width: 1000, height: 800 } }

        before { sign_in user }

        run_test!
      end

      response '422', 'Unprocessable Entity' do
        let(:user) { create(:user, role: :manager) }
        let(:room) { { name: '', width: -1, height: 600 } }

        before { sign_in user }

        run_test!
      end
    end
  end

  path '/rooms/{id}' do
    get 'Get a specific room' do
      tags 'Rooms'
      produces 'application/json'
      parameter name: :id, in: :path, type: :integer, required: true

      response '200', 'Room retrieved successfully' do
        schema { '$ref' => '#/components/schemas/Room' }

        let(:user) { create(:user) }
        let(:room) { create(:room) }
        let(:id) { room.id }

        before { sign_in user }

        run_test!
      end

      response '404', 'Room not found' do
        let(:user) { create(:user) }
        let(:id) { 999 }

        before { sign_in user }

        run_test!
      end
    end
  end

  path '/rooms/{room_id}/seats' do
    get 'List all seats in a room' do
      tags 'Seats'
      produces 'application/json'
      parameter name: :room_id, in: :path, type: :integer, required: true

      response '200', 'Seats retrieved successfully' do
        schema type: :object,
               properties: {
                 seats: {
                   type: :array,
                   items: { '$ref' => '#/components/schemas/Seat' }
                 }
               }

        let(:user) { create(:user) }
        let(:room) { create(:room) }
        let(:room_id) { room.id }

        before do
          sign_in user
          create_list(:seat, 3, room: room)
        end

        run_test!
      end
    end

    post 'Create a new seat' do
      tags 'Seats'
      consumes 'application/json'
      parameter name: :room_id, in: :path, type: :integer, required: true
      parameter name: :seat, in: :body, schema: {
        type: :object,
        properties: {
          label: { type: :string, example: 'S1' },
          x: { type: :integer, example: 100 },
          y: { type: :integer, example: 100 }
        },
        required: [:label, :x, :y]
      }

      response '201', 'Seat created successfully' do
        schema { '$ref' => '#/components/schemas/Seat' }

        let(:user) { create(:user, role: :manager) }
        let(:room) { create(:room) }
        let(:room_id) { room.id }
        let(:seat) { { label: 'S1', x: 150, y: 150 } }

        before { sign_in user }

        run_test!
      end
    end
  end

  path '/seats/{id}/check_in' do
    post 'Check-in to a seat' do
      tags 'Seats'
      consumes 'application/json'
      parameter name: :id, in: :path, type: :integer, required: true
      parameter name: :occupant_name, in: :body, schema: {
        type: :object,
        properties: {
          occupant_name: { type: :string, example: 'John Doe' }
        },
        required: [:occupant_name]
      }

      response '200', 'Successfully checked in' do
        schema { '$ref' => '#/components/schemas/Seat' }

        let(:user) { create(:user) }
        let(:seat) { create(:seat) }
        let(:id) { seat.id }
        let(:occupant_name) { 'John Doe' }

        before { sign_in user }

        run_test!
      end
    end
  end

  path '/seats/{id}/check_out' do
    post 'Check-out from a seat' do
      tags 'Seats'
      parameter name: :id, in: :path, type: :integer, required: true

      response '200', 'Successfully checked out' do
        schema { '$ref' => '#/components/schemas/Seat' }

        let(:user) { create(:user) }
        let(:seat) { create(:seat, occupied: true, occupant_name: 'John Doe') }
        let(:id) { seat.id }

        before { sign_in user }

        run_test!
      end
    end
  end
end
