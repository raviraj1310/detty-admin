'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useMemo } from 'react'

export default function SettingsPage () {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = useMemo(() => ([
    { id: 'profile', label: 'My Profile', href: '/settings/profile' },
    { id: 'password', label: 'Change Password', href: '/settings/change-password' },
    // { id: 'notifications', label: 'Notifications', href: '/settings/notifications' }
  ]), [])

  const isActive = href => pathname === href

  const go = href => {
    router.push(href)
  }

  useEffect(() => {
    if (pathname === '/settings') {
      router.replace('/settings/profile')
    }
  }, [pathname, router])

  return (
    <div className='p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen bg-white'>
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Settings</h1>
        <p className='text-xs sm:text-sm text-gray-500 mt-1'>Dashboard / Settings</p>
      </div>

      <div className='bg-gray-200 p-3 sm:p-4 lg:p-6 rounded-xl'>
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
    </div>
  )
}