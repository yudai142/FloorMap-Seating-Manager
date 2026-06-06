class RoomsController < ApplicationController
  def index
    @rooms = Room.all
    render inertia: 'Rooms/Index', props: { rooms: @rooms.as_json(only: %i[id name width height]) }
  end

  def show
    @room = Room.find(params[:id])
    render inertia: 'Rooms/Show', props: { room: @room.as_json, seats: @room.seats.as_json }
  end

  def create
    @room = Room.new(room_params)
    if @room.save
      redirect_to rooms_path, notice: 'Room created'
    else
      render inertia: 'Rooms/New', props: { errors: @room.errors.full_messages }
    end
  end

  private

  def room_params
    params.require(:room).permit(:name, :width, :height)
  end
end
