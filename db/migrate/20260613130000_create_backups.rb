class CreateBackups < ActiveRecord::Migration[8.1]
  def change
    create_table :backups do |t|
      t.string :name, null: false
      t.string :status, null: false, default: 'pending'  # pending, in_progress, completed, failed
      t.text :description
      t.integer :size_bytes
      t.string :s3_key
      t.string :backup_type, null: false, default: 'automatic'  # automatic, manual
      t.datetime :started_at
      t.datetime :completed_at
      t.text :error_message

      t.timestamps
    end

    add_index :backups, :status
    add_index :backups, :backup_type
    add_index :backups, :created_at
  end
end
