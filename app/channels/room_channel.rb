class RoomChannel < ApplicationCable::Channel
  # params: { room: room_id }
  def subscribed
    return reject unless params[:room].present?
    stream_from "room_#{params[:room]}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
