import React, { useState, useRef, useEffect } from 'react'
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
  const [skipNextClick, setSkipNextClick] = useState(false)
  const [drawMode, setDrawMode] = useState('click')
  const [polygonPoints, setPolygonPoints] = useState([])
  const [textInput, setTextInput] = useState(null)
  const [roomSizeInput, setRoomSizeInput] = useState({ width: 0, height: 0 })
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const svgRef = useRef(null)
  const svgContainerRef = useRef(null)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    if (currentRoom) {
      setRoomSizeInput({ width: currentRoom.width, height: currentRoom.height })
      const loadedShapes = currentRoom.shapes_data && Array.isArray(currentRoom.shapes_data) ? currentRoom.shapes_data : []
      setShapes(loadedShapes)
      setHistory([{ seats, shapes: loadedShapes }])
      setHistoryIndex(0)
    }
  }, [currentRoom?.id])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      if (!resizeStart || !svgContainerRef.current) return

      const pageX = e.clientX + window.scrollX
      const pageY = e.clientY + window.scrollY

      const deltaX = pageX - resizeStart.pageX
      const deltaY = pageY - resizeStart.pageY

      let newWidth = resizeStart.width
      let newHeight = resizeStart.height

      if (resizeStart.direction === 'horizontal' || resizeStart.direction === 'both') {
        newWidth = Math.max(100, resizeStart.width + deltaX)
      }
      if (resizeStart.direction === 'vertical' || resizeStart.direction === 'both') {
        newHeight = Math.max(100, resizeStart.height + deltaY)
      }

      setRoomSizeInput({ width: newWidth, height: newHeight })

      // オートスクロール：マウスが画面端に到達したらスクロール
      if (scrollContainerRef.current) {
        let scrollX = 0
        let scrollY = 0
        const maxScrollSpeed = 20

        // 上方向：画面上端到達またはビューポート外
        if (e.clientY <= 0) {
          scrollY = -maxScrollSpeed
        }
        // 下方向：画面下端到達またはビューポート外
        else if (e.clientY >= window.innerHeight) {
          scrollY = maxScrollSpeed
        }

        // 左方向：画面左端到達またはビューポート外
        if (e.clientX <= 0) {
          scrollX = -maxScrollSpeed
        }
        // 右方向：画面右端到達またはビューポート外
        else if (e.clientX >= window.innerWidth) {
          scrollX = maxScrollSpeed
        }

        if (scrollX !== 0 || scrollY !== 0) {
          scrollContainerRef.current.scrollLeft += scrollX
          scrollContainerRef.current.scrollTop += scrollY
        }
      }
    }

    const handleMouseUp = async () => {
      setIsResizing(false)
      setResizeStart(null)

      if (currentRoom && (roomSizeInput.width !== currentRoom.width || roomSizeInput.height !== currentRoom.height)) {
        await handleRoomSizeUpdate()
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeStart, roomSizeInput, currentRoom])

  const handleResizeStart = (e, direction) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      pageX: e.clientX + window.scrollX,
      pageY: e.clientY + window.scrollY,
      width: roomSizeInput.width,
      height: roomSizeInput.height,
      direction: direction
    })
  }

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.1))
  }

  const handleZoomReset = () => {
    setZoom(1)
  }

  const saveToHistory = (newSeats, newShapes) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ seats: newSeats, shapes: newShapes })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const { seats: previousSeats, shapes: previousShapes } = history[newIndex]
      setSeats(previousSeats)
      setShapes(previousShapes)
      setHistoryIndex(newIndex)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const { seats: nextSeats, shapes: nextShapes } = history[newIndex]
      setSeats(nextSeats)
      setShapes(nextShapes)
      setHistoryIndex(newIndex)
    }
  }

  const handleSaveShapes = async () => {
    console.log('📝 handleSaveShapes called')
    console.log('  currentRoom:', currentRoom)
    console.log('  shapes:', shapes)

    if (!currentRoom) {
      setAlert({ type: 'error', message: 'ルームが選択されていません' })
      return
    }

    try {
      const payload = { room: { shapes_data: shapes } }
      console.log('📤 Sending payload:', payload)

      const response = await fetch(`/rooms/${currentRoom.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify(payload)
      })

      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error:', errorText)
        throw new Error('図形の保存に失敗しました')
      }

      const responseData = await response.json()
      console.log('✅ Response data:', responseData)
      setCurrentRoom(responseData)
      setAlert({ type: 'success', message: '図形を保存しました' })
      setTimeout(() => setAlert(null), 2000)
    } catch (err) {
      setAlert({ type: 'error', message: err.message })
      console.error('Shape save error:', err)
    }
  }

  const handleRoomSizeUpdate = async () => {
    if (!currentRoom || !roomSizeInput.width || !roomSizeInput.height) {
      console.warn('Validation failed: missing room or size input')
      return
    }

    setIsUpdatingRoom(true)
    try {
      const payload = { room: { width: roomSizeInput.width, height: roomSizeInput.height } }
      console.log('Updating room size:', { roomId: currentRoom.id, payload })

      const response = await fetch(`/rooms/${currentRoom.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', {
        contentType: response.headers.get('content-type'),
        ok: response.ok
      })

      const responseText = await response.text()
      console.log('Response text:', responseText)

      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        console.error('JSON parse failed:', e.message)
        throw new Error(`サーバーエラー (${response.status}): JSON解析失敗`)
      }

      console.log('Response data:', responseData)

      if (!response.ok) {
        const errorMsg = responseData.error || responseData.errors?.[0] || '上面図のサイズ更新に失敗しました'
        throw new Error(errorMsg)
      }

      console.log('Updated room successfully:', responseData)
      setCurrentRoom(responseData)
      setRoomSizeInput({ width: responseData.width, height: responseData.height })
      setAlert({ type: 'success', message: 'サイズを更新しました' })
      setTimeout(() => setAlert(null), 2000)
    } catch (err) {
      console.error('Room size update error:', err.message)
      setAlert({ type: 'error', message: err.message })
      setTimeout(() => setAlert(null), 3000)
    } finally {
      setIsUpdatingRoom(false)
    }
  }

  const handleRoomChange = (e) => {
    const newRoomToken = e.target.value
    router.visit(`/editor?room_token=${newRoomToken}`, { preserveState: false })
  }

  const handleCanvasClick = async (e) => {
    if (dragging || !currentRoom || isCreating) return

    // ドラッグモードではクリックイベントをスキップ
    if (drawMode === 'drag' && (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool === 'arrow')) {
      return
    }

    // 前の描画が完了したばかりならスキップ
    if (skipNextClick) {
      setSkipNextClick(false)
      return
    }

    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)

    if (tool === 'seat') {
      await handleAddSeat(x, y)
    } else if (tool === 'line') {
      handleLineStart(x, y)
    } else if (tool === 'rectangle') {
      handleRectStart(x, y)
    } else if (tool === 'circle') {
      handleCircleStart(x, y)
    } else if (tool === 'arrow') {
      handleArrowStart(x, y)
    } else if (tool === 'text') {
      handleTextStart(x, y)
    } else if (tool === 'polygon') {
      handlePolygonStart(x, y)
    } else if (tool === 'delete') {
      handleDeleteShape(x, y)
    }
  }

  const handleCanvasMouseDown = (e) => {
    if (!currentRoom || isCreating || drawMode !== 'drag') return
    if (tool !== 'line' && tool !== 'rectangle' && tool !== 'circle' && tool !== 'arrow') return

    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)

    if (tool === 'line') {
      handleLineStart(x, y)
    } else if (tool === 'rectangle') {
      handleRectStart(x, y)
    } else if (tool === 'circle') {
      handleCircleStart(x, y)
    } else if (tool === 'arrow') {
      handleArrowStart(x, y)
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
          return
        }
      } else if (shape.type === 'rectangle') {
        if (
          x >= shape.x && x <= shape.x + shape.width &&
          y >= shape.y && y <= shape.y + shape.height
        ) {
          setShapes(shapes.filter((_, idx) => idx !== i))
          return
        }
      } else if (shape.type === 'circle') {
        const distance = Math.sqrt(Math.pow(x - shape.cx, 2) + Math.pow(y - shape.cy, 2))
        if (distance <= shape.r + tolerance) {
          setShapes(shapes.filter((_, idx) => idx !== i))
          return
        }
      } else if (shape.type === 'arrow') {
        const distance = distanceToLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2)
        if (distance < tolerance) {
          setShapes(shapes.filter((_, idx) => idx !== i))
          return
        }
      } else if (shape.type === 'text') {
        const textWidth = shape.text.length * 8
        const textHeight = 16
        if (
          x >= shape.x && x <= shape.x + textWidth &&
          y >= shape.y - textHeight && y <= shape.y
        ) {
          setShapes(shapes.filter((_, idx) => idx !== i))
          return
        }
      } else if (shape.type === 'polygon') {
        if (isPointInPolygon(x, y, shape.pointsArray)) {
          setShapes(shapes.filter((_, idx) => idx !== i))
          return
        }
      }
    }
  }

  const isPointInPolygon = (x, y, points) => {
    let inside = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x
      const yi = points[i].y
      const xj = points[j].x
      const yj = points[j].y

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      if (intersect) inside = !inside
    }
    return inside
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
      const newSeats = [...seats, newSeat]
      setSeats(newSeats)
      saveToHistory(newSeats, shapes)
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
    const newShapes = [...shapes, newLine]
    setShapes(newShapes)
    saveToHistory(seats, newShapes)
    setDrawingStart(null)
    setPreview(null)
    setSkipNextClick(true)
  }

  const handleRectStart = (x, y) => {
    setDrawingStart({ x, y })
  }

  const handleCircleStart = (x, y) => {
    setDrawingStart({ x, y })
  }

  const handleCircleEnd = (x, y) => {
    if (!drawingStart) return
    const radius = Math.sqrt(Math.pow(x - drawingStart.x, 2) + Math.pow(y - drawingStart.y, 2))
    const newCircle = {
      id: `circle-${Date.now()}`,
      type: 'circle',
      cx: drawingStart.x,
      cy: drawingStart.y,
      r: radius
    }
    const newShapes = [...shapes, newCircle]
    setShapes(newShapes)
    saveToHistory(seats, newShapes)
    setDrawingStart(null)
    setPreview(null)
    setSkipNextClick(true)
  }

  const handleArrowStart = (x, y) => {
    setDrawingStart({ x, y })
  }

  const handleArrowEnd = (x, y) => {
    if (!drawingStart) return
    const newArrow = {
      id: `arrow-${Date.now()}`,
      type: 'arrow',
      x1: drawingStart.x,
      y1: drawingStart.y,
      x2: x,
      y2: y
    }
    const newShapes = [...shapes, newArrow]
    setShapes(newShapes)
    saveToHistory(seats, newShapes)
    setDrawingStart(null)
    setPreview(null)
    setSkipNextClick(true)
  }

  const handleTextStart = (x, y) => {
    setTextInput({ x, y, text: '' })
  }

  const handleTextSubmit = () => {
    if (!textInput || !textInput.text.trim()) return
    const newText = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: textInput.x,
      y: textInput.y,
      text: textInput.text
    }
    const newShapes = [...shapes, newText]
    setShapes(newShapes)
    saveToHistory(seats, newShapes)
    setTextInput(null)
  }

  const handlePolygonStart = (x, y) => {
    if (drawMode === 'click') {
      setPolygonPoints([...polygonPoints, { x, y }])
    }
  }

  const handlePolygonComplete = () => {
    if (polygonPoints.length < 3) {
      setPolygonPoints([])
      return
    }
    const pointsStr = polygonPoints.map(p => `${p.x},${p.y}`).join(' ')
    const newPolygon = {
      id: `polygon-${Date.now()}`,
      type: 'polygon',
      points: pointsStr,
      pointsArray: polygonPoints
    }
    setShapes([...shapes, newPolygon])
    setPolygonPoints([])
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
    const newShapes = [...shapes, newRect]
    setShapes(newShapes)
    saveToHistory(seats, newShapes)
    setDrawingStart(null)
    setPreview(null)
    setSkipNextClick(true)
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
    } catch (err) {
      setAlert({ type: 'error', message: err.message })
      console.error('Seat deletion error:', err)
      setTimeout(() => setAlert(null), 2000)
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
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - drawingStart.x, 2) + Math.pow(y - drawingStart.y, 2))
        setPreview({
          type: 'circle',
          cx: drawingStart.x,
          cy: drawingStart.y,
          r: radius
        })
      } else if (tool === 'arrow') {
        setPreview({
          type: 'arrow',
          x1: drawingStart.x,
          y1: drawingStart.y,
          x2: x,
          y2: y
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
      } else if (tool === 'circle') {
        handleCircleEnd(x, y)
      } else if (tool === 'arrow') {
        handleArrowEnd(x, y)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-6xl mx-auto px-4 py-8 w-full">
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
            value={currentRoom?.token || ''}
            onChange={handleRoomChange}
            disabled={isCreating || dragging || drawingStart || tool === 'delete'}
            className="px-3 py-2 border border-slate-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-cyan-400
                     disabled:bg-slate-100 disabled:text-slate-500">
            {rooms.map(r => (
              <option key={r.id} value={r.token}>
                {r.name} ({r.width}×{r.height})
              </option>
            ))}
          </select>
        </div>

        {currentRoom && (
          <div className="mb-6 p-4 bg-slate-100 rounded-lg">
            <h3 className="text-sm font-medium text-slate-700 mb-3">上面図のサイズ</h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label htmlFor="width" className="block text-xs font-medium text-slate-600 mb-1">
                  幅 (px)
                </label>
                <input
                  id="width"
                  type="number"
                  min="100"
                  max="5000"
                  value={roomSizeInput.width}
                  onChange={(e) => setRoomSizeInput({ ...roomSizeInput, width: parseInt(e.target.value) || 0 })}
                  disabled={isUpdatingRoom}
                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded
                           focus:outline-none focus:ring-2 focus:ring-cyan-400
                           disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-xs font-medium text-slate-600 mb-1">
                  高さ (px)
                </label>
                <input
                  id="height"
                  type="number"
                  min="100"
                  max="5000"
                  value={roomSizeInput.height}
                  onChange={(e) => setRoomSizeInput({ ...roomSizeInput, height: parseInt(e.target.value) || 0 })}
                  disabled={isUpdatingRoom}
                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded
                           focus:outline-none focus:ring-2 focus:ring-cyan-400
                           disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>
            <button
              onClick={handleRoomSizeUpdate}
              disabled={isUpdatingRoom || (roomSizeInput.width === currentRoom.width && roomSizeInput.height === currentRoom.height)}
              className="px-3 py-1 text-sm bg-cyan-500 text-white rounded font-medium
                       hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isUpdatingRoom ? '更新中...' : 'サイズ更新'}
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="mb-3 flex gap-3">
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
              onClick={() => setTool('circle')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tool === 'circle'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}>
              円
            </button>
            <button
              onClick={() => setTool('arrow')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tool === 'arrow'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}>
              矢印
            </button>
            <button
              onClick={() => setTool('text')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tool === 'text'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}>
              テキスト
            </button>
            <button
              onClick={() => setTool('polygon')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tool === 'polygon'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}>
              ポリゴン
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

          <div className="flex gap-6 flex-wrap items-center">
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="元に戻す (Ctrl+Z)"
                className="px-3 py-1 rounded font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                ↶ 戻す
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="やり直す (Ctrl+Y)"
                className="px-3 py-1 rounded font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                ↷ やり直す
              </button>
              <button
                onClick={handleSaveShapes}
                className="px-3 py-1 rounded font-medium bg-green-500 text-white hover:bg-green-600 text-sm">
                💾 保存
              </button>
            </div>

            <div className="flex gap-3">
              <label className="text-sm font-medium text-slate-700">描画方法:</label>
            <button
              onClick={() => setDrawMode('click')}
              className={`px-3 py-1 rounded font-medium transition-colors text-sm ${
                drawMode === 'click'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}>
              2点選択
            </button>
            <button
              onClick={() => setDrawMode('drag')}
              className={`px-3 py-1 rounded font-medium transition-colors text-sm ${
                drawMode === 'drag'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}>
              ドラッグ
            </button>
            </div>

            <div className="flex gap-3 items-center">
            <label className="text-sm font-medium text-slate-700">ズーム:</label>
            <button
              onClick={handleZoomOut}
              className="px-3 py-1 rounded font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">
              −
            </button>
            <span className="text-sm font-medium text-slate-700 w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="px-3 py-1 rounded font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">
              +
            </button>
            <button
              onClick={handleZoomReset}
              className="px-3 py-1 rounded font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">
              リセット
            </button>
            </div>
          </div>
        </div>

      </div>

      {currentRoom ? (
        <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-white border-t border-slate-200">
          <div className="p-6 inline-block">
            <div
              ref={svgContainerRef}
              className="relative inline-block"
              style={{
                width: `${Math.round(roomSizeInput.width)}px`,
                height: `${Math.round(roomSizeInput.height)}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                transition: 'transform 0.1s ease-out'
              }}
            >
              <svg
                ref={svgRef}
                width={roomSizeInput.width}
                height={roomSizeInput.height}
                className={`border border-slate-300 rounded-lg bg-slate-50 block select-none ${
                  dragging ? 'cursor-grabbing' : isResizing ? 'cursor-nwse-resize' : isCreating ? 'cursor-wait' : 'cursor-crosshair'
                }`}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={(e) => {
                  if (!isResizing) handleMouseUp(e)
                }}
              >
              {shapes.map((shape) => {
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
                ) : preview.type === 'rectangle' ? (
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
                ) : preview.type === 'circle' ? (
                  <circle
                    cx={preview.cx}
                    cy={preview.cy}
                    r={preview.r}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    pointerEvents="none"
                  />
                ) : preview.type === 'arrow' ? (
                  <line
                    x1={preview.x1}
                    y1={preview.y1}
                    x2={preview.x2}
                    y2={preview.y2}
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    pointerEvents="none"
                  />
                ) : null
              )}

              {polygonPoints.map((point, idx) => (
                <circle
                  key={`poly-point-${idx}`}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#06b6d4"
                  pointerEvents="none"
                />
              ))}

              {polygonPoints.length > 0 && (
                <polyline
                  points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  pointerEvents="none"
                />
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

              {/* 右エッジ（幅のみ変更） */}
              <div
                onMouseDown={(e) => handleResizeStart(e, 'horizontal')}
                className="absolute top-0 right-0 h-full w-2 cursor-ew-resize hover:bg-cyan-400 bg-cyan-200"
                style={{
                  transform: 'translateX(1px)',
                  zIndex: 10,
                  opacity: 0.5
                }}
                title="ドラッグして幅を変更"
              />

              {/* 下エッジ（高さのみ変更） */}
              <div
                onMouseDown={(e) => handleResizeStart(e, 'vertical')}
                className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-cyan-400 bg-cyan-200"
                style={{
                  transform: 'translateY(1px)',
                  zIndex: 10,
                  opacity: 0.5
                }}
                title="ドラッグして高さを変更"
              />

              {/* 右下角（両方向） */}
              <div
                onMouseDown={(e) => handleResizeStart(e, 'both')}
                className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 cursor-nwse-resize"
                style={{
                  transform: 'translate(2px, 2px)',
                  zIndex: 11
                }}
                title="ドラッグして幅と高さを同時に変更"
              />
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <p className="text-sm text-slate-500">
                {isCreating && <span className="text-cyan-600 font-medium">● 追加中...</span>}
                {!isCreating && (
                  <>
                    {seats.length} 個の座席 • ドラッグで移動、マウスアップで自動保存
                  </>
                )}
              </p>

              {tool === 'polygon' && polygonPoints.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-sm text-slate-600">
                    ポリゴンポイント: {polygonPoints.length}個
                  </span>
                  <button
                    onClick={handlePolygonComplete}
                    disabled={polygonPoints.length < 3}
                    className="px-3 py-1 text-sm bg-cyan-500 text-white rounded disabled:opacity-50">
                    完成
                  </button>
                  <button
                    onClick={() => setPolygonPoints([])}
                    className="px-3 py-1 text-sm bg-slate-300 text-slate-700 rounded">
                    キャンセル
                  </button>
                </div>
              )}

              {textInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput.text}
                    onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleTextSubmit()
                    }}
                    placeholder="テキストを入力"
                    autoFocus
                    className="px-3 py-1 text-sm border border-slate-300 rounded flex-1"
                  />
                  <button
                    onClick={handleTextSubmit}
                    className="px-3 py-1 text-sm bg-cyan-500 text-white rounded">
                    追加
                  </button>
                  <button
                    onClick={() => setTextInput(null)}
                    className="px-3 py-1 text-sm bg-slate-300 text-slate-700 rounded">
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        ) : (
          <div className="flex-1 bg-amber-50 border-t border-slate-200 flex items-center justify-center">
            <div className="text-center">
              <p className="text-amber-700">上面図を選択してください</p>
            </div>
          </div>
        )}
    </div>
  )
}
