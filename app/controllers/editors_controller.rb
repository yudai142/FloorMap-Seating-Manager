class EditorsController < ApplicationController
  def show
    @rooms = Room.all
    render inertia: 'Editor/Canvas', props: { rooms: @rooms.as_json(only: %i[id name width height]) }
  end
end
