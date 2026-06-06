class SeatsController < ApplicationController
  def create
    @room = Room.find(params[:room_id])
    @seat = @room.seats.build(seat_params)
    if @seat.save
      redirect_to room_path(@room), notice: 'Seat created'
    else
      render inertia: 'Rooms/Show', props: { room: @room.as_json, seats: @room.seats.as_json, errors: @seat.errors.full_messages }
    end
  end

  def update
    @seat = Seat.find(params[:id])
    if @seat.update(seat_params)
      redirect_to room_path(@seat.room), notice: 'Seat updated'
    else
      render inertia: 'Rooms/Show', props: { room: @seat.room.as_json, seats: @seat.room.seats.as_json, errors: @seat.errors.full_messages }
    end
  end

  def check_in
    @seat = Seat.find(params[:id])
    @seat.update(occupied: true)
    head :no_content
  end

  def check_out
    @seat = Seat.find(params[:id])
    @seat.update(occupied: false)
    head :no_content
  end

  private

  def seat_params
    params.require(:seat).permit(:label, :x, :y, :occupied)
  end
end
