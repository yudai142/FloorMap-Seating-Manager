class SeatsController < ApplicationController
  def create
    @room = Room.find(params[:room_id])
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
    if @seat.update(occupied: true, occupant_name: params[:occupant_name])
      # ブロードキャスト座席更新
      ActionCable.server.broadcast("room_#{@seat.room_id}", {
        type: 'seat_update',
        seat: @seat.as_json(only: %i[id x y label occupied occupant_name])
      })

      # 全ユーザーに通知を送信
      broadcast_notification_to_room(
        @seat.room_id,
        'check_in',
        "#{params[:occupant_name]}さんがチェックインしました",
        "座席 #{@seat.label} にチェックインしました",
        { seat_id: @seat.id, seat_label: @seat.label, occupant_name: params[:occupant_name] }
      )

      render json: @seat.as_json(only: %i[id x y label occupied occupant_name]), status: :ok
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def check_out
    @seat = Seat.find(params[:id])
    occupant_name = @seat.occupant_name
    if @seat.update(occupied: false, occupant_name: nil)
      # ブロードキャスト座席更新
      ActionCable.server.broadcast("room_#{@seat.room_id}", {
        type: 'seat_update',
        seat: @seat.as_json(only: %i[id x y label occupied occupant_name])
      })

      # 全ユーザーに通知を送信
      broadcast_notification_to_room(
        @seat.room_id,
        'check_out',
        "#{occupant_name}さんがチェックアウトしました",
        "座席 #{@seat.label} からチェックアウトしました",
        { seat_id: @seat.id, seat_label: @seat.label, occupant_name: occupant_name }
      )

      render json: @seat.as_json(only: %i[id x y label occupied occupant_name]), status: :ok
    else
      render json: { errors: @seat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def seat_params
    params.require(:seat).permit(:label, :x, :y, :occupied, :occupant_name)
  end

  def broadcast_notification_to_room(room_id, type, title, message, data)
    room = Room.find(room_id)
    # すべてのユーザーに通知を送信
    User.find_each do |user|
      notification = Notification.create_notification(
        user,
        type,
        title,
        message,
        data
      )
      # WebSocket で通知をブロードキャスト
      ActionCable.server.broadcast("user_#{user.id}", {
        type: 'notification',
        notification: notification.as_json
      })
    end
  end
end
