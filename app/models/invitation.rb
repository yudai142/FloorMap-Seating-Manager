class Invitation < ApplicationRecord
  belongs_to :invited_by, class_name: 'User'
  
  validates :email, :token, :role, presence: true
  validates :token, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  enum role: { user: 0, manager: 1, admin: 2 }
  
  before_create :generate_token
  
  scope :pending, -> { where(accepted_at: nil) }
  scope :expired, -> { where('expires_at < ?', Time.current) }
  
  private
  
  def generate_token
    self.token = SecureRandom.hex(16)
    self.expires_at = 7.days.from_now
  end
end
