require 'shellwords'

class BackupJob
  include Sidekiq::Job

  sidekiq_options retry: 3

  def perform(backup_id = nil)
    backup = backup_id ? Backup.find(backup_id) : create_backup
    return unless backup

    backup.update(status: :in_progress, started_at: Time.current)

    backup_file = generate_backup

    if backup_file && File.exist?(backup_file)
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

    # Escape all parameters to prevent command injection
    escaped_password = Shellwords.escape(password)
    escaped_host = Shellwords.escape(host)
    escaped_user = Shellwords.escape(user)
    escaped_database = Shellwords.escape(database)
    escaped_backup_file = Shellwords.escape(backup_file)

    cmd = "PGPASSWORD=#{escaped_password} pg_dump -h #{escaped_host} -U #{escaped_user} #{escaped_database} | gzip > #{escaped_backup_file}"

    if system(cmd)
      backup_file
    else
      Rails.logger.error("pg_dump failed for #{database}")
      nil
    end
  end

  def notify_success(backup)
    User.admin.each do |admin|
      Notification.create_notification(
        user: admin,
        notification_type: :backup_completed,
        title: 'バックアップ完了',
        message: "バックアップ「#{backup.name}」が正常に完了しました"
      )
    end
  end

  def notify_failure(backup)
    User.admin.each do |admin|
      Notification.create_notification(
        user: admin,
        notification_type: :backup_failed,
        title: 'バックアップ失敗',
        message: "バックアップ「#{backup.name}」が失敗しました: #{backup.error_message}"
      )
    end
  end
end
