class EditorsController < ApplicationController
  def show
    @rooms = Room.all
    if defined?(InertiaRails)
      render inertia: 'Editor/Canvas', props: { rooms: @rooms.as_json(only: %i[id name width height]) }
    else
      render template: 'rooms/index'
    end
  end
end
