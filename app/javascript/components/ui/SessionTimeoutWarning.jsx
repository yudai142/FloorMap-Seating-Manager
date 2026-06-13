import React, { useState, useEffect } from 'react'
import { usePage, router } from '@inertiajs/react'

export default function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(null)
  const { auth } = usePage().props

  const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 hours
  const WARNING_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

  useEffect(() => {
    if (!auth.user) return

    let inactivityTimer
    let warningTimer
    let countdownInterval

    const resetTimers = () => {
      clearTimeout(inactivityTimer)
      clearTimeout(warningTimer)
      clearInterval(countdownInterval)
      setShowWarning(false)
      setRemainingTime(null)

      // Set inactivity timer
      inactivityTimer = setTimeout(() => {
        router.post('/users/sign_out')
      }, SESSION_TIMEOUT_MS)

      // Set warning timer (show 5 minutes before timeout)
      warningTimer = setTimeout(() => {
        setShowWarning(true)
        setRemainingTime(5 * 60) // 5 minutes in seconds

        // Start countdown
        countdownInterval = setInterval(() => {
          setRemainingTime((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }, SESSION_TIMEOUT_MS - WARNING_THRESHOLD_MS)
    }

    resetTimers()

    // Reset timers on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handleActivity = () => {
      resetTimers()
    }

    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    return () => {
      clearTimeout(inactivityTimer)
      clearTimeout(warningTimer)
      clearInterval(countdownInterval)
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [auth.user])

  const handleExtendSession = async () => {
    try {
      await fetch('/users/sign_in', { method: 'GET' })
      setShowWarning(false)
      setRemainingTime(null)
    } catch (error) {
      console.error('Failed to extend session:', error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            セッションがもうすぐ切れます
          </h2>
          <p className="text-slate-600">
            セキュリティのため、{remainingTime ? formatTime(remainingTime) : '5:00'} で自動的にログアウトします。
          </p>
        </div>

        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-center text-2xl font-bold text-amber-600">
            {remainingTime ? formatTime(remainingTime) : '5:00'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExtendSession}
            className="flex-1 py-3 bg-cyan-500 text-white font-semibold rounded-lg
                     hover:bg-cyan-600 transition-colors"
          >
            セッションを延長
          </button>
          <button
            onClick={() => router.post('/users/sign_out')}
            className="flex-1 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg
                     hover:bg-slate-300 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}
