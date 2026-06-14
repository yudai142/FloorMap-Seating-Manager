import React, { useState } from 'react'
import { Link } from '@inertiajs/react'
import { useForm } from '@inertiajs/react'

export default function Invitations({ invitations: initialInvitations }) {
  const [showForm, setShowForm] = useState(false)
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    role: 'user'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post('/invitations', {
      onSuccess: () => {
        reset()
        setShowForm(false)
      }
    })
  }

  const handleDelete = (id) => {
    if (confirm('この招待を削除してもよろしいですか？')) {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = `/invitations/${id}`
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = '_method'
      input.value = 'DELETE'
      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium mb-2 inline-block">
            ← 戻る
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">ユーザー招待</h1>
          <p className="text-slate-500 text-sm mt-1">新しいユーザーを招待してアカウント作成できます</p>
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
          >
            + 新しい招待を作成
          </button>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">招待を作成</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ロール</label>
                <select
                  value={data.role}
                  onChange={(e) => setData('role', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="user">ユーザー</option>
                  <option value="manager">マネージャー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
                >
                  招待を送信
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            保留中の招待 ({initialInvitations.length})
          </h2>

          {initialInvitations.length === 0 ? (
            <p className="text-slate-500 text-sm">招待なし</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium text-slate-600">メールアドレス</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">ロール</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">作成日</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">有効期限</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {initialInvitations.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-3">{inv.email}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                          {inv.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(inv.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(inv.expires_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
