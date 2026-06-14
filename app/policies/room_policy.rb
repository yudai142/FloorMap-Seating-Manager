class RoomPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    user.present? && user.manager?
  end

  def update?
    user.present?
  end

  def destroy?
    user.present? && user.admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      @scope.all
    end
  end
end
