import React from 'react'

export function ErrorAlert({ message, onDismiss }) {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-red-800">エラーが発生しました</h3>
        <p className="text-sm text-red-700 mt-1">{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 ml-4 flex-shrink-0">
          ✕
        </button>
      )}
    </div>
  )
}

export function SuccessAlert({ message, onDismiss }) {
  return (
    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start justify-between">
      <div>
        <p className="text-sm text-green-700">{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-green-400 hover:text-green-600 ml-4 flex-shrink-0">
          ✕
        </button>
      )}
    </div>
  )
}
