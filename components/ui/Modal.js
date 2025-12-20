'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal ({
  open,
  onOpenChange,
  title,
  children,
  className = '',
  maxWidth = 'max-w-lg'
}) {
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' && open) onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null
  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center'>
      <div
        className='absolute inset-0 bg-black/40'
        onClick={() => onOpenChange(false)}
      />
      <div
        className={`relative z-50 w-full ${maxWidth} rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] ${className}`}
      >
        <div className='flex items-center justify-between mb-4'>
          {title ? (
            <div className='text-lg font-semibold text-slate-900'>{title}</div>
          ) : (
            <div />
          )}
          <button
            onClick={() => onOpenChange(false)}
            className='rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
