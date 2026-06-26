import React, { useState } from 'react'
import { Link, router } from '@inertiajs/react'

export default function Header({ currentUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    router.delete('/users/sign_out')
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
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 transition-colors">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/users/sign_in"
                className="px-4 py-2 text-slate-700 text-sm font-medium hover:text-slate-900 transition-colors">
                ログイン
              </Link>
              <Link
                href="/users/sign_up"
                className="px-4 py-2 bg-cyan-500 text-white text-sm rounded-lg font-medium hover:bg-cyan-600 transition-colors">
                新規登録
              </Link>
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
                  onClick={handleLogout}
                  className="w-full px-4 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 transition-colors">
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/users/sign_in"
                  className="block px-4 py-2 text-slate-700 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  ログイン
                </Link>
                <Link
                  href="/users/sign_up"
                  className="block px-4 py-2 bg-cyan-500 text-white text-sm rounded-lg font-medium hover:bg-cyan-600 transition-colors text-center">
                  新規登録
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
