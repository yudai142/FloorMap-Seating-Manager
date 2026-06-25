class EditorsController < ApplicationController
  def show
    @rooms = Room.all
    @room = params[:room_id].present? ? Room.find(params[:room_id]) : @rooms.first
    render inertia: 'Editor/Canvas', props: {
      rooms: @rooms.as_json(only: %i[id name width height]),
      room: @room&.as_json(only: %i[id name width height shapes_data]),
      initialSeats: @room&.seats&.as_json(only: %i[id x y label]) || []
    }
  end
end
