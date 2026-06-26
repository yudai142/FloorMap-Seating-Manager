class RoomsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:show]
  before_action :set_room, only: [:show]

  def index
    authorize Room
    @q = current_user.rooms.ransack(params[:q])

    @rooms = @q.result.order(:created_at).page(params[:page]).per(20)

    render inertia: 'Rooms/Index', props: {
      rooms: @rooms.as_json(only: %i[id name width height token]),
      errors: [],
      can_create: policy(Room).create?,
      pagination: {
        current_page: @rooms.current_page,
        total_pages: @rooms.total_pages,
        total_count: @rooms.total_count
      },
      search_query: params[:q],
      current_user: current_user&.as_json(only: %i[id name email])
    }
  end

  def show
    # 非ログインユーザーもアクセス可能（token で room 検証済み）
    is_room_creator = current_user&.id == @room.user_id
    has_permission = current_user && @room.room_permissions.exists?(user_id: current_user.id)
    permitted_users = @room.permitted_users.as_json(only: %i[id name email])

    render inertia: 'Rooms/Show', props: {
      room: @room.as_json(only: %i[id name width height shapes_data token user_id]),
      seats: @room.seats.as_json(only: %i[id x y label occupied occupant_name occupant_id]),
      current_user: current_user&.as_json(only: %i[id name email]),
      visitor_name: session[:visitor_name],
      is_room_creator: is_room_creator,
      has_permission: has_permission,
      permitted_users: permitted_users
    }
  end

  def create
    authorize Room
    @room = Room.new(room_params)
    @room.user_id = current_user.id
    if @room.save
      redirect_to rooms_path, status: :see_other
    else
      @q = current_user.rooms.ransack(params[:q])
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
      @room = Room.find_by!(token: params[:token])
      authorize @room
      if @room.update(room_params)
        render json: @room.as_json(only: %i[id name width height shapes_data token]), status: :ok
      else
        render json: { errors: @room.errors.messages }, status: :unprocessable_entity
      end
    rescue Pundit::NotAuthorizedError
      render json: { error: '権限がありません' }, status: :forbidden
    rescue ActiveRecord::RecordNotFound
      render json: { error: '上面図が見つかりません' }, status: :not_found
    end
  end

  def update_visitor_name
    # 非ログインユーザーのみが使用可能
    if current_user.present?
      render json: { error: 'ログインユーザーは使用できません' }, status: :forbidden
      return
    end

    visitor_name = params[:visitor_name]&.strip
    if visitor_name.blank?
      render json: { error: '名前を入力してください' }, status: :unprocessable_entity
      return
    end

    session[:visitor_name] = visitor_name
    render json: { visitor_name: visitor_name }, status: :ok
  end

  def grant_permission
    begin
      @room = Room.find_by!(token: params[:token])
      unless current_user&.id == @room.user_id
        render json: { error: '権限がありません' }, status: :forbidden
        return
      end

      user_id = params[:user_id]
      if user_id.blank?
        render json: { error: 'ユーザーIDが必要です' }, status: :unprocessable_entity
        return
      end

      permission = @room.room_permissions.find_or_create_by(user_id: user_id)
      render json: { message: '権限を付与しました' }, status: :ok
    rescue ActiveRecord::RecordNotFound
      render json: { error: '上面図が見つかりません' }, status: :not_found
    end
  end

  def revoke_permission
    begin
      @room = Room.find_by!(token: params[:token])
      unless current_user&.id == @room.user_id
        render json: { error: '権限がありません' }, status: :forbidden
        return
      end

      user_id = params[:user_id]
      if user_id.blank?
        render json: { error: 'ユーザーIDが必要です' }, status: :unprocessable_entity
        return
      end

      @room.room_permissions.find_by(user_id: user_id)&.destroy
      render json: { message: '権限を剥奪しました' }, status: :ok
    rescue ActiveRecord::RecordNotFound
      render json: { error: '上面図が見つかりません' }, status: :not_found
    end
  end

  private

  def set_room
    @room = Room.find_by!(token: params[:token])
  end

  def room_params
    params.require(:room).permit(
      :name, :width, :height, :floor_plan_image,
      shapes_data: [:id, :type, :x, :y, :x1, :y1, :x2, :y2, :cx, :cy, :r, :width, :height, :text, :points, :pointsArray]
    )
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
