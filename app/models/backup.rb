class Backup < ApplicationRecord
  enum status: { pending: 'pending', in_progress: 'in_progress', completed: 'completed', failed: 'failed' }
  enum backup_type: { automatic: 'automatic', manual: 'manual' }

  scope :recent, -> { order(created_at: :desc) }
  scope :successful, -> { where(status: :completed) }
  scope :failed, -> { where(status: :failed) }

  validates :name, :status, :backup_type, presence: true

  # S3 にアップロード
  def upload_to_s3(file_path)
    return unless File.exist?(file_path)

    s3 = Aws::S3::Client.new
    file_size = File.size(file_path)
    file = File.open(file_path, 'rb')

    s3_key = "backups/#{name}-#{Time.current.to_i}.sql.gz"

    s3.put_object(
      bucket: ENV.fetch('AWS_S3_BUCKET', 'floormap-backups'),
      key: s3_key,
      body: file,
      server_side_encryption: 'AES256'
    )

    update(
      s3_key: s3_key,
      size_bytes: file_size,
      status: :completed,
      completed_at: Time.current
    )

    file.close
    File.delete(file_path)

    true
  rescue StandardError => e
    update(
      status: :failed,
      error_message: e.message,
      completed_at: Time.current
    )
    false
  end

  # S3 からダウンロード
  def download_from_s3(destination_path)
    return false unless s3_key

    s3 = Aws::S3::Client.new

    File.open(destination_path, 'wb') do |file|
      s3.get_object(
        bucket: ENV.fetch('AWS_S3_BUCKET', 'floormap-backups'),
        key: s3_key
      ) do |chunk|
        file.write(chunk)
      end
    end

    true
  rescue StandardError => e
    Rails.logger.error("Failed to download backup: #{e.message}")
    false
  end

  # バックアップサイズを MB で返す
  def size_mb
    return 0 unless size_bytes
    (size_bytes.to_f / 1024 / 1024).round(2)
  end

  def as_json(options = {})
    super(options.merge(
      only: [:id, :name, :status, :backup_type, :size_bytes, :created_at, :completed_at],
      methods: [:size_mb]
    ))
  end
end
