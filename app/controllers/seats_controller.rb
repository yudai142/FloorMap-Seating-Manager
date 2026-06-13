class SeatsController < ApplicationController
  def create
    @room = Room.find(params[:room_id])
    @seat = @room.seats.build(seat_params)
    if @seat.save
      render json: @seat.as_json(only: %i[id x y label occupied occupant_name]), status: :created
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @seat = Seat.find(params[:id])
    if @seat.update(seat_params)
      render json: @seat.as_json(only: %i[id x y label occupied occupant_name]), status: :ok
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def check_in
    @seat = Seat.find(params[:id])
    if @seat.update(occupied: true, occupant_name: params[:occupant_name])
      ActionCable.server.broadcast("room_#{@seat.room_id}", { type: 'seat_update', seat: @seat.as_json(only: %i[id x y label occupied occupant_name]) })
      head :no_content
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def check_out
    @seat = Seat.find(params[:id])
    if @seat.update(occupied: false, occupant_name: nil)
      ActionCable.server.broadcast("room_#{@seat.room_id}", { type: 'seat_update', seat: @seat.as_json(only: %i[id x y label occupied occupant_name]) })
      head :no_content
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def seat_params
    params.require(:seat).permit(:label, :x, :y, :occupied, :occupant_name)
  end
end
