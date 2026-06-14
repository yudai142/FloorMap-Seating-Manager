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
    total_seats = Seat.count
    return 0 if total_seats.zero?
    
    (Seat.where(occupied: true).count.to_f / total_seats * 100).round(2)
  end
  
  def check_ins_by_day
    Seat.where(occupied: true)
        .group_by { |s| s.updated_at.to_date }
        .map { |date, seats| { date: date, count: seats.count } }
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
