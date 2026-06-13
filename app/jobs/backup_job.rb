class BackupJob
  include Sidekiq::Job

  sidekiq_options retry: 3

  def perform(backup_id = nil)
    # 手動バックアップの場合
    backup = backup_id ? Backup.find(backup_id) : create_backup

    return unless backup

    backup.update(status: :in_progress, started_at: Time.current)

    # バックアップファイルを生成
    backup_file = generate_backup

    if backup_file && File.exist?(backup_file)
      # S3 にアップロード
      if backup.upload_to_s3(backup_file)
        Rails.logger.info("Backup completed: #{backup.name}")
        notify_success(backup)
      else
        Rails.logger.error("Backup upload failed: #{backup.name}")
        notify_failure(backup)
      end
    else
      backup.update(
        status: :failed,
        error_message: 'Failed to generate backup file',
        completed_at: Time.current
      )
      notify_failure(backup)
    end
  end

  private

  def create_backup
    Backup.create(
      name: "backup-#{Time.current.strftime('%Y%m%d-%H%M%S')}",
      backup_type: :automatic,
      description: 'Automatic daily backup'
    )
  end

  def generate_backup
    db_config = Rails.configuration.database_configuration[Rails.env]
    timestamp = Time.current.strftime('%Y%m%d_%H%M%S')
    backup_file = "/tmp/floormap_backup_#{timestamp}.sql.gz"

    host = db_config['host'] || 'localhost'
    user = db_config['username']
    password = db_config['password']
    database = db_config['database']

    # pg_dump コマンド実行
    cmd = "PGPASSWORD='#{password}' pg_dump -h #{host} -U #{user} #{database} | gzip > #{backup_file}"

    if system(cmd)
      backup_file
    else
      Rails.logger.error("pg_dump failed for #{database}")
      nil
    end
  end

  def notify_success(backup)
    # 管理者に通知
    User.admin.each do |admin|
      Notification.create_notification(
        admin,
        'backup_completed',
        'バックアップが完了しました',
        "バックアップ: #{backup.name} (#{backup.size_mb} MB)",
        { backup_id: backup.id }
      )
    end
  end

  def notify_failure(backup)
    # 管理者にエラー通知
    User.admin.each do |admin|
      Notification.create_notification(
        admin,
        'backup_failed',
        'バックアップが失敗しました',
        "バックアップ: #{backup.name} - #{backup.error_message}",
        { backup_id: backup.id }
      )
    end
  end
end
