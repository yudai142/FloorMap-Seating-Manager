require 'shellwords'

class RestoreJob
  include Sidekiq::Job

  sidekiq_options retry: 3

  def perform(backup_id)
    backup = Backup.find(backup_id)
    return unless backup

    backup.update(status: :in_progress, started_at: Time.current)

    backup_file = backup.download_from_s3
    return unless backup_file

    if restore_database(backup_file)
      backup.update(status: :completed, completed_at: Time.current)
      Rails.logger.info("Database restored from #{backup.name}")
      notify_success(backup)
    else
      backup.update(
        status: :failed,
        error_message: 'Failed to restore database',
        completed_at: Time.current
      )
      notify_failure(backup)
    end
  ensure
    File.delete(backup_file) if backup_file && File.exist?(backup_file)
  end

  private

  def restore_database(backup_file)
    db_config = Rails.configuration.database_configuration[Rails.env]

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

    cmd = "gunzip -c #{escaped_backup_file} | PGPASSWORD=#{escaped_password} psql -h #{escaped_host} -U #{escaped_user} #{escaped_database}"

    system(cmd)
  rescue => e
    Rails.logger.error("Database restore error: #{e.message}")
    false
  end

  def notify_success(backup)
    User.admin.each do |admin|
      Notification.create_notification(
        user: admin,
        notification_type: :restore_completed,
        title: 'リストア完了',
        message: "バックアップ「#{backup.name}」からのリストアが完了しました"
      )
    end
  end

  def notify_failure(backup)
    User.admin.each do |admin|
      Notification.create_notification(
        user: admin,
        notification_type: :restore_failed,
        title: 'リストア失敗',
        message: "バックアップ「#{backup.name}」からのリストアが失敗しました"
      )
    end
  end
end
