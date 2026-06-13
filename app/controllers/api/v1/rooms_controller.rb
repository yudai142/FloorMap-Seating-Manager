module Api
  module V1
    class RoomsController < BaseController
      def index
        @q = Room.ransack(params[:q])
        @rooms = @q.result.order(:created_at).page(params[:page]).per(20)
        render json: {
          rooms: @rooms.as_json(only: %i[id name width height], include: :seats),
          pagination: {
            current_page: @rooms.current_page,
            total_pages: @rooms.total_pages,
            total_count: @rooms.total_count
          }
        }
      end

      def show
        @room = Room.find(params[:id])
        render json: @room.as_json(include: :seats)
      end

      def create
        authorize Room
        @room = Room.new(room_params)

        if @room.save
          render json: @room.as_json(include: :seats), status: :created
        else
          render json: { errors: @room.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def room_params
        params.require(:room).permit(:name, :width, :height)
      end
    end
  end
end
