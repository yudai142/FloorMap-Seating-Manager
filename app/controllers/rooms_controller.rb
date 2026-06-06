class RoomsController < ApplicationController
  def index
    @rooms = Room.all
    if defined?(InertiaRails)
      render inertia: 'Rooms/Index', props: { rooms: @rooms.as_json(only: %i[id name width height]) }
    else
      render template: 'rooms/index'
    end
  end

  def show
    @room = Room.find(params[:id])
    if defined?(InertiaRails)
      render inertia: 'Rooms/Show', props: { room: @room.as_json, seats: @room.seats.as_json }
    else
      render template: 'rooms/show'
    end
  end

  def create
    @room = Room.new(room_params)
    if @room.save
      redirect_to rooms_path, notice: 'Room created'
    else
      if defined?(InertiaRails)
        render inertia: 'Rooms/New', props: { errors: @room.errors.full_messages }
      else
        render template: 'rooms/new'
      end
    end
  end

  private

  def room_params
    params.require(:room).permit(:name, :width, :height)
  end
end
