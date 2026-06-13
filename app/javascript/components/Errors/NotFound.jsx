import React from 'react'
import { Link } from '@inertiajs/react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-8xl font-bold text-slate-200 mb-4">404</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">ページが見つかりません</h1>
          <p className="text-slate-600">
            申し訳ございません。お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="px-6 py-3 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors inline-block"
          >
            ホームに戻る
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
          >
            前のページに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
