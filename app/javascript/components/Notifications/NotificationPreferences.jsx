import React, { useState, useEffect } from 'react'

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const notificationTypeLabels = {
    check_in: 'チェックイン通知',
    check_out: 'チェックアウト通知',
    seat_update: '座席更新通知'
  }

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/notification_preferences')
      const data = await response.json()
      setPreferences(data.preferences)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
      setLoading(false)
    }
  }

  const handleToggle = async (notificationType) => {
    const preference = preferences.find(p => p.notification_type === notificationType)
    const newEnabled = !preference.enabled

    try {
      const response = await fetch(`/notification_preferences/${notificationType}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ notification_type: notificationType, enabled: newEnabled })
      })

      if (response.ok) {
        setPreferences(preferences.map(p =>
          p.notification_type === notificationType ? { ...p, enabled: newEnabled } : p
        ))
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } catch (error) {
      console.error('Failed to update preference:', error)
    }
  }

  if (loading) {
    return <div className="text-slate-500">読み込み中...</div>
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">通知設定</h2>

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          ✓ 設定を保存しました
        </div>
      )}

      <div className="space-y-3">
        {preferences.map(pref => (
          <label key={pref.notification_type} className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={pref.enabled}
              onChange={() => handleToggle(pref.notification_type)}
              className="w-4 h-4 text-cyan-500 rounded cursor-pointer"
            />
            <span className="ml-3 text-slate-700">
              {notificationTypeLabels[pref.notification_type]}
            </span>
          </label>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        チェックを外した通知は受け取りません
      </p>
    </div>
  )
}
