import React, { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const { auth } = usePage().props

  useEffect(() => {
    if (!auth.user) return

    // 初期状態を読み込む
    fetchNotifications()

    // WebSocket 接続
    subscribeToNotifications()
  }, [auth.user])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/notifications')
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const subscribeToNotifications = () => {
    if (!window.consumer) return

    const subscription = window.consumer.subscriptions.create(
      { channel: 'NotificationChannel' },
      {
        connected() {
          console.log('Connected to NotificationChannel')
        },
        disconnected() {
          console.log('Disconnected from NotificationChannel')
        },
        received(data) {
          if (data.type === 'notification') {
            // 新しい通知を追加
            setNotifications([data.notification, ...notifications])
            setUnreadCount((prev) => prev + 1)
          } else if (data.type === 'notification_read') {
            // 通知を既読にする
            setNotifications(
              notifications.map((n) =>
                n.id === data.notification.id ? data.notification : n
              )
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
          } else if (data.type === 'all_notifications_read') {
            // すべての通知を既読にする
            setNotifications(
              notifications.map((n) => ({ ...n, read_at: new Date().toISOString() }))
            )
            setUnreadCount(0)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`/notifications/${notificationId}/mark_as_read`, {
        method: 'PATCH'
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/notifications/mark_all_as_read', {
        method: 'PATCH'
      })
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <div className="relative">
      {/* ベルアイコン */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ドロップダウン */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">通知</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-cyan-600 hover:text-cyan-700"
                >
                  すべて既読
                </button>
              )}
            </div>
          </div>

          {/* 通知一覧 */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>通知はありません</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                    notification.read_at ? 'opacity-75' : 'bg-cyan-50'
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{notification.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(notification.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <div className="ml-2 w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* フッター */}
          <div className="p-3 border-t border-slate-200 text-center">
            <a href="/notifications" className="text-sm text-cyan-600 hover:text-cyan-700">
              すべて表示
            </a>
          </div>
        </div>
      )}

      {/* クローズ時にドロップダウンを閉じる */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  )
}
