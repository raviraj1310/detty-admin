"use client"

import { useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import { changePassword } from '@/services/auth/login.service'

export default function ChangePasswordPage () {
  const router = useRouter()
  const pathname = usePathname()
  const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' })

  const tabs = useMemo(() => ([
    { id: 'profile', label: 'My Profile', href: '/settings/profile' },
    { id: 'password', label: 'Change Password', href: '/settings/change-password' },
    // { id: 'notifications', label: 'Notifications', href: '/settings/notifications' }
  ]), [])
  const isActive = href => pathname === href
  const go = href => { router.push(href) }

  const validate = () => {
    const e = {}
    const oldPassword = String(formData.oldPassword || '').trim()
    const newPassword = String(formData.newPassword || '').trim()
    const confirmPassword = String(formData.confirmPassword || '').trim()
    if (!oldPassword) e.oldPassword = 'Required'
    if (!newPassword) e.newPassword = 'Required'
    if (!confirmPassword) e.confirmPassword = 'Required'
    if (newPassword && confirmPassword && newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      setToast({ open: true, title: 'Validation failed', description: 'Please fix highlighted fields', variant: 'error' })
      return
    }
    try {
      setSaving(true)
      const uid = typeof window !== 'undefined'
        ? (localStorage.getItem('userId') || sessionStorage.getItem('userId') || (() => {
            try { const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'); return u?._id || '' } catch { return '' }
          })())
        : ''
      const payload = {
        oldPassword: String(formData.oldPassword || '').trim(),
        newPassword: String(formData.newPassword || '').trim(),
        confirmPassword: String(formData.confirmPassword || '').trim()
      }
      const res = await changePassword(uid, payload)
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
      setToast({ open: true, title: 'Password updated', description: res?.message || 'Your password has been changed', variant: 'success' })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to change password'
      setToast({ open: true, title: 'Error', description: msg, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen bg-white'>
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-[#1A1F3F]'>Change Password</h1>
      </div>

      <div className='bg-gray-200 p-3 sm:p-4 lg:p-6 rounded-xl mb-6'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-4 sm:p-6'>
          <div className='flex gap-2 sm:gap-3'>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => go(t.href)}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive(t.href)
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-[#1A1F3F] border border-[#E5E6EF] hover:bg-[#F9FAFD]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-[#E1E6F7] bg-white p-6'>
        <div className='text-lg font-semibold text-[#172041] mb-4'>Update Password</div>
        <div className='space-y-4'>
          <div className='space-y-1'>
            <label className='text-sm font-medium text-[#2D3658]'>Current Password</label>
            <input type='password' value={formData.oldPassword} onChange={e => setFormData(prev => ({ ...prev, oldPassword: e.target.value }))} className='w-full rounded-lg border border-[#E5E6EF] bg-white px-4 py-2.5 text-sm text-[#2D3658] shadow-sm outline-none focus:ring-2 focus:ring-orange-500' placeholder='Enter current password' />
            {errors.oldPassword && <div className='text-xs text-red-600'>{errors.oldPassword}</div>}
          </div>
          <div className='space-y-1'>
            <label className='text-sm font-medium text-[#2D3658]'>New Password</label>
            <input type='password' value={formData.newPassword} onChange={e => setFormData(prev => ({ ...prev, newPassword: e.target.value }))} className='w-full rounded-lg border border-[#E5E6EF] bg-white px-4 py-2.5 text-sm text-[#2D3658] shadow-sm outline-none focus:ring-2 focus:ring-orange-500' placeholder='Enter new password' />
            {errors.newPassword && <div className='text-xs text-red-600'>{errors.newPassword}</div>}
          </div>
          <div className='space-y-1'>
            <label className='text-sm font-medium text-[#2D3658]'>Confirm New Password</label>
            <input type='password' value={formData.confirmPassword} onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} className='w-full rounded-lg border border-[#E5E6EF] bg-white px-4 py-2.5 text-sm text-[#2D3658] shadow-sm outline-none focus:ring-2 focus:ring-orange-500' placeholder='Re-enter new password' />
            {errors.confirmPassword && <div className='text-xs text-red-600'>{errors.confirmPassword}</div>}
          </div>
        </div>
        <div className='mt-6'>
          <button onClick={handleSubmit} disabled={saving} className='px-6 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold shadow-sm hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed'>
            {saving ? <span className='flex items-center gap-2'><Loader2 className='h-4 w-4 animate-spin' /> Saving...</span> : 'Save Changes'}
          </button>
        </div>
      </div>
      <Toast open={toast.open} onOpenChange={v => setToast(prev => ({ ...prev, open: v }))} title={toast.title} description={toast.description} variant={toast.variant} duration={2500} position='top-right' />
    </div>
  )
}