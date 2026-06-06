import React from 'react'

export default function RoomsShow({ room, seats }) {
  return (
    <div>
      <h1>{room.name}</h1>
      <div>Size: {room.width} x {room.height}</div>
      <h2>Seats</h2>
      <ul>
        {seats.map((s) => (
          <li key={s.id}>{s.label} — ({s.x},{s.y}) {s.occupied ? 'Occupied' : 'Free'}</li>
        ))}
      </ul>
    </div>
  )
}
