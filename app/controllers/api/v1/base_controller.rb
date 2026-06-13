module Api
  module V1
    class BaseController < ApplicationController
      skip_before_action :set_current_user_in_inertia
      before_action :authenticate_user!

      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from Pundit::NotAuthorizedError, with: :forbidden

      protected

      def not_found
        render json: { error: 'Not found' }, status: :not_found
      end

      def forbidden
        render json: { error: 'Forbidden' }, status: :forbidden
      end
    end
  end
end
