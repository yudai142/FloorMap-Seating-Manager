RailsAdmin.config do |config|
  config.authenticate_with do
    warden.authenticate! scope: :user
  end

  config.authorize_with do
    redirect_to main_app.root_path unless current_user&.admin?
  end

  config.audit_with :paper_trail, 'User', 'PaperTrail::Version'

  config.model 'Room' do
    list do
      field :id
      field :name
      field :width
      field :height
      field :seats_count, :integer
      field :created_at
    end

    show do
      field :id
      field :name
      field :width
      field :height
      field :seats
      field :created_at
      field :updated_at
    end

    edit do
      field :name
      field :width
      field :height
    end
  end

  config.model 'Seat' do
    list do
      field :id
      field :label
      field :room
      field :x
      field :y
      field :occupied
      field :occupant_name
      field :created_at
    end

    show do
      field :id
      field :label
      field :room
      field :x
      field :y
      field :occupied
      field :occupant_name
      field :created_at
      field :updated_at
    end

    edit do
      field :label
      field :room
      field :x
      field :y
      field :occupied
      field :occupant_name
    end
  end

  config.model 'User' do
    list do
      field :id
      field :email
      field :name
      field :role
      field :created_at
    end

    show do
      field :id
      field :email
      field :name
      field :role
      field :created_at
      field :updated_at
    end

    edit do
      field :email
      field :name
      field :role
      field :password
      field :password_confirmation
    end
  end

  config.model 'Notification' do
    list do
      field :id
      field :user
      field :notification_type
      field :title
      field :message
      field :read_at
      field :created_at
    end

    show do
      field :id
      field :user
      field :notification_type
      field :title
      field :message
      field :data
      field :read_at
      field :created_at
    end
  end
end
