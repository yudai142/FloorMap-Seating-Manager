class BackupPolicy < ApplicationPolicy
  def index?
    user.admin? || user.manager?
  end

  def create?
    user.admin? || user.manager?
  end

  def restore?
    user.admin?
  end

  def download?
    user.admin? || user.manager?
  end
end
