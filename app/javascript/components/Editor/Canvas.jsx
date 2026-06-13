import React, { useState, useRef } from 'react'
import { router } from '@inertiajs/react'

export default function Canvas({ rooms, room, initialSeats }) {
  const [currentRoom, setCurrentRoom] = useState(room)
  const [seats, setSeats] = useState(initialSeats || [])
  const [dragging, setDragging] = useState(null)
  const svgRef = useRef(null)

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  const handleRoomChange = (e) => {
    const newRoomId = e.target.value
    const newRoom = rooms.find(r => r.id === parseInt(newRoomId))
    router.visit(`/editor?room_id=${newRoomId}`, { preserveState: false })
  }

  const handleCanvasClick = async (e) => {
    if (dragging || !currentRoom) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    const newLabel = `S${seats.length + 1}`

    try {
      const response = await fetch(`/rooms/${currentRoom.id}/seats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ seat: { label: newLabel, x, y } })
      })

      if (response.ok) {
        const newSeat = await response.json()
        setSeats([...seats, newSeat])
      }
    } catch (err) {
      console.error('Failed to create seat:', err)
    }
  }

  const handleSeatMouseDown = (e, seat) => {
    e.stopPropagation()
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
        await fetch(`/rooms/${currentRoom.id}/seats/${seat.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({ seat: { x: seat.x, y: seat.y } })
        })
      } catch (err) {
        console.error('Failed to update seat position:', err)
      }
    }

    setDragging(null)
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1>SVG Editor (MVP)</h1>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="room-select">
          Room:
          <select
            id="room-select"
            value={currentRoom?.id || ''}
            onChange={handleRoomChange}
            style={{ marginLeft: '8px', padding: '4px' }}
          >
            {rooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.width}x{r.height})
              </option>
            ))}
          </select>
        </label>
      </div>

      {currentRoom ? (
        <div>
          <p>Click to add seats. Drag seats to move them.</p>
          <svg
            ref={svgRef}
            width={currentRoom.width}
            height={currentRoom.height}
            style={{
              border: '1px solid #ccc',
              cursor: dragging ? 'grabbing' : 'crosshair',
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
                style={{ cursor: 'grab' }}
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
        </div>
      ) : (
        <div>No rooms available. Create one first.</div>
      )}
    </div>
  )
}
