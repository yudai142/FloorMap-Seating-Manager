import React, { useState } from 'react'
import { useForm } from '@inertiajs/react'
import { router } from '@inertiajs/react'

export default function RoomsIndex({ rooms, errors }) {
  const [showForm, setShowForm] = useState(false)
  const { data, setData, post, processing } = useForm({
    name: '',
    width: 800,
    height: 600
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post('/rooms', {
      onSuccess: () => {
        setData({ name: '', width: 800, height: 600 })
        setShowForm(false)
      }
    })
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1>Rooms</h1>

      {rooms.length > 0 ? (
        <div>
          <h2>Available Rooms</h2>
          <ul>
            {rooms.map((room) => (
              <li key={room.id} style={{ marginBottom: '8px' }}>
                <a href={`/rooms/${room.id}`} style={{ textDecoration: 'none', color: '#0066cc' }}>
                  {room.name}
                </a>
                {' '}
                <span style={{ color: '#666' }}>
                  ({room.width} x {room.height})
                </span>
                {' '}
                <a href={`/editor?room_id=${room.id}`} style={{ fontSize: '0.9em', color: '#666' }}>
                  [Edit]
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No rooms yet. Create one to get started.</p>
      )}

      <hr style={{ margin: '24px 0', borderTop: '1px solid #ccc' }} />

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#06b6d4',
          color: '#042f2e',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1em'
        }}
      >
        {showForm ? 'Hide Form' : 'Create New Room'}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: '16px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            maxWidth: '480px',
            backgroundColor: '#f9fafb'
          }}
        >
          <h2>New Room</h2>

          {errors && errors.length > 0 && (
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#991b1b' }}>
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '8px' }}>
            <label htmlFor="name">
              Room Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <br />
            <input
              id="name"
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="width">Width</label>
              <br />
              <input
                id="width"
                type="number"
                value={data.width}
                onChange={(e) => setData('width', parseInt(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '4px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="height">Height</label>
              <br />
              <input
                id="height"
                type="number"
                value={data.height}
                onChange={(e) => setData('height', parseInt(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '4px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            style={{
              backgroundColor: '#06b6d4',
              color: '#042f2e',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: processing ? 'not-allowed' : 'pointer',
              opacity: processing ? 0.6 : 1
            }}
          >
            {processing ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}
    </div>
  )
}
