class EditorsController < ApplicationController
  def show
    @rooms = current_user.rooms
    @room = params[:room_token].present? ? current_user.rooms.find_by!(token: params[:room_token]) : @rooms.first

    render inertia: 'Editor/Canvas', props: {
      rooms: @rooms.as_json(only: %i[id name width height token]),
      room: @room&.as_json(only: %i[id name width height shapes_data token]),
      initialSeats: @room&.seats&.as_json(only: %i[id x y label]) || []
    }
  rescue ActiveRecord::RecordNotFound
    redirect_to root_path, alert: '上面図が見つかりません'
  end
end
