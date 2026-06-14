class AnalyticsPolicy < ApplicationPolicy
  def index?
    user.admin? || user.manager?
  end
end
