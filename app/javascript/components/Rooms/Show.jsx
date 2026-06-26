import React, { useState, useEffect } from 'react'
import { subscribeToRoom } from '../../channels/room_channel'
import { ErrorAlert, SuccessAlert } from '../ui/Alert'

export default function RoomsShow({ room, seats: initialSeats, current_user }) {
  const [seats, setSeats] = useState(initialSeats)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [nameInput, setNameInput] = useState('')
  const [alert, setAlert] = useState(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}/rooms/${room.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
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
      // 着席済み座席をクリック
      if (current_user && seat.occupant_name === current_user.name) {
        // 自分が着席している場合はチェックアウト
        handleCheckOut(seat)
      }
      // 他のユーザーが着席している場合は何もしない
    } else {
      if (current_user) {
        // ログインユーザー：自動着席（他の座席から移動する場合も対応）
        handleCheckInWithMove(seat, current_user.name)
      } else {
        // 非ログインユーザー：名前入力モーダルを表示
        setSelectedSeat(seat)
        setNameInput('')
        setAlert(null)
      }
    }
  }

  const handleCheckInWithMove = async (seat, name) => {
    setCheckInLoading(true)
    try {
      // 現在のユーザーが他の座席に着席しているか確認
      const currentSeat = seats.find(s => s.occupied && s.occupant_name === name)

      // 着席している座席がある場合はチェックアウト
      if (currentSeat) {
        console.log('Checking out from seat:', currentSeat)
        const checkOutResponse = await fetch(`/seats/${currentSeat.id}/check_out`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          }
        })

        console.log('Check-out response:', { status: checkOutResponse.status, ok: checkOutResponse.ok })

        if (!checkOutResponse.ok) {
          const errorData = await checkOutResponse.text()
          console.error('Check-out error response:', errorData)
          throw new Error(`前の座席からのチェックアウトに失敗しました (${checkOutResponse.status}): ${errorData}`)
        }

        // 前の座席をチェックアウト状態に更新
        setSeats(prev => prev.map(s =>
          s.id === currentSeat.id
            ? { ...s, occupied: false, occupant_name: null }
            : s
        ))
      }

      // 新しい座席にチェックイン
      const checkInResponse = await fetch(`/seats/${seat.id}/check_in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ occupant_name: name })
      })

      console.log('Check-in response:', { status: checkInResponse.status, ok: checkInResponse.ok })

      if (!checkInResponse.ok) {
        const errorData = await checkInResponse.text()
        console.error('Check-in error response:', errorData)
        throw new Error(`エラー: ${checkInResponse.status}`)
      }

      setSeats(prev => prev.map(s =>
        s.id === seat.id
          ? { ...s, occupied: true, occupant_name: name }
          : s
      ))
      const message = currentSeat
        ? `${name}さんが座席 ${seat.label} に移動しました`
        : `${name}さんが座席 ${seat.label} に着席しました`
      setAlert({ type: 'success', message })
      setTimeout(() => setAlert(null), 2000)
    } catch (err) {
      console.error('Check-in/move error caught:', err)
      setAlert({ type: 'error', message: err.message || 'チェックインに失敗しました。もう一度お試しください。' })
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleCheckInWithName = async (seat, name) => {
    setCheckInLoading(true)
    try {
      const response = await fetch(`/seats/${seat.id}/check_in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ occupant_name: name })
      })

      console.log('Check-in response:', { status: response.status, ok: response.ok })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Check-in error response:', errorData)
        throw new Error(`エラー: ${response.status}`)
      }

      setSeats(prev => prev.map(s =>
        s.id === seat.id
          ? { ...s, occupied: true, occupant_name: name }
          : s
      ))
      setAlert({ type: 'success', message: `${name}さんがチェックインしました` })
      setTimeout(() => setAlert(null), 2000)
    } catch (err) {
      console.error('Check-in error caught:', err)
      setAlert({ type: 'error', message: 'チェックインに失敗しました。もう一度お試しください。' })
    } finally {
      setCheckInLoading(false)
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
          <div className="fixed top-4 left-4 right-4 z-50 max-w-md">
            {alert.type === 'error' ? (
              <ErrorAlert
                message={alert.message}
                onDismiss={() => setAlert(null)}
              />
            ) : (
              <SuccessAlert
                message={alert.message}
                onDismiss={() => setAlert(null)}
              />
            )}
          </div>
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
                    {room.shapes_data && Array.isArray(room.shapes_data) && room.shapes_data.map((shape) => {
                      if (shape.type === 'line') {
                        return (
                          <line
                            key={shape.id}
                            x1={shape.x1}
                            y1={shape.y1}
                            x2={shape.x2}
                            y2={shape.y2}
                            stroke="#6366f1"
                            strokeWidth="2"
                            pointerEvents="none"
                          />
                        )
                      } else if (shape.type === 'rectangle') {
                        return (
                          <rect
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            width={shape.width}
                            height={shape.height}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="2"
                            pointerEvents="none"
                          />
                        )
                      } else if (shape.type === 'circle') {
                        return (
                          <circle
                            key={shape.id}
                            cx={shape.cx}
                            cy={shape.cy}
                            r={shape.r}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                            pointerEvents="none"
                          />
                        )
                      } else if (shape.type === 'arrow') {
                        const headlen = 15
                        const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1)
                        return (
                          <g key={shape.id} pointerEvents="none">
                            <line
                              x1={shape.x1}
                              y1={shape.y1}
                              x2={shape.x2}
                              y2={shape.y2}
                              stroke="#ec4899"
                              strokeWidth="2"
                            />
                            <polygon
                              points={`${shape.x2},${shape.y2} ${shape.x2 - headlen * Math.cos(angle - Math.PI / 6)},${shape.y2 - headlen * Math.sin(angle - Math.PI / 6)} ${shape.x2 - headlen * Math.cos(angle + Math.PI / 6)},${shape.y2 - headlen * Math.sin(angle + Math.PI / 6)}`}
                              fill="#ec4899"
                            />
                          </g>
                        )
                      } else if (shape.type === 'text') {
                        return (
                          <text
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            fontSize="14"
                            fill="#1e293b"
                            pointerEvents="none"
                          >
                            {shape.text}
                          </text>
                        )
                      } else if (shape.type === 'polygon') {
                        return (
                          <polygon
                            key={shape.id}
                            points={shape.points}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="2"
                            pointerEvents="none"
                          />
                        )
                      }
                      return null
                    })}
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
              <div className="flex flex-col gap-2 mb-4">
                <a href={`/rooms/${room.token}/seats/export_csv`} download className="px-3 py-2 bg-blue-500 text-white text-sm rounded font-medium hover:bg-blue-600 transition-colors text-center">
                  📥 座席情報をダウンロード
                </a>
                <button
                  onClick={handleCopyUrl}
                  className={`px-3 py-2 text-sm rounded font-medium transition-colors ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}>
                  {copied ? '✓ コピーしました' : '🔗 URLをコピー'}
                </button>
              </div>
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
