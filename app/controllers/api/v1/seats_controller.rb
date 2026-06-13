module Api
  module V1
    class SeatsController < BaseController
      def create
        @room = Room.find(params[:room_id])
        authorize @room
        @seat = @room.seats.build(seat_params)

        if @seat.save
          render json: @seat.as_json, status: :created
        else
          render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        @room = Room.find(params[:room_id])
        @seat = @room.seats.find(params[:id])
        authorize @room

        if @seat.update(seat_params)
          render json: @seat.as_json
        else
          render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def check_in
        @seat = Seat.find(params[:id])
        @seat.update(occupied: true, occupant_name: params[:occupant_name])

        broadcast_room_update(@seat.room)
        render json: @seat.as_json
      end

      def check_out
        @seat = Seat.find(params[:id])
        @seat.update(occupied: false, occupant_name: nil)

        broadcast_room_update(@seat.room)
        render json: @seat.as_json
      end

      def export_csv
        @room = Room.find(params[:room_id])
        seats = @room.seats
        require 'csv'

        csv_data = CSV.generate(headers: true) do |csv|
          csv << ['ラベル', 'X', 'Y', '着席中', '氏名', '登録日時']
          seats.each do |s|
            csv << [s.label, s.x, s.y, s.occupied ? '着席' : '空席', s.occupant_name, s.created_at]
          end
        end

        send_data csv_data, filename: "seats_#{@room.name}_#{Date.today}.csv", type: 'text/csv'
      end

      private

      def seat_params
        params.require(:seat).permit(:label, :x, :y, :occupied, :occupant_name)
      end

      def broadcast_room_update(room)
        ActionCable.server.broadcast("room_#{room.id}", {
          type: 'seat_update',
          seat: room.seats.find(params[:id]).as_json
        })
      end
    end
  end
end
