import React, { useState } from 'react'
import { useForm } from '@inertiajs/react'
import { ErrorAlert } from '../ui/Alert'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember_me: false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post('/users/sign_in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            FloorMap
          </h1>
          <p className="text-slate-400">Seating Manager</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            ログイン
          </h2>

          {/* Error Messages */}
          {Object.values(errors).some(err => err) && (
            <ErrorAlert
              message={Object.values(errors)[0] || 'ログインに失敗しました'}
              onDismiss={() => {}}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                disabled={processing}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-cyan-500
                         disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="example@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  disabled={processing}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-cyan-500
                           disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? '隠す' : '表示'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={data.remember_me}
                onChange={(e) => setData('remember_me', e.target.checked)}
                disabled={processing}
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500
                         border-slate-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember_me"
                className="ml-2 block text-sm text-slate-700 cursor-pointer"
              >
                ログイン状態を保持する
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={processing}
              className="w-full py-2 bg-cyan-600 text-white font-medium rounded-lg
                       hover:bg-cyan-700 transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing && <span className="inline-block animate-spin">⟳</span>}
              {processing ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-slate-600 mt-6">
            アカウントがありませんか？{' '}
            <a href="/users/sign_up" className="text-cyan-600 hover:text-cyan-700 font-medium">
              登録する
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
