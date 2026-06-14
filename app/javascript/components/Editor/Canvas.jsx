import React, { useState, useRef } from 'react'
import { router } from '@inertiajs/react'
import { ErrorAlert, SuccessAlert } from '../ui/Alert'

export default function Canvas({ rooms, room, initialSeats }) {
  const [currentRoom, setCurrentRoom] = useState(room)
  const [seats, setSeats] = useState(initialSeats || [])
  const [shapes, setShapes] = useState([])
  const [dragging, setDragging] = useState(null)
  const [alert, setAlert] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [tool, setTool] = useState('seat')
  const [drawingStart, setDrawingStart] = useState(null)
  const [preview, setPreview] = useState(null)
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

    if (tool === 'seat') {
      await handleAddSeat(x, y)
    } else if (tool === 'line') {
      handleLineStart(x, y)
    } else if (tool === 'rectangle') {
      handleRectStart(x, y)
    } else if (tool === 'delete') {
      handleDeleteShape(x, y)
    }
  }

  const handleDeleteShape = (x, y) => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i]
      const tolerance = 10

      if (shape.type === 'line') {
        const distance = distanceToLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2)
        if (distance < tolerance) {
          setShapes(shapes.filter((_, idx) => idx !== i))
          setAlert({ type: 'success', message: '直線を削除しました' })
          setTimeout(() => setAlert(null), 2000)
          return
        }
      } else if (shape.type === 'rectangle') {
        if (
          x >= shape.x && x <= shape.x + shape.width &&
          y >= shape.y && y <= shape.y + shape.height
        ) {
          setShapes(shapes.filter((_, idx) => idx !== i))
          setAlert({ type: 'success', message: '四角形を削除しました' })
          setTimeout(() => setAlert(null), 2000)
          return
        }
      }
    }
    setAlert({ type: 'error', message: '図形をクリックしてください' })
    setTimeout(() => setAlert(null), 2000)
  }

  const distanceToLine = (px, py, x1, y1, x2, y2) => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleAddSeat = async (x, y) => {
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

  const handleLineStart = (x, y) => {
    setDrawingStart({ x, y })
  }

  const handleLineEnd = (x, y) => {
    if (!drawingStart) return
    const newLine = {
      id: `line-${Date.now()}`,
      type: 'line',
      x1: drawingStart.x,
      y1: drawingStart.y,
      x2: x,
      y2: y
    }
    setShapes([...shapes, newLine])
    setDrawingStart(null)
    setPreview(null)
    setAlert({ type: 'success', message: '直線を追加しました' })
    setTimeout(() => setAlert(null), 2000)
  }

  const handleRectStart = (x, y) => {
    setDrawingStart({ x, y })
  }

  const handleRectEnd = (x, y) => {
    if (!drawingStart) return
    const newRect = {
      id: `rect-${Date.now()}`,
      type: 'rectangle',
      x: Math.min(drawingStart.x, x),
      y: Math.min(drawingStart.y, y),
      width: Math.abs(x - drawingStart.x),
      height: Math.abs(y - drawingStart.y)
    }
    setShapes([...shapes, newRect])
    setDrawingStart(null)
    setPreview(null)
    setAlert({ type: 'success', message: '四角形を追加しました' })
    setTimeout(() => setAlert(null), 2000)
  }

  const handleSeatMouseDown = async (e, seat) => {
    e.stopPropagation()
    if (isCreating) return

    if (tool === 'delete') {
      await handleDeleteSeat(seat)
      return
    }

    const rect = svgRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - seat.x
    const offsetY = e.clientY - rect.top - seat.y
    setDragging({ id: seat.id, offsetX, offsetY })
  }

  const handleDeleteSeat = async (seat) => {
    try {
      const response = await fetch(`/rooms/${currentRoom.id}/seats/${seat.id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': getCsrfToken()
        }
      })

      if (!response.ok) {
        throw new Error('座席の削除に失敗しました')
      }

      setSeats(seats.filter(s => s.id !== seat.id))
      setAlert({ type: 'success', message: `${seat.label} を削除しました` })
      setTimeout(() => setAlert(null), 2000)
    } catch (err) {
      setAlert({ type: 'error', message: err.message })
      console.error('Seat deletion error:', err)
    }
  }

  const handleMouseMove = (e) => {
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)

    if (dragging) {
      const newX = Math.max(0, Math.min(x - dragging.offsetX, currentRoom.width))
      const newY = Math.max(0, Math.min(y - dragging.offsetY, currentRoom.height))

      setSeats(seats.map(s =>
        s.id === dragging.id ? { ...s, x: Math.round(newX), y: Math.round(newY) } : s
      ))
    } else if (drawingStart) {
      if (tool === 'line') {
        setPreview({
          type: 'line',
          x1: drawingStart.x,
          y1: drawingStart.y,
          x2: x,
          y2: y
        })
      } else if (tool === 'rectangle') {
        setPreview({
          type: 'rectangle',
          x: Math.min(drawingStart.x, x),
          y: Math.min(drawingStart.y, y),
          width: Math.abs(x - drawingStart.x),
          height: Math.abs(y - drawingStart.y)
        })
      }
    }
  }

  const handleMouseUp = async (e) => {
    if (dragging) {
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
    } else if (drawingStart && tool) {
      const rect = svgRef.current.getBoundingClientRect()
      const x = Math.round(e.clientX - rect.left)
      const y = Math.round(e.clientY - rect.top)

      if (tool === 'line') {
        handleLineEnd(x, y)
      } else if (tool === 'rectangle') {
        handleRectEnd(x, y)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <a href="/" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium mb-2 inline-block">
            ← 戻る
          </a>
          <h1 className="text-3xl font-bold text-slate-800">上面図エディタ</h1>
          <p className="text-slate-500 text-sm mt-1">ツールを選択して、キャンバスをクリック・ドラッグして描画、削除ツールで不要な要素を削除</p>
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
            disabled={isCreating || dragging || drawingStart || tool === 'delete'}
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

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setTool('seat')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tool === 'seat'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}>
            座席追加
          </button>
          <button
            onClick={() => setTool('line')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tool === 'line'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}>
            直線
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tool === 'rectangle'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}>
            四角形
          </button>
          <button
            onClick={() => setTool('delete')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tool === 'delete'
                ? 'bg-red-500 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}>
            削除
          </button>
        </div>

        {currentRoom ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <svg
              ref={svgRef}
              width={currentRoom.width}
              height={currentRoom.height}
              className={`border border-slate-300 rounded-lg bg-slate-50 w-full max-w-2xl select-none ${
                dragging ? 'cursor-grabbing' : isCreating ? 'cursor-wait' : 'cursor-crosshair'
              }`}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {shapes.map((shape) => (
                shape.type === 'line' ? (
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
                ) : (
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
              ))}

              {preview && (
                preview.type === 'line' ? (
                  <line
                    x1={preview.x1}
                    y1={preview.y1}
                    x2={preview.x2}
                    y2={preview.y2}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    pointerEvents="none"
                  />
                ) : (
                  <rect
                    x={preview.x}
                    y={preview.y}
                    width={preview.width}
                    height={preview.height}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    pointerEvents="none"
                  />
                )
              )}

              {seats.map((seat) => (
                <g
                  key={seat.id}
                  transform={`translate(${seat.x}, ${seat.y})`}
                  onMouseDown={(e) => handleSeatMouseDown(e, seat)}
                  className={isCreating ? 'cursor-wait' : 'cursor-grab'}
                >
                  <circle r="12" fill="#4ade80" stroke="#065f46" strokeWidth="2" />
                  <text
                    x="16"
                    y="4"
                    fontSize="12"
                    fill="#000"
                    className="pointer-events-none"
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
