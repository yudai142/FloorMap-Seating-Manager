import React, { useState, useEffect } from 'react'
import { subscribeToRoom } from '../../channels/room_channel'

export default function RoomsShow({ room, seats: initialSeats }) {
  const [seats, setSeats] = useState(initialSeats)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [nameInput, setNameInput] = useState('')

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
    }
  }

  const handleCheckIn = async () => {
    if (!selectedSeat || !nameInput.trim()) return

    try {
      const response = await fetch(`/seats/${selectedSeat.id}/check_in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ occupant_name: nameInput })
      })

      if (response.ok) {
        setSeats(prev => prev.map(s =>
          s.id === selectedSeat.id
            ? { ...s, occupied: true, occupant_name: nameInput }
            : s
        ))
        setSelectedSeat(null)
        setNameInput('')
      }
    } catch (err) {
      console.error('Failed to check in:', err)
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

      if (response.ok) {
        setSeats(prev => prev.map(s =>
          s.id === seat.id
            ? { ...s, occupied: false, occupant_name: null }
            : s
        ))
      }
    } catch (err) {
      console.error('Failed to check out:', err)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1>{room.name}</h1>
      <p>Size: {room.width} x {room.height}</p>

      {room.width > 0 && room.height > 0 ? (
        <div>
          <svg
            width={Math.min(room.width, 600)}
            height={Math.min(room.height, 400)}
            style={{
              border: '1px solid #ccc',
              transform: `scale(${Math.min(600, room.width) / room.width})`
            }}
            viewBox={`0 0 ${room.width} ${room.height}`}
          >
            {seats.map((seat) => (
              <g
                key={seat.id}
                transform={`translate(${seat.x}, ${seat.y})`}
                onClick={() => handleSeatClick(seat)}
                style={{ cursor: 'pointer' }}
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
                  style={{ pointerEvents: 'none' }}
                >
                  {seat.label}
                </text>
                {seat.occupied && (
                  <text
                    x="16"
                    y="14"
                    fontSize="8"
                    fill="#666"
                    style={{ pointerEvents: 'none' }}
                  >
                    {seat.occupant_name}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <div>Room has no dimensions configured.</div>
      )}

      <h2>Seats</h2>
      <ul>
        {seats.map((s) => (
          <li key={s.id}>
            {s.label} — ({s.x},{s.y})
            {s.occupied ? ` 🟢 Occupied by ${s.occupant_name}` : ' ⚪ Free'}
          </li>
        ))}
      </ul>

      {selectedSeat && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedSeat(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxWidth: '400px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Check in to {selectedSeat.label}</h2>
            <input
              type="text"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCheckIn}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#4ade80',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check In
              </button>
              <button
                onClick={() => setSelectedSeat(null)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#e5e7eb',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
