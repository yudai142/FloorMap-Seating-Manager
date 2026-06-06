import React from 'react'

export default function RoomsIndex({ rooms }) {
  return (
    <div>
      <h1>Rooms</h1>
      <ul>
        {rooms.map((r) => (
          <li key={r.id}>{r.name} ({r.width}x{r.height})</li>
        ))}
      </ul>
    </div>
  )
}
