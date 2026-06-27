class SeatsController < ApplicationController
  before_action :authenticate_user!, only: [:create, :update, :destroy]
  before_action :set_room, only: [:create]
  before_action :set_seat, only: [:update, :check_in, :check_out, :destroy]

  def create
    @seat = @room.seats.build(seat_params)
    if @seat.save
      render json: @seat.as_json(only: %i[id x y label occupied occupant_name]), status: :created
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @seat = Seat.find(params[:id])
    if @seat.update(seat_params)
      render json: @seat.as_json(only: %i[id x y label occupied occupant_name]), status: :ok
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def check_in
    @seat = Seat.find(params[:id])
    update_attrs = { occupied: true, occupant_name: check_in_params[:occupant_name] }
    update_attrs[:occupant_id] = current_user.id if current_user
    update_attrs[:auto_checkout_at] = check_in_params[:auto_checkout_at] if check_in_params[:auto_checkout_at]

    if @seat.update(update_attrs)
      # 非ログインユーザーの場合、セッションに名前を保存
      session[:visitor_name] = check_in_params[:occupant_name] if current_user.nil?

      # 自動離席をスケジュール
      @seat.schedule_auto_checkout if @seat.has_auto_checkout?

      # ブロードキャスト座席更新（Redis が利用可能な場合のみ）
      begin
        ActionCable.server.broadcast("room_#{@seat.room_id}", {
          type: 'seat_update',
          seat: @seat.as_json(only: %i[id x y label occupied occupant_name auto_checkout_at])
        })
      rescue => e
        Rails.logger.error("ActionCable broadcast failed: #{e.message}")
      end

      # 全ユーザーに通知を非同期で送信（Sidekiq が利用可能な場合のみ）
      begin
        BroadcastNotificationJob.perform_async(
          @seat.room_id,
          'check_in',
          "#{params[:occupant_name]}さんがチェックインしました",
          "座席 #{@seat.label} にチェックインしました",
          { 'seat_id' => @seat.id, 'seat_label' => @seat.label, 'occupant_name' => params[:occupant_name] }
        )
      rescue => e
        # Sidekiq job の失敗はログするが、レスポンスには影響しない
        Rails.logger.error("BroadcastNotificationJob failed: #{e.message}")
      end

      render json: @seat.as_json(only: %i[id x y label occupied occupant_name auto_checkout_at]), status: :ok
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def check_out
    @seat = Seat.find(params[:id])
    occupant_name = @seat.occupant_name
    is_force_checkout = params[:force_checkout].present?

    # 権限チェック
    if is_force_checkout
      # 強制離席：ルーム作成者または権限を持つユーザーのみ可能
      is_room_creator = current_user&.id == @seat.room.user_id
      is_permitted = current_user && @seat.room.room_permissions.exists?(user_id: current_user.id)

      unless is_room_creator || is_permitted
        render json: { error: '権限がありません' }, status: :forbidden
        return
      end
    else
      # 通常の離席：自分が着席している座席のみ離席可能
      if current_user
        # ログインユーザー：自分の名前で着席している座席のみ離席可能
        unless @seat.occupant_name == current_user.name
          render json: { error: '権限がありません' }, status: :forbidden
          return
        end
      else
        # 非ログインユーザー：セッションの名前と一致する座席のみ離席可能
        unless @seat.occupant_name == session[:visitor_name]
          render json: { error: '権限がありません' }, status: :forbidden
          return
        end
      end
    end

    if @seat.update(occupied: false, occupant_name: nil, occupant_id: nil)
      # ブロードキャスト座席更新（Redis が利用可能な場合のみ）
      begin
        ActionCable.server.broadcast("room_#{@seat.room_id}", {
          type: 'seat_update',
          seat: @seat.as_json(only: %i[id x y label occupied occupant_name])
        })
      rescue => e
        Rails.logger.error("ActionCable broadcast failed: #{e.message}")
      end

      # 全ユーザーに通知を非同期で送信（Sidekiq が利用可能な場合のみ）
      begin
        BroadcastNotificationJob.perform_async(
          @seat.room_id,
          'check_out',
          "#{occupant_name}さんがチェックアウトしました",
          "座席 #{@seat.label} からチェックアウトしました",
          { 'seat_id' => @seat.id, 'seat_label' => @seat.label, 'occupant_name' => occupant_name }
        )
      rescue => e
        # Sidekiq job の失敗はログするが、レスポンスには影響しない
        Rails.logger.error("BroadcastNotificationJob failed: #{e.message}")
      end

      render json: @seat.as_json(only: %i[id x y label occupied occupant_name]), status: :ok
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @seat.destroy
    render json: { id: @seat.id }, status: :ok
  end

  private

  def set_room
    @room = current_user.rooms.find_by!(token: params[:room_token])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '上面図が見つかりません' }, status: :not_found
  end

  def set_seat
    @seat = Seat.find(params[:id])
    # check_in と check_out は非ログインユーザーもアクセス可能
    unless %w[check_in check_out].include?(action_name)
      unless current_user&.id == @seat.room.user_id
        render json: { error: '権限がありません' }, status: :forbidden
      end
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: '座席が見つかりません' }, status: :not_found
  end

  def seat_params
    params.require(:seat).permit(:label, :x, :y, :occupied, :occupant_name)
  end

  def check_in_params
    params.permit(:occupant_name, :auto_checkout_at)
  end

  def export_csv
    @room = Room.find(params[:room_id])
    seats = @room.seats

    require 'csv'
    csv_data = CSV.generate(headers: true) do |csv|
      csv << ['ラベル', 'X', 'Y', '着席中', '氏名', '登録日時']
      seats.each do |s|
        csv << [s.label, s.x, s.y, s.occupied ? '着席' : '空席', s.occupant_name, s.created_at]
      end
    end

    send_data csv_data, filename: "seats_#{@room.name}_#{Date.today}.csv", type: 'text/csv'
  end
end
