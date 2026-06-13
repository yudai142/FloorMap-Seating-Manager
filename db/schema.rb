# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_13_062103) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "rooms", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "height", default: 0, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.integer "width", default: 0, null: false
  end

  create_table "seats", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "label", null: false
    t.string "occupant_name"
    t.boolean "occupied", default: false, null: false
    t.bigint "room_id", null: false
    t.datetime "updated_at", null: false
    t.integer "x", default: 0, null: false
    t.integer "y", default: 0, null: false
    t.index ["room_id"], name: "index_seats_on_room_id"
  end

  add_foreign_key "seats", "rooms"
end
