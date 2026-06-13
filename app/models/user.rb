class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :timeoutable, :two_factor_authenticatable

  has_one_time_password

  has_many :notifications, dependent: :destroy
  has_many :notification_preferences, dependent: :destroy

  enum role: { user: 0, manager: 1, admin: 2 }

  validates :name, presence: true

  def admin?
    role == 'admin'
  end

  def manager?
    role == 'manager' || admin?
  end

  def display_name
    name
  end

  def as_json(options = {})
    super(options.merge(only: [:id, :email, :name, :role, :created_at]))
  end
end
