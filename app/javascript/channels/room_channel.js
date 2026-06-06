import consumer from './consumer'

export function subscribeToRoom(roomId, onMessage) {
  const subscription = consumer.subscriptions.create({ channel: 'RoomChannel', room: roomId }, {
    received(data) {
      if (onMessage) onMessage(data)
    }
  })

  return subscription
}
