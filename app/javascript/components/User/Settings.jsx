import React, { useState } from 'react'
import { Link } from '@inertiajs/react'

export default function UserSettings({ user, two_factor_enabled }) {
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  const handleDisable2FA = async () => {
    if (!confirm('二要素認証を無効にしてもよろしいですか？')) return

    try {
      const response = await fetch('/two_factor/disable', {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': getCsrfToken()
        }
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('エラーが発生しました。もう一度お試しください。')
      }
    } catch (err) {
      alert('エラーが発生しました。もう一度お試しください。')
      console.error('Error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium mb-2 inline-block">
            ← 戻る
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">アカウント設定</h1>
        </div>

        <div className="grid gap-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">基本情報</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">メールアドレス</label>
                <p className="text-slate-800">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">お名前</label>
                <p className="text-slate-800">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">ロール</label>
                <p className="text-slate-800">
                  {user.role === 'admin' && '管理者'}
                  {user.role === 'manager' && 'マネージャー'}
                  {user.role === 'user' && 'ユーザー'}
                </p>
              </div>
            </div>
          </div>

          {/* 二要素認証 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">二要素認証</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                two_factor_enabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {two_factor_enabled ? '有効' : '無効'}
              </span>
            </div>

            <p className="text-slate-600 text-sm mb-4">
              {two_factor_enabled
                ? 'ログイン時に認証コードの入力が必須になります。'
                : 'セキュリティを強化するため、二要素認証の有効化をお勧めします。'}
            </p>

            <div className="flex gap-3">
              {!two_factor_enabled ? (
                <a
                  href="/two_factor/setup"
                  className="px-4 py-2 bg-cyan-500 text-white text-sm rounded font-medium hover:bg-cyan-600 transition-colors"
                >
                  二要素認証を有効化
                </a>
              ) : (
                <button
                  onClick={handleDisable2FA}
                  className="px-4 py-2 bg-red-500 text-white text-sm rounded font-medium hover:bg-red-600 transition-colors"
                >
                  二要素認証を無効化
                </button>
              )}
            </div>
          </div>

          {/* セキュリティ */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">セキュリティ</h2>
            <p className="text-slate-600 text-sm mb-4">
              定期的にパスワードを変更することをお勧めします。
            </p>
            <a
              href="/users/edit"
              className="px-4 py-2 bg-slate-500 text-white text-sm rounded font-medium hover:bg-slate-600 transition-colors inline-block"
            >
              パスワードを変更
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
