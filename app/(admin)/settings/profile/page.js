'use client'

import { useEffect, useState, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import { getLoginUser, updateLoginUser } from '@/services/auth/login.service'
import { useRouter, usePathname } from 'next/navigation'

export default function ProfilePage () {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = useMemo(() => ([
    { id: 'profile', label: 'My Profile', href: '/settings/profile' },
    { id: 'password', label: 'Change Password', href: '/settings/change-password' },
    // { id: 'notifications', label: 'Notifications', href: '/settings/notifications' }
  ]), [])
  const isActive = href => pathname === href
  const go = href => { router.push(href) }
  const [profile, setProfile] = useState({
    name: 'Oromuno Okiemute Grace',
    email: 'loveokiemute@gmail.com'
  })
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    const e = {}
    if (!String(formData.name || '').trim()) e.name = 'Required'
    const email = String(formData.email || '').trim()
    if (!email) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Enter a valid email'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      setToast({
        open: true,
        title: 'Validation failed',
        description: 'Please fix highlighted fields',
        variant: 'error'
      })
      return
    }
    try {
      setSaving(true)
      const uid =
        typeof window !== 'undefined'
          ? localStorage.getItem('userId') ||
            sessionStorage.getItem('userId') ||
            (() => {
              try {
                const u = JSON.parse(
                  localStorage.getItem('user') ||
                    sessionStorage.getItem('user') ||
                    'null'
                )
                return u?._id || ''
              } catch {
                return ''
              }
            })()
          : ''
      const payload = {
        email: String(formData.email || '').trim(),
        phone: String(formData.phone || '').trim(),
        name: String(formData.name || '').trim()
      }
      const res = await updateLoginUser(uid, payload)
      const d = res?.data || {}
      setProfile(prev => ({
        ...prev,
        name: d?.name || payload.name,
        email: d?.email || payload.email
      }))
      setToast({
        open: true,
        title: 'Profile updated',
        description: res?.message || 'Your changes have been saved',
        variant: 'success'
      })
    } catch (err) {
      const msg = err?.message || 'Failed to update profile'
      setToast({
        open: true,
        title: 'Error',
        description: msg,
        variant: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const uid =
          typeof window !== 'undefined'
            ? localStorage.getItem('userId') ||
              sessionStorage.getItem('userId') ||
              (() => {
                try {
                  const u = JSON.parse(
                    localStorage.getItem('user') ||
                      sessionStorage.getItem('user') ||
                      'null'
                  )
                  return u?._id || ''
                } catch {
                  return ''
                }
              })()
            : ''
        if (!uid) throw new Error('User not found')
        const res = await getLoginUser(uid)
        const u = res?.data || {}
        const name = u?.name || profile.name
        const email = u?.email || profile.email
        const phone = u?.phone || ''
        setProfile({ name, email })
        setFormData(prev => ({ ...prev, name, email, phone }))
      } catch (e) {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen bg-white'>
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-[#1A1F3F]'>
          My Profile
        </h1>
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

      <div className='flex items-center gap-5 mb-8'>
       
        <div className='flex flex-col'>
          <div className='text-xl sm:text-2xl font-semibold text-[#172041]'>
            {loading ? (
              <span className='inline-flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' /> Loading...
              </span>
            ) : (
              profile.name
            )}
          </div>
          <div className='text-sm text-[#7A819D]'>
            {loading ? '' : profile.email}
          </div>
        </div>
      </div>

      <div className='bg-gray-200 p-4 rounded-xl'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-6'>
          <div className='text-lg font-semibold text-[#172041] mb-4'>
            Update Profile
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-[#2D3658]'>
                Full Name
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                className='w-full rounded-lg border border-[#E5E6EF] bg-white px-4 py-2.5 text-sm text-[#2D3658] shadow-sm outline-none focus:ring-2 focus:ring-orange-500'
                placeholder='Enter full name'
              />
              {errors.name && (
                <div className='text-xs text-red-600'>{errors.name}</div>
              )}
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-[#2D3658]'>
                Email
              </label>
              <input
                type='email'
                value={formData.email}
                onChange={e =>
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                className='w-full rounded-lg border border-[#E5E6EF] bg-white px-4 py-2.5 text-sm text-[#2D3658] shadow-sm outline-none focus:ring-2 focus:ring-orange-500'
                placeholder='Enter email address'
              />
              {errors.email && (
                <div className='text-xs text-red-600'>{errors.email}</div>
              )}
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-[#2D3658]'>
                Phone
              </label>
              <input
                type='tel'
                value={formData.phone}
                onChange={e =>
                  setFormData(prev => ({ ...prev, phone: e.target.value }))
                }
                className='w-full rounded-lg border border-[#E5E6EF] bg-white px-4 py-2.5 text-sm text-[#2D3658] shadow-sm outline-none focus:ring-2 focus:ring-orange-500'
                placeholder='Enter phone number'
              />
            </div>
          </div>
          <div className='mt-6'>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className='px-6 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold shadow-sm hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {saving ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' /> Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />
    </div>
  )
}
