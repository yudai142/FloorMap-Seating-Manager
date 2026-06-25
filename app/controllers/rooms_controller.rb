class RoomsController < ApplicationController
  skip_before_action :authenticate_user!, only: []
  before_action :set_room, only: [:show]

  def index
    authorize Room
    @q = Room.ransack(params[:q])

    @rooms = @q.result.order(:created_at).page(params[:page]).per(20)

    render inertia: 'Rooms/Index', props: {
      rooms: @rooms.as_json(only: %i[id name width height]),
      errors: [],
      can_create: policy(Room).create?,
      pagination: {
        current_page: @rooms.current_page,
        total_pages: @rooms.total_pages,
        total_count: @rooms.total_count
      },
      search_query: params[:q]
    }
  end

  def show
    authorize @room
    render inertia: 'Rooms/Show', props: {
      room: @room.as_json(only: %i[id name width height shapes_data]),
      seats: @room.seats.as_json(only: %i[id x y label occupied occupant_name])
    }
  end

  def create
    authorize Room
    @room = Room.new(room_params)
    if @room.save
      redirect_to rooms_path, status: :see_other
    else
      @q = Room.ransack(params[:q])
      @rooms = @q.result.order(:created_at).page(params[:page]).per(20)

      render inertia: 'Rooms/Index', props: {
        rooms: @rooms.as_json(only: %i[id name width height]),
        errors: @room.errors.messages,
        can_create: policy(Room).create?,
        pagination: {
          current_page: @rooms.current_page,
          total_pages: @rooms.total_pages,
          total_count: @rooms.total_count
        },
        search_query: params[:q]
      }, status: :unprocessable_entity
    end
  end

  def update
    begin
      @room = Room.find(params[:id])
      authorize @room
      if @room.update(room_params)
        render json: @room.as_json(only: %i[id name width height shapes_data]), status: :ok
      else
        render json: { errors: @room.errors.messages }, status: :unprocessable_entity
      end
    rescue Pundit::NotAuthorizedError
      render json: { error: '権限がありません' }, status: :forbidden
    rescue ActiveRecord::RecordNotFound
      render json: { error: '上面図が見つかりません' }, status: :not_found
    end
  end

  private

  def set_room
    @room = Room.find(params[:id])
  end

  def room_params
    # For shapes_data, we need to accept all nested attributes since shapes vary in structure
    # Use a custom approach to allow arbitrary nested hashes
    permitted = params.require(:room).permit(:name, :width, :height, :floor_plan_image)

    # Handle shapes_data separately to allow arbitrary nested structures
    if params[:room][:shapes_data].present?
      permitted[:shapes_data] = params[:room][:shapes_data]
    end

    permitted
  end

  def export_csv
    authorize Room
    @rooms = Room.includes(:seats).all

    require 'csv'
    csv_data = CSV.generate(headers: true, encoding: 'UTF-8') do |csv|
      csv << ['ルーム名', '幅 (px)', '高さ (px)', '座席数', '着席数', '空席数', '登録日時']
      @rooms.each do |room|
        occupied_count = room.seats.where(occupied: true).count
        empty_count = room.seats.where(occupied: false).count
        csv << [room.name, room.width, room.height, room.seats.count, occupied_count, empty_count, room.created_at]
      end
    end

    send_data csv_data, filename: "rooms_#{Date.today}.csv", type: 'text/csv; charset=utf-8'
  end
end
