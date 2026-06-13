import React, { useState } from 'react'
import { usePage } from '@inertiajs/react'

export default function Navbar() {
  const { props } = usePage()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').content
  }

  const handleLogout = async (e) => {
    e.preventDefault()
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/users/sign_out'
    
    const token = document.createElement('input')
    token.type = 'hidden'
    token.name = '_method'
    token.value = 'DELETE'
    form.appendChild(token)

    const csrfToken = document.createElement('input')
    csrfToken.type = 'hidden'
    csrfToken.name = 'authenticity_token'
    csrfToken.value = getCsrfToken()
    form.appendChild(csrfToken)

    document.body.appendChild(form)
    form.submit()
  }

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold text-cyan-600">
            FloorMap
          </a>
          <div className="flex gap-4">
            <a href="/" className="text-slate-600 hover:text-slate-800 text-sm font-medium">
              上面図
            </a>
            {props.auth?.user?.admin && (
              <a href="/admin" className="text-slate-600 hover:text-slate-800 text-sm font-medium">
                管理画面
              </a>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">
              {props.auth?.user?.name || 'ユーザー'}
            </span>
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
              <a
                href="/users/settings"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
              >
                アカウント設定
              </a>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 rounded-b-lg border-t border-slate-200"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
