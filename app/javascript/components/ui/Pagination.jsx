import React from 'react'
import { Link } from '@inertiajs/react'

export default function Pagination({ currentPage, totalPages, baseUrl, queryParams = '' }) {
  if (totalPages <= 1) return null

  const pages = []
  const maxPagesToShow = 7
  const halfWindow = Math.floor(maxPagesToShow / 2)

  let startPage = Math.max(1, currentPage - halfWindow)
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }

  if (startPage > 1) {
    pages.push(
      <Link
        key="first"
        href={`${baseUrl}?page=1${queryParams}`}
        className="px-3 py-2 rounded border border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600"
      >
        1
      </Link>
    )
    if (startPage > 2) {
      pages.push(
        <span key="ellipsis-start" className="px-3 py-2 text-slate-400">
          ...
        </span>
      )
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const isCurrent = i === currentPage
    pages.push(
      <Link
        key={i}
        href={`${baseUrl}?page=${i}${queryParams}`}
        className={`px-3 py-2 rounded border ${
          isCurrent
            ? 'bg-cyan-500 text-white border-cyan-500'
            : 'border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600'
        }`}
      >
        {i}
      </Link>
    )
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="ellipsis-end" className="px-3 py-2 text-slate-400">
          ...
        </span>
      )
    }
    pages.push(
      <Link
        key="last"
        href={`${baseUrl}?page=${totalPages}${queryParams}`}
        className="px-3 py-2 rounded border border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600"
      >
        {totalPages}
      </Link>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8 py-4">
      {currentPage > 1 && (
        <Link
          href={`${baseUrl}?page=${currentPage - 1}${queryParams}`}
          className="px-4 py-2 rounded border border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600 font-medium"
        >
          ← 前へ
        </Link>
      )}

      <div className="flex gap-1">{pages}</div>

      {currentPage < totalPages && (
        <Link
          href={`${baseUrl}?page=${currentPage + 1}${queryParams}`}
          className="px-4 py-2 rounded border border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600 font-medium"
        >
          次へ →
        </Link>
      )}
    </div>
  )
}
