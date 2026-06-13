class BackupsController < ApplicationController
  before_action :require_admin!

  def index
    authorize Backup
    @backups = Backup.recent.limit(100)
    render json: {
      backups: @backups.as_json,
      total_count: Backup.count,
      last_backup: Backup.successful.first&.as_json
    }
  end

  def create
    authorize Backup
    # 手動バックアップをキュー
    BackupJob.perform_async(nil)

    render json: {
      success: true,
      message: 'バックアップをキューに追加しました'
    }
  end

  def restore
    authorize Backup
    @backup = Backup.find(params[:id])

    unless @backup.completed?
      return render json: { error: 'バックアップが完了していません' }, status: :unprocessable_entity
    end

    # 復旧ジョブをキュー
    RestoreJob.perform_async(@backup.id)

    render json: {
      success: true,
      message: 'データベース復旧をキューに追加しました'
    }
  end

  def download
    @backup = Backup.find(params[:id])
    authorize @backup

    unless @backup.completed?
      return render json: { error: 'バックアップファイルが利用できません' }, status: :unprocessable_entity
    end

    # ローカルに一時ダウンロード
    temp_file = "/tmp/#{@backup.name}.sql.gz"
    unless @backup.download_from_s3(temp_file)
      return render json: { error: 'ダウンロード失敗' }, status: :internal_server_error
    end

    send_file temp_file, filename: "#{@backup.name}.sql.gz", type: 'application/gzip'
  end

  private

  def require_admin!
    return if current_user&.admin?
    render json: { error: '管理者権限が必要です' }, status: :forbidden
  end
end
