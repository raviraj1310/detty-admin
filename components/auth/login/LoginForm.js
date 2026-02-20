'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginUser } from '@/services/auth/login.service'
import { useGlobalLoader } from '@/components/ui/GlobalLoaderProvider'

export default function LoginForm () {
  const router = useRouter()
  const { showLoader, hideLoader } = useGlobalLoader()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async event => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    showLoader('Signing in...')
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.')
      setIsSubmitting(false)
      return
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.')
      setIsSubmitting(false)
      return
    }
    try {
      const result = await loginUser({ email, password })
      const message = result?.message ?? 'You have successfully signed in.'

      const token = result?.data?.token
      const refreshToken = result?.data?.refreshToken
      const userObj = result?.data?.user || null

      const userRole =
        result?.data?.user?.role?.name || result?.data?.user?.role || ''

      if (typeof window !== 'undefined') {
        // Clear previous auth-related data in both storage locations
        localStorage.removeItem('token')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        localStorage.removeItem('userId')

        sessionStorage.removeItem('token')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('userId')

        if (token) {
          localStorage.setItem('access_token', token)
          localStorage.setItem('token', token)
          if (!rememberMe) {
            sessionStorage.setItem('access_token', token)
            sessionStorage.setItem('token', token)
          }
        }

        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken)
          if (!rememberMe) {
            sessionStorage.setItem('refresh_token', refreshToken)
          }
        }

        // NEW: persist user object and userId for consumers (Navbar, wishlist service)
        if (userObj) {
          localStorage.setItem('user', JSON.stringify(userObj))
          const userId = userObj?._id || userObj?.id || ''
          if (userId) {
            localStorage.setItem('userId', userId)
          }

          if (!rememberMe) {
            sessionStorage.setItem('user', JSON.stringify(userObj))
            if (userId) {
              sessionStorage.setItem('userId', userId)
            }
          }
        }

        if (userRole) {
          localStorage.setItem('user_role', userRole)
          if (!rememberMe) {
            sessionStorage.setItem('user_role', userRole)
          }
        }

        // Keep Navbar in sync immediately in this tab
        window.dispatchEvent(
          new CustomEvent('auth:updated', { detail: { isLoggedIn: true } })
        )
      }

      const normalizedRole = userRole.toLowerCase()
      if (normalizedRole === 'user') {
        router.push('/')
      } else if (
        normalizedRole === 'admin' ||
        normalizedRole === 'super-admin' ||
        normalizedRole === 'super_admin'
      ) {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unable to sign in. Please try again.'

      setErrorMessage(apiMessage)
      toast.error(apiMessage)
    } finally {
      setIsSubmitting(false)
      hideLoader()
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-5 px-6 pb-6'>
      {/* Email */}
      <div className='space-y-1'>
        <label htmlFor='email' className='text-xs font-medium text-slate-700'>
          Email Address
        </label>
        <input
          id='email'
          type='email'
          placeholder='Enter Email Address'
          value={email}
          onChange={event => setEmail(event.target.value)}
          className='w-full rounded-md border border-[#E5E6EF] bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:bg-white dark:text-slate-900'
        />
      </div>

      {/* Password */}
      <div className='space-y-1'>
        <label
          htmlFor='password'
          className='text-xs font-medium text-slate-700'
        >
          Password
        </label>
        <div className='relative'>
          <input
            id='password'
            type={showPassword ? 'text' : 'password'}
            placeholder='Enter Password'
            value={password}
            onChange={event => setPassword(event.target.value)}
            className='w-full rounded-md border border-[#E5E6EF] bg-white px-3 py-2 pr-10 text-sm shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:bg-white dark:text-slate-900'
          />
          <button
            type='button'
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(value => !value)}
            className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#8A92AC] hover:text-[#2D3658]'
          >
            {showPassword ? (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.71-1.65 1.7-3.17 2.93-4.49M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1.05 2.45-2.76 4.6-4.86 6.06' />
                <path d='M1 1l22 22' />
                <path d='M14.12 14.12A3 3 0 0 1 9.88 9.88' />
              </svg>
            ) : (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z' />
                <circle cx='12' cy='12' r='3' />
              </svg>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className='text-sm text-red-600' role='alert'>
          {errorMessage}
        </p>
      )}

      {/* Options */}
      <div className='flex items-center justify-between text-sm'>
        <label className='flex items-center gap-2 select-none text-slate-700'>
          <input
            type='checkbox'
            checked={rememberMe}
            onChange={event => setRememberMe(event.target.checked)}
            className='h-4 w-4 rounded border-[#E5E6EF] text-orange-600 focus:ring-orange-500'
          />
          <span>Keep me signed in</span>
        </label>
        <Link
          href='/forgot_password'
          className='px-0 text-orange-600 hover:text-orange-700'
        >
          Forgot Password?
        </Link>
      </div>

      {/* Submit */}
      <button
        type='submit'
        disabled={isSubmitting}
        className='mt-2 w-full rounded-md bg-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-60'
      >
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  )
}
