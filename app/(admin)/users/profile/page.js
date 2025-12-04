"use client"

import { useEffect, useState } from 'react'
import ProfileForm from '@/components/users/ProfileForm'

export default function ProfilePage() {
    const [displayName, setDisplayName] = useState('User')
    useEffect(() => {
        try {
            const getName = () => {
                let nm = ''
                if (typeof window !== 'undefined') {
                    const ls = localStorage
                    const ss = sessionStorage
                    const uStr = (ls.getItem('user') || ss.getItem('user') || '')
                    if (uStr) {
                        try {
                            const u = JSON.parse(uStr)
                            nm = String(u?.name || u?.fullName || '').trim()
                        } catch {}
                    }
                    if (!nm) nm = String(ls.getItem('userName') || ss.getItem('userName') || '').trim()
                }
                return nm
            }
            const nm = getName()
            setDisplayName(nm || 'User')
        } catch {
            setDisplayName('User')
        }
    }, [])

    return (
        <div className="p-4 h-full flex flex-col bg-white">
            {/* Title and Breadcrumb */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Profile - {displayName}</h1>
                <nav className="text-sm text-gray-500">
                    <span>Dashboard</span> / <span>Users</span>
                </nav>
            </div>

            {/* Profile Form Component */}
            <ProfileForm />
        </div>
    );
}
