import React, { useState } from 'react'
import { Link, router } from '@inertiajs/react'

export default function Header({ currentUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [showChangeNameModal, setShowChangeNameModal] = useState(false)
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpPasswordConfirmation, setSignUpPasswordConfirmation] = useState('')
  const [newName, setNewName] = useState(currentUser?.name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/users/sign_out', {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': getCsrfToken()
        }
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (err) {
      console.error('Logout error:', err)
      window.location.reload()
    }
  }

  const handleChangeName = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          user: {
            name: newName
          }
        })
      })

      if (response.ok) {
        setShowChangeNameModal(false)
        window.location.reload()
      } else {
        setError('名前の変更に失敗しました')
      }
    } catch (err) {
      setError('名前の変更に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/users/sign_in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRF-Token': getCsrfToken()
        },
        body: new URLSearchParams({
          'user[email]': signInEmail,
          'user[password]': signInPassword
        })
      })

      if (response.ok) {
        window.location.reload()
      } else {
        setError('メールアドレスまたはパスワードが正しくありません')
      }
    } catch (err) {
      setError('ログインに失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRF-Token': getCsrfToken()
        },
        body: new URLSearchParams({
          'user[name]': signUpName,
          'user[email]': signUpEmail,
          'user[password]': signUpPassword,
          'user[password_confirmation]': signUpPasswordConfirmation
        })
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const text = await response.text()
        setError('登録に失敗しました。入力内容をご確認ください。')
      }
    } catch (err) {
      setError('登録に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* ロゴ・タイトル */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-800 hover:text-slate-600 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold">
            F
          </div>
          <span>FloorMap</span>
        </Link>

        {/* デスクトップメニュー */}
        <nav className="hidden md:flex items-center gap-4">
          {currentUser ? (
            <>
              <span className="text-sm text-slate-600">
                {currentUser.name} さん
              </span>
              <button
                onClick={() => {
                  setNewName(currentUser.name)
                  setShowChangeNameModal(true)
                }}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 transition-colors">
                名前変更
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 transition-colors">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowSignInModal(true)}
                className="px-4 py-2 text-slate-700 text-sm font-medium hover:text-slate-900 transition-colors">
                ログイン
              </button>
              <button
                onClick={() => setShowSignUpModal(true)}
                className="px-4 py-2 bg-cyan-500 text-white text-sm rounded-lg font-medium hover:bg-cyan-600 transition-colors">
                新規登録
              </button>
            </>
          )}
        </nav>

        {/* モバイルメニューボタン */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            {currentUser ? (
              <>
                <div className="px-2 py-2 text-sm text-slate-600">
                  {currentUser.name} さん
                </div>
                <button
                  onClick={() => {
                    setNewName(currentUser.name)
                    setShowChangeNameModal(true)
                    setMobileMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 transition-colors">
                  名前変更
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 transition-colors">
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowSignInModal(true)
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full px-4 py-2 text-slate-700 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  ログイン
                </button>
                <button
                  onClick={() => {
                    setShowSignUpModal(true)
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full px-4 py-2 bg-cyan-500 text-white text-sm rounded-lg font-medium hover:bg-cyan-600 transition-colors text-center">
                  新規登録
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* サインインモーダル */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSignInModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">ログイン</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メールアドレス</label>
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">パスワード</label>
                <input
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowSignInModal(false)
                  setShowSignUpModal(true)
                }}
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                アカウント登録はこちら
              </button>
            </div>

            <button
              onClick={() => setShowSignInModal(false)}
              className="mt-4 w-full py-2 px-4 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* サインアップモーダル */}
      {showSignUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowSignUpModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full my-8"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">アカウント登録</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">名前</label>
                <input
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メールアドレス</label>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">パスワード</label>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">パスワード（確認）</label>
                <input
                  type="password"
                  value={signUpPasswordConfirmation}
                  onChange={(e) => setSignUpPasswordConfirmation(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? '登録中...' : '登録する'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowSignUpModal(false)
                  setShowSignInModal(true)
                }}
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                ログインはこちら
              </button>
            </div>

            <button
              onClick={() => setShowSignUpModal(false)}
              className="mt-4 w-full py-2 px-4 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 名前変更モーダル */}
      {showChangeNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowChangeNameModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">ユーザー名を変更</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleChangeName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">新しい名前</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? '変更中...' : '変更する'}
              </button>
            </form>

            <button
              onClick={() => setShowChangeNameModal(false)}
              className="mt-4 w-full py-2 px-4 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
