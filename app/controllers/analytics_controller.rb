class AnalyticsController < ApplicationController
  def index
    authorize :analytics

    render inertia: 'Analytics/Dashboard', props: {
      occupancy_rate: calculate_occupancy_rate,
      check_ins_by_day: check_ins_by_day,
      top_seats: top_seats_by_occupancy
    }
  end

  private

  def calculate_occupancy_rate
    total, occupied = Seat.pick(
      Arel.sql('COUNT(*), SUM(CASE WHEN occupied THEN 1 ELSE 0 END)')
    )
    return 0 if total.zero?

    (occupied.to_f / total * 100).round(2)
  end

  def check_ins_by_day
    Notification
      .where(notification_type: 'check_in', created_at: 7.days.ago..)
      .group("DATE(created_at)")
      .count
      .map { |date, count| { date: date, count: count } }
      .sort_by { |d| d[:date] }
  end

  def top_seats_by_occupancy
    Seat.joins(:room)
        .select('seats.label, seats.id, rooms.name, COUNT(*) as occupancy_count')
        .where(occupied: true)
        .group('seats.id, seats.label, rooms.name')
        .order('occupancy_count DESC')
        .limit(10)
  end
end
