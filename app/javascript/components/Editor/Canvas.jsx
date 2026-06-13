import React, { useState, useRef } from 'react'
import { router } from '@inertiajs/react'
import { ErrorAlert, SuccessAlert } from '../ui/Alert'

export default function Canvas({ rooms, room, initialSeats }) {
  const [currentRoom, setCurrentRoom] = useState(room)
  const [seats, setSeats] = useState(initialSeats || [])
  const [dragging, setDragging] = useState(null)
  const [alert, setAlert] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const svgRef = useRef(null)

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  const handleRoomChange = (e) => {
    const newRoomId = e.target.value
    router.visit(`/editor?room_id=${newRoomId}`, { preserveState: false })
  }

  const handleCanvasClick = async (e) => {
    if (dragging || !currentRoom || isCreating) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    const newLabel = `S${seats.length + 1}`

    setIsCreating(true)
    try {
      const response = await fetch(`/rooms/${currentRoom.id}/seats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ seat: { label: newLabel, x, y } })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errors?.[0] || '座席の追加に失敗しました')
      }

      const newSeat = await response.json()
      setSeats([...seats, newSeat])
      setAlert({ type: 'success', message: `${newLabel} を追加しました` })
      setTimeout(() => setAlert(null), 2000)
    } catch (err) {
      setAlert({ type: 'error', message: err.message })
      console.error('Seat creation error:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSeatMouseDown = (e, seat) => {
    e.stopPropagation()
    if (isCreating) return
    const rect = svgRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - seat.x
    const offsetY = e.clientY - rect.top - seat.y
    setDragging({ id: seat.id, offsetX, offsetY })
  }

  const handleMouseMove = (e) => {
    if (!dragging || !svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragging.offsetX, currentRoom.width))
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragging.offsetY, currentRoom.height))

    setSeats(seats.map(s =>
      s.id === dragging.id ? { ...s, x: Math.round(newX), y: Math.round(newY) } : s
    ))
  }

  const handleMouseUp = async (e) => {
    if (!dragging) return

    const seat = seats.find(s => s.id === dragging.id)
    if (seat) {
      try {
        const response = await fetch(`/rooms/${currentRoom.id}/seats/${seat.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({ seat: { x: seat.x, y: seat.y } })
        })

        if (!response.ok) {
          throw new Error('座席の位置を保存できませんでした')
        }
      } catch (err) {
        setAlert({ type: 'error', message: err.message })
        console.error('Seat update error:', err)
      }
    }

    setDragging(null)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <a href="/" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium mb-2 inline-block">
            ← 戻る
          </a>
          <h1 className="text-3xl font-bold text-slate-800">上面図エディタ</h1>
          <p className="text-slate-500 text-sm mt-1">座席をクリックして追加、ドラッグして移動</p>
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

        <div className="mb-6">
          <label htmlFor="room-select" className="block text-sm font-medium text-slate-700 mb-2">
            編集する上面図
          </label>
          <select
            id="room-select"
            value={currentRoom?.id || ''}
            onChange={handleRoomChange}
            disabled={isCreating || dragging}
            className="px-3 py-2 border border-slate-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-cyan-400
                     disabled:bg-slate-100 disabled:text-slate-500">
            {rooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.width}×{r.height})
              </option>
            ))}
          </select>
        </div>

        {currentRoom ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <svg
              ref={svgRef}
              width={currentRoom.width}
              height={currentRoom.height}
              className="border border-slate-300 rounded-lg bg-slate-50 w-full max-w-2xl"
              style={{
                cursor: dragging ? 'grabbing' : isCreating ? 'wait' : 'crosshair',
                userSelect: 'none'
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {seats.map((seat) => (
                <g
                  key={seat.id}
                  transform={`translate(${seat.x}, ${seat.y})`}
                  onMouseDown={(e) => handleSeatMouseDown(e, seat)}
                  style={{ cursor: isCreating ? 'wait' : 'grab' }}
                >
                  <circle r="12" fill="#4ade80" stroke="#065f46" strokeWidth="2" />
                  <text
                    x="16"
                    y="4"
                    fontSize="12"
                    fill="#000"
                    style={{ pointerEvents: 'none' }}
                  >
                    {seat.label}
                  </text>
                </g>
              ))}
            </svg>
            <p className="text-sm text-slate-500 mt-4">
              {isCreating && <span className="text-cyan-600 font-medium">● 追加中...</span>}
              {!isCreating && (
                <>
                  {seats.length} 個の座席 • ドラッグで移動、マウスアップで自動保存
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-6 py-8 text-center">
            <p className="text-amber-700">上面図を選択してください</p>
          </div>
        )}
      </div>
    </div>
  )
}
