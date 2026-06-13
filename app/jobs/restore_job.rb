class RestoreJob
  include Sidekiq::Job

  sidekiq_options retry: 1

  def perform(backup_id)
    backup = Backup.find(backup_id)

    Rails.logger.info("Starting database restore from backup: #{backup.name}")

    # S3 からダウンロード
    temp_file = "/tmp/restore_#{backup_id}_#{Time.current.to_i}.sql.gz"
    unless backup.download_from_s3(temp_file)
      notify_failure(backup, 'Failed to download backup file')
      return
    end

    # データベース復旧
    if restore_database(temp_file)
      Rails.logger.info("Database restore completed from backup: #{backup.name}")
      notify_success(backup)

      # Sidekiq キューをクリア
      Sidekiq::Queue.all.each(&:clear)

      # アプリケーションを再起動（systemctl または Docker コンテナ）
      restart_application
    else
      notify_failure(backup, 'Failed to restore database')
    end

    # 一時ファイルを削除
    File.delete(temp_file) if File.exist?(temp_file)
  end

  private

  def restore_database(backup_file)
    db_config = Rails.configuration.database_configuration[Rails.env]
    host = db_config['host'] || 'localhost'
    user = db_config['username']
    password = db_config['password']
    database = db_config['database']

    # バックアップを復旧
    cmd = "gunzip -c #{backup_file} | PGPASSWORD='#{password}' psql -h #{host} -U #{user} #{database}"

    if system(cmd)
      true
    else
      Rails.logger.error("Database restore failed for #{database}")
      false
    end
  end

  def restart_application
    # systemctl を使用する場合
    # system('systemctl restart floormap-app')

    # Docker コンテナの場合
    # system('docker restart floormap-web')

    # または手動で再起動を要求
    Rails.logger.warn('Please restart the application manually to complete the restore process')
  end

  def notify_success(backup)
    User.admin.each do |admin|
      Notification.create_notification(
        admin,
        'restore_completed',
        'データベース復旧が完了しました',
        "バックアップ: #{backup.name} から復旧しました",
        { backup_id: backup.id }
      )
    end
  end

  def notify_failure(backup, error_message)
    User.admin.each do |admin|
      Notification.create_notification(
        admin,
        'restore_failed',
        'データベース復旧が失敗しました',
        "バックアップ: #{backup.name} - #{error_message}",
        { backup_id: backup.id }
      )
    end
  end
end
