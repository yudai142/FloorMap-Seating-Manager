import React, { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react'

export default function AnalyticsDashboard({ occupancy_rate, check_ins_by_day, top_seats }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium mb-2 inline-block">
            ← 戻る
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">分析ダッシュボード</h1>
          <p className="text-slate-500 text-sm mt-1">座席利用状況と統計情報</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">読み込み中...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-medium text-slate-600 mb-2">現在の着席率</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-cyan-600">{occupancy_rate.toFixed(1)}</span>
                  <span className="text-lg text-slate-500">%</span>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-medium text-slate-600 mb-2">本日のチェックイン</h3>
                <div className="text-4xl font-bold text-green-600">
                  {check_ins_by_day.length > 0 ? check_ins_by_day[check_ins_by_day.length - 1].count : 0}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-medium text-slate-600 mb-2">アクティブな座席</h3>
                <div className="text-4xl font-bold text-purple-600">{top_seats.length}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">チェックイン推移</h2>
              <div className="space-y-3">
                {check_ins_by_day.length === 0 ? (
                  <p className="text-slate-500 text-sm">データなし</p>
                ) : (
                  check_ins_by_day.slice(-7).map((day, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="text-sm text-slate-600 w-16">{day.date}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full"
                          style={{ width: `${Math.min(100, (day.count / 50) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-12">{day.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">最もアクティブな座席 TOP 10</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium text-slate-600">座席</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">ルーム</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-600">利用回数</th>
                  </tr>
                </thead>
                <tbody>
                  {top_seats.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-slate-500">データなし</td>
                    </tr>
                  ) : (
                    top_seats.map((seat, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-3 font-medium text-slate-800">{seat.label}</td>
                        <td className="py-3 px-3 text-slate-600">{seat.name}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-block bg-cyan-100 text-cyan-700 px-2 py-1 rounded text-xs font-medium">
                            {seat.occupancy_count}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
