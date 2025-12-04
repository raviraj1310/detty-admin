'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import { useGlobalLoader } from '@/components/ui/GlobalLoaderProvider'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [ok, setOk] = useState(false)
  const { showLoader, hideLoader } = useGlobalLoader()

  useEffect(() => {
    try {
      showLoader('Checking session...')
      const tokenA = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token')) : null
      const tokenB = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null
      const userStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || sessionStorage.getItem('user')) : null
      let userOk = false
      console.log('tokenA', tokenA)
      console.log('tokenB', tokenB)
      console.log('userStr', userStr)
      try {
        const u = userStr ? JSON.parse(userStr) : null
        userOk = !!u && (u._id || u.id || u.email)
      } catch {
        userOk = !!userStr
      }
      const tokenOk = !!(tokenA && String(tokenA).length > 10) || !!(tokenB && String(tokenB).length > 10)
      if (tokenOk && userOk) {
        setOk(true)
      } else {
        setOk(false)
        router.replace('/login')
      }
    } finally {
      setChecked(true)
      hideLoader()
    }
  }, [])

  if (!checked || !ok) return null
  return (
    <div className="flex min-h-screen max-w-12/12 bg-white">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto w-full">
        {/* Black header section to align with sidebar logo */}
        <div className="bg-black h-19 flex items-center px-4">
          {/* Main content header area */}
        </div>
        <div className="lg:pl-0 pl-0">
          {children}
        </div>
      </main>
    </div>
  );
}
