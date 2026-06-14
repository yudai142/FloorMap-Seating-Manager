require 'rails_helper'

RSpec.describe 'API V1 Seats', type: :request do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }
  let(:room) { create(:room) }
  let(:seat) { create(:seat, room: room) }
  let(:headers) { { 'CONTENT_TYPE' => 'application/json' } }

  path '/api/v1/seats/{id}/check_in' do
    post 'Check in to a seat' do
      tags 'Seats'
      parameter name: :id, in: :path, type: :integer, required: true
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          occupant_name: { type: :string }
        }
      }

      response '200', 'success' do
        let(:id) { seat.id }
        let(:body) { { occupant_name: 'John Doe' } }

        before { sign_in user }

        schema type: :object, properties: {
          id: { type: :integer },
          label: { type: :string },
          occupied: { type: :boolean },
          occupant_name: { type: :string }
        }

        run_test!
      end
    end
  end

  path '/api/v1/seats/{id}/check_out' do
    post 'Check out from a seat' do
      tags 'Seats'
      parameter name: :id, in: :path, type: :integer, required: true

      response '200', 'success' do
        let(:seat) { create(:seat, room: room, occupied: true, occupant_name: 'Jane Doe') }
        let(:id) { seat.id }

        before { sign_in user }

        schema type: :object, properties: {
          id: { type: :integer },
          label: { type: :string },
          occupied: { type: :boolean },
          occupant_name: { type: [:string, 'null'] }
        }

        run_test!
      end
    end
  end
end
