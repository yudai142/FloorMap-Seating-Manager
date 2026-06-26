import React, { useState, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { subscribeToRoom } from '../../channels/room_channel'
import { ErrorAlert, SuccessAlert } from '../ui/Alert'
import Header from '../Header'

export default function RoomsShow({ room, seats: initialSeats, current_user, visitor_name, is_room_creator: initialIsRoomCreator, has_permission: initialHasPermission, permitted_users: initialPermittedUsers }) {
  const [seats, setSeats] = useState(initialSeats)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [nameInput, setNameInput] = useState('')
  const [alert, setAlert] = useState(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [visitorName, setVisitorName] = useState(visitor_name || '')
  const [confirmCheckOut, setConfirmCheckOut] = useState(null)
  const [permittedUsers, setPermittedUsers] = useState(initialPermittedUsers || [])
  const [revokePermissionUser, setRevokePermissionUser] = useState(null)

  const isRoomCreator = initialIsRoomCreator
  const hasPermission = initialHasPermission
  const canForceCheckout = isRoomCreator || hasPermission

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
      const isOwnSeat = (current_user && seat.occupant_name === current_user.name) ||
                        (!current_user && visitorName && seat.occupant_name === visitorName)

      if (isOwnSeat) {
        // 自分が着席している場合はチェックアウト
        handleCheckOut(seat)
      } else if (canForceCheckout) {
        // ルーム作成者または権限を持つユーザーが他の人の座席をクリック：確認モーダルを表示
        setConfirmCheckOut(seat)
      }
      // 他の人の座席かつルーム作成者でない場合は何もしない
    } else {
      if (current_user) {
        // ログインユーザー：自動着席（他の座席から移動する場合も対応）
        handleCheckInWithMove(seat, current_user.name)
      } else if (visitorName) {
        // 非ログインユーザーでセッションに名前がある場合：自動着席
        handleCheckInWithMove(seat, visitorName)
      } else {
        // 非ログインユーザーでセッションに名前がない場合：名前入力モーダルを表示
        setSelectedSeat(seat)
        setNameInput('')
        setAlert(null)
      }
    }
  }

  const handleCheckInWithMove = async (seat, name) => {
    setCheckInLoading(true)
    setAlert(null)
    let errorOccurred = false
    let errorMessage = ''

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
          errorOccurred = true
          errorMessage = `前の座席からのチェックアウトに失敗しました (${checkOutResponse.status})`
          throw new Error(errorMessage)
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
        console.error('Check-in error response:', { status: checkInResponse.status, body: errorData })
        errorOccurred = true
        errorMessage = `チェックインに失敗しました (${checkInResponse.status})。サーバーログを確認してください。`
        throw new Error(errorMessage)
      }

      // 処理成功：UIを更新
      setSeats(prev => prev.map(s =>
        s.id === seat.id
          ? { ...s, occupied: true, occupant_name: name }
          : s
      ))
    } catch (err) {
      console.error('Check-in/move error caught:', err)
      errorOccurred = true
      if (!errorMessage) {
        errorMessage = err.message || 'チェックインに失敗しました。もう一度お試しください。'
      }
    } finally {
      // 3秒待機してからスピナーを止める
      await new Promise(resolve => setTimeout(resolve, 3000))
      setCheckInLoading(false)

      // 処理完了後にアラートを表示
      if (errorOccurred) {
        setAlert({ type: 'error', message: errorMessage })
      } else {
        const currentSeat = seats.find(s => s.occupied && s.occupant_name === name)
        const message = currentSeat && currentSeat.id !== seat.id
          ? `${name}さんが座席 ${seat.label} に移動しました`
          : `${name}さんが座席 ${seat.label} に着席しました`
        setAlert({ type: 'success', message })
      }
    }
  }

  const handleCheckInWithName = async (seat, name) => {
    setCheckInLoading(true)
    setAlert(null)
    let errorOccurred = false
    let errorMessage = ''

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
        errorOccurred = true
        errorMessage = 'チェックインに失敗しました。もう一度お試しください。'
        throw new Error(errorMessage)
      }

      setSeats(prev => prev.map(s =>
        s.id === seat.id
          ? { ...s, occupied: true, occupant_name: name }
          : s
      ))
      // 非ログインユーザーの場合、セッションの名前を更新
      if (!current_user) {
        setVisitorName(name)
      }
      setSelectedSeat(null)
    } catch (err) {
      console.error('Check-in error caught:', err)
      errorOccurred = true
      if (!errorMessage) {
        errorMessage = err.message || 'チェックインに失敗しました。もう一度お試しください。'
      }
    } finally {
      // 3秒待機してからスピナーを止める
      await new Promise(resolve => setTimeout(resolve, 3000))
      setCheckInLoading(false)

      // 処理完了後にアラートを表示
      if (errorOccurred) {
        setAlert({ type: 'error', message: errorMessage })
      } else {
        setAlert({ type: 'success', message: `${name}さんがチェックインしました` })
      }
    }
  }

  const handleCheckIn = async () => {
    if (!selectedSeat || !nameInput.trim()) {
      setAlert({ type: 'error', message: 'お名前を入力してください' })
      return
    }

    setCheckInLoading(true)
    setAlert(null)
    let errorOccurred = false
    let errorMessage = ''

    try {
      // 名前変更の場合
      if (selectedSeat.id === -1) {
        const response = await fetch(`/rooms/${room.token}/update_visitor_name`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({ visitor_name: nameInput })
        })

        if (!response.ok) {
          errorOccurred = true
          errorMessage = '名前の変更に失敗しました。もう一度お試しください。'
          throw new Error(errorMessage)
        }

        setVisitorName(nameInput)
      } else {
        // 通常のチェックイン
        const response = await fetch(`/seats/${selectedSeat.id}/check_in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({ occupant_name: nameInput })
        })

        if (!response.ok) {
          errorOccurred = true
          errorMessage = 'チェックインに失敗しました。もう一度お試しください。'
          throw new Error(errorMessage)
        }

        setSeats(prev => prev.map(s =>
          s.id === selectedSeat.id
            ? { ...s, occupied: true, occupant_name: nameInput }
            : s
        ))
        // 非ログインユーザーの場合、セッションの名前を更新
        if (!current_user) {
          setVisitorName(nameInput)
        }
      }

      setSelectedSeat(null)
      setNameInput('')
    } catch (err) {
      console.error('Error:', err)
      errorOccurred = true
      if (!errorMessage) {
        errorMessage = 'エラーが発生しました。もう一度お試しください。'
      }
    } finally {
      // 3秒待機してからスピナーを止める
      await new Promise(resolve => setTimeout(resolve, 3000))
      setCheckInLoading(false)

      // 処理完了後にアラートを表示
      if (errorOccurred) {
        setAlert({ type: 'error', message: errorMessage })
      } else {
        if (selectedSeat && selectedSeat.id === -1) {
          setAlert({ type: 'success', message: `名前を${nameInput}さんに変更しました` })
        } else {
          setAlert({ type: 'success', message: `${nameInput}さんがチェックインしました` })
        }
      }
    }
  }

  const handleRevokePermission = async (user) => {
    setCheckInLoading(true)
    setAlert(null)
    let errorOccurred = false
    let errorMessage = ''

    try {
      const response = await fetch(`/rooms/${room.token}/revoke_permission`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ user_id: user.id })
      })

      if (!response.ok) {
        errorOccurred = true
        errorMessage = '権限剥奪に失敗しました。もう一度お試しください。'
        throw new Error(errorMessage)
      }

      setPermittedUsers(prev => prev.filter(u => u.id !== user.id))
    } catch (err) {
      console.error('Revoke permission error:', err)
      errorOccurred = true
      if (!errorMessage) {
        errorMessage = '権限剥奪に失敗しました。もう一度お試しください。'
      }
    } finally {
      // 3秒待機してからスピナーを止める
      await new Promise(resolve => setTimeout(resolve, 3000))
      setCheckInLoading(false)
      setRevokePermissionUser(null)

      // 処理完了後にアラートを表示
      if (errorOccurred) {
        setAlert({ type: 'error', message: errorMessage })
      } else {
        setAlert({ type: 'success', message: `${user.name}さんの権限を剥奪しました` })
      }
    }
  }

  const handleCheckOut = async (seat) => {
    setCheckInLoading(true)
    setAlert(null)
    let errorOccurred = false
    let errorMessage = ''

    try {
      const response = await fetch(`/seats/${seat.id}/check_out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        }
      })

      if (!response.ok) {
        errorOccurred = true
        errorMessage = 'チェックアウトに失敗しました。もう一度お試しください。'
        throw new Error(errorMessage)
      }

      setSeats(prev => prev.map(s =>
        s.id === seat.id
          ? { ...s, occupied: false, occupant_name: null }
          : s
      ))
    } catch (err) {
      console.error('Check-out error:', err)
      errorOccurred = true
      if (!errorMessage) {
        errorMessage = 'チェックアウトに失敗しました。もう一度お試しください。'
      }
    } finally {
      // 3秒待機してからスピナーを止める
      await new Promise(resolve => setTimeout(resolve, 3000))
      setCheckInLoading(false)

      // 処理完了後にアラートを表示
      if (errorOccurred) {
        setAlert({ type: 'error', message: errorMessage })
      } else {
        setAlert({ type: 'success', message: 'チェックアウトしました' })
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentUser={current_user} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <a href="/" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium mb-2 inline-block">
            ← 戻る
          </a>
          <h1 className="text-3xl font-bold text-slate-800">{room.name}</h1>
          <p className="text-slate-500 text-sm mt-1">{room.width} × {room.height}</p>
        </div>

        {checkInLoading && (
          <div className="fixed top-4 left-4 z-50 max-w-md">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-700 font-medium">処理中です...</span>
            </div>
          </div>
        )}

        {!checkInLoading && alert && (
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
          <div className="lg:col-span-3">
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
                  <div className="border border-slate-300 rounded-lg bg-slate-50 overflow-hidden" style={{ maxHeight: '400px', maxWidth: '500px' }}>
                    <TransformWrapper
                      initialScale={1}
                      initialPositionX={0}
                      initialPositionY={0}
                      minScale={0.5}
                      maxScale={3}
                      panning={{ disabled: false }}
                      pinch={{ disabled: false }}
                      wheel={{ disabled: false }}
                    >
                      <TransformComponent>
                        <svg
                          width={Math.min(room.width, 500)}
                          height={Math.min(room.height, 400)}
                          viewBox={`0 0 ${room.width} ${room.height}`}
                          style={{ touchAction: 'none' }}
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
                      </TransformComponent>
                    </TransformWrapper>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 py-12 text-center">
                  上面図の寸法が設定されていません
                </div>
              )}
            </div>
          </div>

          {/* 座席リスト */}
          <div className="lg:col-span-1">
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
                {!current_user && visitorName && (
                  <button
                    onClick={() => {
                      setSelectedSeat(null)
                      setNameInput(visitorName)
                      setTimeout(() => setSelectedSeat({ id: -1, label: '名前変更' }), 0)
                    }}
                    className="px-3 py-2 bg-purple-500 text-white text-sm rounded font-medium hover:bg-purple-600 transition-colors">
                    ✏️ 名前を変更
                  </button>
                )}
              </div>
              {permittedUsers && permittedUsers.length > 0 && (
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">権限ユーザー</h3>
                  <div className="space-y-2">
                    {permittedUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => isRoomCreator && setRevokePermissionUser(user)}
                        className={`p-2 rounded bg-blue-50 border border-blue-200 ${isRoomCreator ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''}`}
                      >
                        <div className="text-sm font-medium text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              {selectedSeat.id === -1 ? '名前を変更' : `${selectedSeat.label} にチェックイン`}
            </h2>
            <p className="text-sm text-slate-500 mb-4">{selectedSeat.id === -1 ? '新しい名前を入力してください' : 'お名前を入力してください'}</p>

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
                {checkInLoading ? (selectedSeat.id === -1 ? '変更中...' : 'チェックイン中...') : (selectedSeat.id === -1 ? '変更' : 'チェックイン')}
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

      {/* 確認モーダル：他の人の座席を離席させるか権限を与えるか */}
      {confirmCheckOut && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmCheckOut(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {confirmCheckOut.label} から {confirmCheckOut.occupant_name} さんに対して
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              どの操作を実行しますか？
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/seats/${confirmCheckOut.id}/check_out`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCsrfToken()
                      },
                      body: JSON.stringify({ force_checkout: true })
                    })

                    if (!response.ok) {
                      throw new Error(`エラー: ${response.status}`)
                    }

                    setSeats(prev => prev.map(s =>
                      s.id === confirmCheckOut.id
                        ? { ...s, occupied: false, occupant_name: null, occupant_id: null }
                        : s
                    ))
                    setAlert({ type: 'success', message: `${confirmCheckOut.occupant_name}さんを離席させました` })
                    setTimeout(() => setAlert(null), 2000)
                  } catch (err) {
                    setAlert({ type: 'error', message: '離席操作に失敗しました' })
                    console.error('Force check-out error:', err)
                  } finally {
                    setConfirmCheckOut(null)
                  }
                }}
                className="py-2 bg-red-500 text-white font-medium rounded-lg
                         hover:bg-red-600 transition-colors">
                離席させる
              </button>
              {isRoomCreator && confirmCheckOut.occupant_id && (
                permittedUsers.some(u => u.id === confirmCheckOut.occupant_id) ? (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/rooms/${room.token}/revoke_permission`, {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': getCsrfToken()
                          },
                          body: JSON.stringify({ user_id: confirmCheckOut.occupant_id })
                        })

                        if (!response.ok) {
                          throw new Error(`エラー: ${response.status}`)
                        }

                        setPermittedUsers(prev => prev.filter(u => u.id !== confirmCheckOut.occupant_id))
                        setAlert({ type: 'success', message: `${confirmCheckOut.occupant_name}さんの権限を剥奪しました` })
                        setTimeout(() => setAlert(null), 2000)
                      } catch (err) {
                        setAlert({ type: 'error', message: '権限剥奪に失敗しました' })
                        console.error('Revoke permission error:', err)
                      } finally {
                        setConfirmCheckOut(null)
                      }
                    }}
                    className="py-2 bg-orange-500 text-white font-medium rounded-lg
                             hover:bg-orange-600 transition-colors">
                    権限を剥奪
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/rooms/${room.token}/grant_permission`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': getCsrfToken()
                          },
                          body: JSON.stringify({ user_id: confirmCheckOut.occupant_id })
                        })

                        if (!response.ok) {
                          throw new Error(`エラー: ${response.status}`)
                        }

                        const user = current_user && current_user.id === confirmCheckOut.occupant_id
                          ? current_user
                          : { id: confirmCheckOut.occupant_id, name: confirmCheckOut.occupant_name, email: '' }
                        setPermittedUsers(prev => [...prev, { id: confirmCheckOut.occupant_id, name: confirmCheckOut.occupant_name, email: '' }])
                        setAlert({ type: 'success', message: `${confirmCheckOut.occupant_name}さんに権限を付与しました` })
                        setTimeout(() => setAlert(null), 2000)
                      } catch (err) {
                        setAlert({ type: 'error', message: '権限付与に失敗しました' })
                        console.error('Grant permission error:', err)
                      } finally {
                        setConfirmCheckOut(null)
                      }
                    }}
                    className="py-2 bg-blue-500 text-white font-medium rounded-lg
                             hover:bg-blue-600 transition-colors">
                    権限を与える
                  </button>
                )
              )}
              <button
                onClick={() => setConfirmCheckOut(null)}
                className="py-2 bg-slate-200 text-slate-700 font-medium rounded-lg
                         hover:bg-slate-300 transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 権限剥奪確認モーダル */}
      {revokePermissionUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setRevokePermissionUser(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              権限を剥奪しますか？
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              <span className="font-medium">{revokePermissionUser.name}</span> さんの権限を剥奪します。この操作は取り消せません。
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleRevokePermission(revokePermissionUser)}
                className="py-2 bg-red-500 text-white font-medium rounded-lg
                         hover:bg-red-600 transition-colors">
                権限を剥奪
              </button>
              <button
                onClick={() => setRevokePermissionUser(null)}
                className="py-2 bg-slate-200 text-slate-700 font-medium rounded-lg
                         hover:bg-slate-300 transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
