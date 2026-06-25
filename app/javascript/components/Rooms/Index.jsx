import React, { useState } from 'react'
import { useForm, router } from '@inertiajs/react'
import { ErrorAlert, SuccessAlert } from '../ui/Alert'
import Pagination from '../ui/Pagination'

export default function RoomsIndex({ rooms, errors: serverErrors, pagination, search_query }) {
  const [showForm, setShowForm] = useState(false)
  const [alert, setAlert] = useState(null)
  const { data, setData, post, processing } = useForm({
    name: '',
    width: 800,
    height: 600
  })

  React.useEffect(() => {
    console.log('[RoomsIndex] Component mounted with', rooms.length, 'rooms')
  }, [])

  React.useEffect(() => {
    console.log('[RoomsIndex] Props updated:', rooms.length, 'rooms')
  }, [rooms])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!data.name.trim()) {
      setAlert({ type: 'error', message: '上面図の名前を入力してください' })
      return
    }

    console.log('[RoomCreate] Submitting form with data:', data)
    post('/rooms', {
      data: { room: data },
      onSuccess: () => {
        console.log('[RoomCreate] Room created successfully, reloading page')
        setAlert({ type: 'success', message: '上面図を作成しました' })
        setData({ name: '', width: 800, height: 600 })
        setShowForm(false)
        // Reload the page after a short delay to ensure the server has processed the redirect
        setTimeout(() => {
          window.location.href = '/rooms'
        }, 100)
      },
      onError: (errors) => {
        console.log('[RoomCreate] onError called with errors:', errors)
        const errorMessage = errors.name?.[0] || JSON.stringify(errors) || '作成に失敗しました'
        setAlert({ type: 'error', message: errorMessage })
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">上面図管理</h1>
          <p className="text-slate-500">座席配置を作成・管理します</p>
        </div>

        {alert && (
          alert.type === 'error' ? (
            <ErrorAlert
              message={alert.message}
              onDismiss={() => setAlert(null)}
            />
          ) : (
            <SuccessAlert
              message={alert.message}
              onDismiss={() => setAlert(null)}
            />
          )
        )}

        <div className="mb-6">
          <form method="GET" className="flex gap-2">
            <input
              type="text"
              name="q[name_cont]"
              placeholder="上面図の名前で検索..."
              defaultValue={search_query?.name_cont || ''}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg
                       hover:bg-slate-300 transition-colors">
              検索
            </button>
          </form>
          {pagination?.total_count > 0 && (
            <p className="text-sm text-slate-500 mt-2">
              合計 {pagination.total_count} 件
            </p>
          )}
        </div>

        {rooms.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">利用可能な上面図</h2>
            <div className="space-y-2">
              {rooms.map((room) => (
                <div key={room.id} className="flex gap-3 items-center">
                  <a href={`/rooms/${room.id}`}
                     className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-3
                              shadow-sm hover:shadow-md transition-shadow
                              text-slate-800 hover:text-cyan-600">
                    <div className="font-medium">
                      {room.name}
                    </div>
                    <span className="text-sm text-slate-400">
                      {room.width} × {room.height}
                    </span>
                  </a>
                  <a href={`/editor?room_id=${room.id}`}
                     className="text-sm text-slate-500 hover:text-cyan-600 font-medium
                              border border-slate-300 rounded hover:border-cyan-400 transition-colors
                              px-4 py-2 whitespace-nowrap">
                    レイアウト編集
                  </a>
                </div>
              ))}
            </div>

            {pagination && (
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                baseUrl="/"
                queryParams={search_query?.name_cont ? `&q[name_cont]=${encodeURIComponent(search_query.name_cont)}` : ''}
              />
            )}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-700 mb-8">
            {search_query?.name_cont ? '検索条件に合致する上面図がありません。' : '上面図がまだ作成されていません。作成から始めましょう。'}
          </div>
        )}

        <div className="border-t border-slate-200 pt-8">
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={processing}
            className="px-4 py-2 bg-cyan-500 text-white font-medium rounded-lg
                     hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {showForm ? 'キャンセル' : '新規上面図を作成'}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit}
              className="mt-6 bg-white border border-slate-200 rounded-lg p-6 max-w-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">新規上面図</h2>

              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  上面図の名前 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  required
                  disabled={processing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-cyan-400
                           disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="例：カフェ、会議室"
                />
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="width" className="block text-sm font-medium text-slate-700 mb-1">
                    幅 (px)
                  </label>
                  <input
                    id="width"
                    type="number"
                    value={data.width}
                    onChange={(e) => setData('width', parseInt(e.target.value))}
                    required
                    disabled={processing}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-cyan-400
                             disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-slate-700 mb-1">
                    高さ (px)
                  </label>
                  <input
                    id="height"
                    type="number"
                    value={data.height}
                    onChange={(e) => setData('height', parseInt(e.target.value))}
                    required
                    disabled={processing}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-cyan-400
                             disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-2 bg-cyan-500 text-white font-medium rounded-lg
                         hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2">
                {processing && (
                  <span className="inline-block animate-spin">⟳</span>
                )}
                {processing ? '作成中...' : '作成'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
