class RoomsController < ApplicationController
  def index
    @rooms = Room.all
    render inertia: 'Rooms/Index', props: {
      rooms: @rooms.as_json(only: %i[id name width height]),
      errors: []
    }
  end

  def show
    @room = Room.find(params[:id])
    render inertia: 'Rooms/Show', props: {
      room: @room.as_json(only: %i[id name width height]),
      seats: @room.seats.as_json(only: %i[id x y label occupied occupant_name])
    }
  end

  def create
    @room = Room.new(room_params)
    if @room.save
      redirect_to rooms_path, notice: 'Room created'
    else
      render inertia: 'Rooms/Index', props: {
        rooms: Room.all.as_json(only: %i[id name width height]),
        errors: @room.errors.full_messages
      }
    end
  end

  private

  def room_params
    params.require(:room).permit(:name, :width, :height)
  end
end
