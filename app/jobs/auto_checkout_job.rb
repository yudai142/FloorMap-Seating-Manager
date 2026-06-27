class AutoCheckoutJob < ApplicationJob
  queue_as :default

  def perform(seat_id)
    seat = Seat.find_by(id: seat_id)
    return unless seat

    seat.update(occupant_id: nil, occupant_name: nil, auto_checkout_at: nil)

    BroadcastNotificationJob.perform_later(
      seat.room.token,
      {
        type: 'seat_checkout',
        seat_id: seat.id,
        message: "#{seat.label} が自動離席しました"
      }
    )
  end
end
