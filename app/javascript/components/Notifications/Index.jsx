import React, { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react'

export default function NotificationsIndex() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/notifications')
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notification) => {
    try {
      const response = await fetch(`/notifications/${notification.id}/mark_as_read`, {
        method: 'PATCH',
        headers: {
          'X-CSRF-Token': getCsrfToken()
        }
      })

      if (response.ok) {
        loadNotifications()
      }
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const handleDelete = async (notification) => {
    if (!confirm('この通知を削除しますか？')) return

    try {
      const response = await fetch(`/notifications/${notification.id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': getCsrfToken()
        }
      })

      if (response.ok) {
        loadNotifications()
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/notifications/mark_all_as_read', {
        method: 'PATCH',
        headers: {
          'X-CSRF-Token': getCsrfToken()
        }
      })

      if (response.ok) {
        loadNotifications()
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium mb-2 inline-block">
              ← 戻る
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">通知</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-600 mt-1">
                {unreadCount}件の未読通知があります
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-cyan-500 text-white text-sm rounded font-medium hover:bg-cyan-600 transition-colors"
            >
              すべてを既読にする
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">読み込み中...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
            <p className="text-slate-600">通知はまだありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border shadow-sm p-4 ${
                  notification.read_at
                    ? 'bg-white border-slate-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">
                      {notification.title}
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(notification.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!notification.read_at && (
                      <button
                        onClick={() => handleMarkAsRead(notification)}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        既読
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification)}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
