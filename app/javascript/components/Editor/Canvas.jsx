import React, { useState } from 'react'

export default function Canvas({ rooms }) {
  const [seats, setSeats] = useState([])
  const [currentRoom] = useState(rooms && rooms[0])

  function handleClick(e) {
    const rect = e.target.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    const id = Date.now()
    setSeats((s) => [...s, { id, x, y, label: `S${s.length + 1}` }])
  }

  return (
    <div>
      <h1>SVG Editor (MVP)</h1>
      {currentRoom ? (
        <svg width={currentRoom.width} height={currentRoom.height} style={{ border: '1px solid #ccc' }} onClick={handleClick}>
          {seats.map((seat) => (
            <g key={seat.id} transform={`translate(${seat.x}, ${seat.y})`}>
              <circle r="10" fill="#4ade80" stroke="#065f46" />
              <text x="14" y="4" fontSize="12">{seat.label}</text>
            </g>
          ))}
        </svg>
      ) : (
        <div>No rooms available</div>
      )}
    </div>
  )
}
