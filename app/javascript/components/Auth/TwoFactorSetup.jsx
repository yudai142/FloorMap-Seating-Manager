import React, { useState } from 'react'

export default function TwoFactorSetup({ qr_code, secret }) {
  const [otp_code, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  const handleConfirm = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/two_factor/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRF-Token': getCsrfToken()
        },
        body: new URLSearchParams({ otp_code })
      })

      if (response.ok) {
        window.location.href = '/'
      } else {
        setError('認証コードが無効です。もう一度お試しください。')
      }
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください。')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">二要素認証の設定</h1>
        <p className="text-slate-600 text-sm mb-6">
          認証アプリでこのQRコードをスキャンしてください
        </p>

        <div className="mb-6 flex justify-center">
          <div dangerouslySetInnerHTML={{ __html: qr_code }} />
        </div>

        <div className="mb-4 p-3 bg-slate-100 rounded">
          <p className="text-xs text-slate-600 mb-1">シークレットキー:</p>
          <p className="font-mono text-sm text-slate-800 break-all">{secret}</p>
        </div>

        <form onSubmit={handleConfirm}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-slate-700 mb-2">
            認証コード
          </label>
          <input
            type="text"
            value={otp_code}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength="6"
            disabled={loading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-center text-2xl tracking-widest
                     focus:outline-none focus:ring-2 focus:ring-cyan-400
                     disabled:bg-slate-100 disabled:text-slate-500"
            autoFocus
          />
          <p className="text-xs text-slate-500 mt-2">
            認証アプリに表示される6桁のコードを入力してください
          </p>

          <button
            type="submit"
            disabled={loading || otp_code.length !== 6}
            className="w-full mt-6 py-2 bg-cyan-500 text-white font-medium rounded-lg
                     hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '確認中...' : '確認'}
          </button>
        </form>
      </div>
    </div>
  )
}
