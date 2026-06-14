class InvitationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_invitation, only: [:accept, :confirm, :destroy]

  def index
    authorize Invitation
    @invitations = Invitation.pending.order(created_at: :desc)
    render inertia: 'User/Invitations', props: {
      invitations: @invitations.as_json
    }
  end

  def create
    authorize Invitation
    @invitation = Invitation.new(invitation_params)
    @invitation.invited_by = current_user

    if @invitation.save
      NotificationMailer.invitation_email(@invitation).deliver_later
      redirect_to invitations_path, notice: '招待メールを送信しました'
    else
      redirect_to invitations_path, alert: '招待の作成に失敗しました'
    end
  end

  def accept
    if @invitation.expired?
      redirect_to root_path, alert: '招待の有効期限が切れています'
    else
      render inertia: 'User/InvitationAccept', props: {
        invitation: @invitation.as_json,
        token: @invitation.token
      }
    end
  end

  def confirm
    if @invitation.expired?
      redirect_to root_path, alert: '招待の有効期限が切れています'
      return
    end

    user = User.create(invitation_confirm_params)
    if user.valid?
      @invitation.update(accepted_at: Time.current)
      sign_in user
      redirect_to root_path, notice: 'アカウントが作成されました'
    else
      redirect_to invitation_accept_path(@invitation.token), alert: user.errors.full_messages.join(', ')
    end
  end

  def destroy
    authorize @invitation
    @invitation.destroy
    redirect_to invitations_path, notice: '招待を削除しました'
  end

  private

  def set_invitation
    @invitation = Invitation.find_by(token: params[:id])
    redirect_to root_path, alert: '招待が見つかりません' unless @invitation
  end

  def invitation_params
    params.require(:invitation).permit(:email, :role)
  end

  def invitation_confirm_params
    params.require(:user).permit(:email, :name, :password, :password_confirmation).merge(role: @invitation.role)
  end
end
