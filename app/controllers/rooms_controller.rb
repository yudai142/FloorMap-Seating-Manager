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
      room: @room.as_json(only: %i[id name width height]),
      seats: @room.seats.as_json(only: %i[id x y label occupied occupant_name])
    }
  end

  def create
    authorize Room
    @room = Room.new(room_params)
    if @room.save
      redirect_to rooms_path, notice: '上面図を作成しました'
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

  private

  def set_room
    @room = Room.find(params[:id])
  end

  def room_params
    params.require(:room).permit(:name, :width, :height)
  end
end
