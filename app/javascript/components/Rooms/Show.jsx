import React, { useState, useEffect } from 'react'
import { subscribeToRoom } from '../../channels/room_channel'
import { ErrorAlert, SuccessAlert } from '../ui/Alert'

export default function RoomsShow({ room, seats: initialSeats }) {
  const [seats, setSeats] = useState(initialSeats)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [nameInput, setNameInput] = useState('')
  const [alert, setAlert] = useState(null)
  const [checkInLoading, setCheckInLoading] = useState(false)

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  useEffect(() => {
    const sub = subscribeToRoom(room.id, (data) => {
      if (data.type === 'seat_update') {
        setSeats(prev => prev.map(s => s.id === data.seat.id ? data.seat : s))
      }
    })
    return () => sub.unsubscribe()
  }, [room.id])

  const handleSeatClick = (seat) => {
    if (seat.occupied) {
      handleCheckOut(seat)
    } else {
      setSelectedSeat(seat)
      setNameInput('')
      setAlert(null)
    }
  }

  const handleCheckIn = async () => {
    if (!selectedSeat || !nameInput.trim()) {
      setAlert({ type: 'error', message: 'お名前を入力してください' })
      return
    }

    setCheckInLoading(true)
    try {
      const response = await fetch(`/seats/${selectedSeat.id}/check_in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ occupant_name: nameInput })
      })

      if (!response.ok) {
        throw new Error(`エラー: ${response.status}`)
      }

      setSeats(prev => prev.map(s =>
        s.id === selectedSeat.id
          ? { ...s, occupied: true, occupant_name: nameInput }
          : s
      ))
      setAlert({ type: 'success', message: `${nameInput}さんがチェックインしました` })
      setSelectedSeat(null)
      setNameInput('')
      setTimeout(() => setAlert(null), 2000)
    } catch (err) {
      setAlert({ type: 'error', message: 'チェックインに失敗しました。もう一度お試しください。' })
      console.error('Check-in error:', err)
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleCheckOut = async (seat) => {
    try {
      const response = await fetch(`/seats/${seat.id}/check_out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        }
      })

      if (!response.ok) {
        throw new Error(`エラー: ${response.status}`)
      }

      setSeats(prev => prev.map(s =>
        s.id === seat.id
          ? { ...s, occupied: false, occupant_name: null }
          : s
      ))
      setAlert({ type: 'success', message: 'チェックアウトしました' })
      setTimeout(() => setAlert(null), 2000)
    } catch (err) {
      setAlert({ type: 'error', message: 'チェックアウトに失敗しました。もう一度お試しください。' })
      console.error('Check-out error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <a href="/" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium mb-2 inline-block">
            ← 戻る
          </a>
          <h1 className="text-3xl font-bold text-slate-800">{room.name}</h1>
          <p className="text-slate-500 text-sm mt-1">{room.width} × {room.height}</p>
        </div>

        {alert && (
          alert.type === 'error' ? (
            <ErrorAlert
              message={alert.message}
              onDismiss={() => setAlert(null)}
            />
          ) : (
            <SuccessAlert
              message={alert.message}
              onDismiss={() => setAlert(null)}
            />
          )
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* SVGキャンバス */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              {room.width > 0 && room.height > 0 ? (
                <div>
                  <div className="mb-3 flex items-center gap-4 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-400"></div>
                      <span className="text-sm text-slate-600">空席</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-400"></div>
                      <span className="text-sm text-slate-600">着席中</span>
                    </div>
                  </div>
                  <svg
                    width={Math.min(room.width, 500)}
                    height={Math.min(room.height, 400)}
                    className="border border-slate-300 rounded-lg bg-slate-50"
                    viewBox={`0 0 ${room.width} ${room.height}`}
                  >
                    {seats.map((seat) => (
                      <g
                        key={seat.id}
                        transform={`translate(${seat.x}, ${seat.y})`}
                        onClick={() => handleSeatClick(seat)}
                        className="cursor-pointer"
                      >
                        <circle
                          r="12"
                          fill={seat.occupied ? '#f87171' : '#4ade80'}
                          stroke="#333"
                          strokeWidth="1"
                        />
                        <text
                          x="16"
                          y="4"
                          fontSize="10"
                          fill="#000"
                          className="pointer-events-none"
                        >
                          {seat.label}
                        </text>
                        {seat.occupied && (
                          <text
                            x="16"
                            y="14"
                            fontSize="8"
                            fill="#666"
                            className="pointer-events-none"
                          >
                            {seat.occupant_name}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                </div>
              ) : (
                <div className="text-slate-500 py-12 text-center">
                  上面図の寸法が設定されていません
                </div>
              )}
            </div>
          </div>

          {/* 座席リスト */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">座席一覧</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {seats.map((s) => (
                  <div key={s.id}
                    onClick={() => handleSeatClick(s)}
                    className={`p-2 rounded cursor-pointer transition-colors
                             hover:bg-slate-100 border-l-4 ${
                      s.occupied ? 'border-red-400' : 'border-green-400'
                    }`}>
                    <div className="text-sm font-medium text-slate-800">{s.label}</div>
                    <div className="text-xs text-slate-500">({s.x}, {s.y})</div>
                    {s.occupied && (
                      <div className="text-xs text-red-600 font-medium mt-1">{s.occupant_name}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* チェックインモーダル */}
      {selectedSeat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !checkInLoading && setSelectedSeat(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">
              {selectedSeat.label} にチェックイン
            </h2>
            <p className="text-sm text-slate-500 mb-4">お名前を入力してください</p>

            {alert && (
              alert.type === 'error' ? (
                <ErrorAlert
                  message={alert.message}
                  onDismiss={() => setAlert(null)}
                />
              ) : (
                <SuccessAlert
                  message={alert.message}
                  onDismiss={() => setAlert(null)}
                />
              )
            )}

            <input
              type="text"
              placeholder="名前"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !checkInLoading && handleCheckIn()}
              disabled={checkInLoading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4
                       focus:outline-none focus:ring-2 focus:ring-cyan-400
                       disabled:bg-slate-100 disabled:text-slate-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleCheckIn}
                disabled={checkInLoading}
                className="flex-1 py-2 bg-green-500 text-white font-medium rounded-lg
                         hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2">
                {checkInLoading && (
                  <span className="inline-block animate-spin">⟳</span>
                )}
                {checkInLoading ? 'チェックイン中...' : 'チェックイン'}
              </button>
              <button
                onClick={() => setSelectedSeat(null)}
                disabled={checkInLoading}
                className="flex-1 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg
                         hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
