import React from 'react'
import { Link } from '@inertiajs/react'

export default function BadRequest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">
            400
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">リクエストエラー</h1>
        <p className="text-slate-300 mb-8">
          リクエストに問題があります。入力内容を確認してもう一度お試しください。
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-cyan-500 text-slate-900 font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
