import consumer from './consumer'

export function subscribeToUserNotifications(userId, onNotification) {
  return consumer.subscriptions.create(
    { channel: 'NotificationChannel', user_id: userId },
    {
      connected() {
        console.log(`Connected to notification channel for user ${userId}`)
      },

      disconnected() {
        console.log(`Disconnected from notification channel for user ${userId}`)
      },

      received(data) {
        if (data.type === 'notification') {
          onNotification(data.notification)
        }
      }
    }
  )
}
