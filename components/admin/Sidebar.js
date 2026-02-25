'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useMemo, useState, useEffect } from 'react'
import { Wallet, User, Map, LogOut, AlertCircle, Loader2 } from 'lucide-react'

const menuSections = [
  {
    title: null,
    items: [
      {
        label: 'Users',
        icon: '/images/backend/side_menu/side_menu (1).svg',
        href: '/users',
        permission: 'user'
      },
      // { label: 'Profile', icon: 'lucide-user', href: '/users/profile' },
      // { label: 'Itinerary', icon: 'lucide-map', href: '/users/itinerary' },
      {
        label: 'Gross Transaction Value',
        icon: '/images/backend/side_menu/side_menu (1).svg',
        href: '/users/transactions',
        permission: 'transaction'
      },

      {
        label: 'Discover Events',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/discover-events',
        permission: 'event'
      },
      {
        label: 'Places to Visit',
        icon: '/images/backend/side_menu/side_menu (10).svg',
        href: '/places-to-visit',
        permission: 'places-to-visit'
      },
      // { label: 'Accommodation', icon: '/images/backend/side_menu/side_menu (3).svg', href: '/users/accommodation' },
      {
        label: 'Merchandise',
        icon: '/images/backend/side_menu/side_menu (6).svg',
        href: '/merchandise',
        permission: 'merchandise'
      },
      // { label: 'Travel Bundles', icon: '/images/backend/side_menu/side_menu (4).svg', href: '/users/travel-bundles' },
      // { label: 'DIY', icon: '/images/backend/side_menu/side_menu (5).svg', href: '/users/diy' },
      {
        label: 'VISA Applications',
        icon: '/images/backend/side_menu/side_menu (13).svg',
        href: '/visa',
        permission: 'visa'
      },
      {
        label: 'Pocket Book',
        icon: 'lucide-wallet',
        href: '/users/wallet',
        permission: 'wallet'
      },
      {
        label: 'Email Subscription',
        icon: '/images/backend/side_menu/side_menu (9).svg',
        href: '/email-subscription',
        permission: 'email-subscription'
      },
      {
        label: 'Contact us Enquiries',
        icon: '/images/backend/side_menu/side_menu (4).svg',
        href: '/contact',
        permission: 'contact'
      },
      {
        label: 'Event/Activity Inquiries',
        icon: '/images/backend/side_menu/side_menu (11).svg',
        href: '/inquiries',
        permission: 'inquiry'
      },
      {
        label: 'Request Deactivation',
        icon: '/images/backend/side_menu/side_menu (3).svg',
        href: '/request-deactivation',
        permission: 'request-deactivation'
      },
      {
        label: 'Referral Report',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/referral-reports',
        permission: 'referral-report'
      },
      {
        label: 'Custom Notifications',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/custom-notifications',
        permission: 'custom-notification'
      },
      {
        label: 'Voucher Distribution Report',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/voucher-distribution-report',
        permission: 'voucher'
      },
      {
        label: 'Podcast',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/podcast',
        permission: 'podcast'
      }

      // { label: 'Ride Services', icon: '/images/backend/side_menu/side_menu (9).svg', href: '/users/ride-services' },
    ]
  },
  {
    title: 'CMS',
    items: [
      {
        label: 'Landing Page',
        icon: '/images/backend/side_menu/side_menu (8).svg',
        href: '/cms/landing-page',
        permission: 'cms'
      },
      {
        label: 'About Us',
        icon: '/images/backend/side_menu/side_menu (14).svg',
        href: '/cms/about-us',
        permission: 'cms'
      },
      {
        label: 'Partner With Us',
        icon: '/images/backend/side_menu/side_menu (14).svg',
        href: '/cms/partner-with-us',
        permission: 'cms'
      },
      {
        label: 'FAQs',
        icon: '/images/backend/side_menu/side_menu (11).svg',
        href: '/cms/faqs',
        permission: 'cms'
      },
      {
        label: 'Blog',
        icon: '/images/backend/side_menu/side_menu (11).svg',
        href: '/cms/blog',
        permission: 'cms'
      },
      {
        label: 'Terms & Conditions',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/cms/terms-conditions',
        permission: 'cms'
      },
      {
        label: 'Terms of Use',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/cms/terms-of-use',
        permission: 'cms'
      },
      {
        label: 'Privacy Policy',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/cms/privacy-policy',
        permission: 'cms'
      },
      {
        label: 'Cookie Settings',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/cms/cookie-settings',
        permission: 'cms'
      },
      {
        label: 'Inner Page',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/cms/inner-page',
        permission: 'cms'
      }
    ]
  },
  {
    title: 'Masters',
    items: [
      {
        label: 'Event Type',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/event-type',
        permission: 'master'
      },
      {
        label: 'Discounts',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/discount',
        permission: 'master'
      },
      {
        label: 'Event Service Provider',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/event-service-provider',
        permission: 'master'
      },
      {
        label: 'Activity Type',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/activity-type',
        permission: 'master'
      },
      {
        label: 'Merchandise Category',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/merchandise-category',
        permission: 'master'
      },
      // { label: 'Facilities', icon: '/images/backend/side_menu/side_menu (12).svg', href: '/masters/facilities' },
      {
        label: 'Promo Banner',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/promo-banner',
        permission: 'master'
      },
      {
        label: 'Trusted Partners',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/trusted-partners',
        permission: 'master'
      },
      {
        label: 'Financial Partners',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/financial-partner',
        permission: 'master'
      },
      {
        label: 'FAQ Categories',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/faq-categories',
        permission: 'master'
      },
      {
        label: 'Country',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/country',
        permission: 'master'
      },
      {
        label: 'State',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/state',
        permission: 'master'
      },
      {
        label: 'City',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/city',
        permission: 'master'
      },
      {
        label: 'Accommodation Promo Banner',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/accommodation-promo-banner',
        permission: 'master'
      },
      {
        label: 'Email Templates',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/email-templates',
        permission: 'master'
      },
      {
        label: 'Shipping Charges',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/shipping-price',
        permission: 'master'
      },
      {
        label: 'Gym Access',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/gym',
        permission: 'master'
      },
      {
        label: 'Personal Trainer',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/personal-trainer',
        permission: 'master'
      },
      {
        label: 'Team Bonding Retreat',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/team-bonding-retreat',
        permission: 'master'
      },
      {
        label: 'Fitness Events',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/fitness-events',
        permission: 'master'
      }
    ]
  },
  {
    title: 'User Access',
    items: [
      {
        label: 'Settings',
        icon: '/images/backend/side_menu/side_menu (2).svg',
        href: '/settings'
      },
      {
        label: 'Admin Access',
        icon: '/images/backend/side_menu/side_menu (2).svg',
        href: '/admin-access'
        // permission: 'admin-user'
      },
      {
        label: 'Roles',
        icon: '/images/backend/side_menu/side_menu (2).svg',
        href: '/roles'
        // permission: 'role'
      },
      {
        label: 'Permissions',
        icon: '/images/backend/side_menu/side_menu (2).svg',
        href: '/permission'
        // permission: 'permission'
      },
      {
        label: 'Logout',
        icon: '/images/backend/side_menu/side_menu (2).svg',
        href: '/logout'
      }
    ]
  }
]

export default function AdminSidebar () {
  const pathname = usePathname()
  const router = useRouter()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadUser = () => {
      if (typeof window !== 'undefined') {
        const u = localStorage.getItem('user')
        if (u) {
          try {
            setUser(JSON.parse(u))
          } catch (e) {
            console.error('Failed to parse user from local storage', e)
          }
        }
      }
    }

    loadUser()

    const handleUserUpdate = () => loadUser()
    window.addEventListener('user:updated', handleUserUpdate)
    window.addEventListener('auth:updated', handleUserUpdate)

    return () => {
      window.removeEventListener('user:updated', handleUserUpdate)
      window.removeEventListener('auth:updated', handleUserUpdate)
    }
  }, [])

  const checkPermission = permissionKey => {
    if (!user) return false
    if (!permissionKey) return true

    const roleName = user.role?.name || user.role
    if (typeof roleName === 'string') {
      const normalizedRole = roleName.toLowerCase().replace(/[_\s]+/g, '-')
      if (normalizedRole === 'super-admin') return true
    }

    const permissions = user.role?.permissions
    if (Array.isArray(permissions)) {
      return permissions.some(
        p =>
          (p.module && p.module === permissionKey) ||
          (p.name && p.name.toLowerCase().includes(permissionKey.toLowerCase()))
      )
    } else if (permissions && typeof permissions === 'object') {
      const modulePerms = permissions[permissionKey]
      return Array.isArray(modulePerms) && modulePerms.length > 0
    }
    return false
  }

  const filteredMenuSections = useMemo(() => {
    if (!user) return menuSections

    return menuSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => checkPermission(item.permission))
      }))
      .filter(section => section.items.length > 0)
  }, [user])

  const allItems = filteredMenuSections.flatMap(s =>
    s.items.filter(i => i.href !== '/logout')
  )

  const matchScore = href => {
    if (pathname === href) return href.length
    if (pathname.startsWith(href + '/')) return href.length
    return -1
  }
  const activeHref = (() => {
    // if (pathname.startsWith('/users/view-booked-tickets')) return '/users/transactions';
    if (pathname.startsWith('/users/activities')) return '/users/transactions'
    if (pathname.startsWith('/users/rides')) return '/users/transactions'
    if (pathname.startsWith('/users/transactions')) return '/users/transactions'
    let bestHref = ''
    let bestScore = -1
    for (const item of allItems) {
      const sc = matchScore(item.href)
      if (sc > bestScore) {
        bestScore = sc
        bestHref = item.href
      }
    }
    return bestHref
  })()

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}
    }
    setLogoutConfirmOpen(false)
    router.push('/login')
    setLoggingOut(false)
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className='
        w-60 h-full bg-white border-r border-gray-200 
        flex flex-col
      '
      >
        {/* Logo section with black background */}
        <div className='flex-shrink-0 bg-black h-19  pt-6 flex items-center px-4'>
          <div className='w-30 h-25 relative'>
            <Image
              src='/images/logo/fotter_logo.webp'
              alt='DettyFusion Logo'
              width={200}
              height={200}
              className='object-contain'
            />
          </div>
        </div>

        {/* Header */}
        {checkPermission('dashboard') && (
          <div className='px-4 py-1 mt-4 flex-shrink-0'>
            <Link href='/dashboard'>
              <h1 className='text-sm font-semibold text-gray-900 cursor-pointer hover:text-gray-700'>
                Dashboard
              </h1>
            </Link>
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className='flex-1 overflow-y-auto py-4 pb-6 space-y-6 min-h-0'>
          {filteredMenuSections.map((section, sectionIdx) => (
            <div
              key={sectionIdx}
              className={sectionIdx === menuSections.length - 1 ? 'pb-4' : ''}
            >
              {section.title && (
                <div className='px-4 mb-2'>
                  <div className='bg-orange-50 border border-orange-200 rounded-lg px-3 py-2'>
                    <h3 className='text-sm font-semibold text-gray-800 text-center'>
                      {section.title}
                    </h3>
                  </div>
                </div>
              )}
              <ul className='space-y-0.5'>
                {section.items.map(item => {
                  const active = item.href === activeHref

                  if (item.href === '/logout') {
                    return (
                      <li key={item.href}>
                        <button
                          onClick={() => setLogoutConfirmOpen(true)}
                          className='w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md'
                        >
                          <LogOut size={16} className='flex-shrink-0' />
                          <span className='truncate'>Logout</span>
                        </button>
                      </li>
                    )
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          active
                            ? 'text-gray-900 font-medium bg-[#FDE6E6]'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {item.icon === 'lucide-wallet' ? (
                          <Wallet size={16} className='flex-shrink-0' />
                        ) : item.icon === 'lucide-user' ? (
                          <User size={16} className='flex-shrink-0' />
                        ) : item.icon === 'lucide-map' ? (
                          <Map size={16} className='flex-shrink-0' />
                        ) : (
                          <Image
                            src={item.icon}
                            alt={item.label}
                            width={16}
                            height={16}
                            className='flex-shrink-0'
                          />
                        )}
                        <span className='truncate'>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      {logoutConfirmOpen && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!loggingOut) {
                setLogoutConfirmOpen(false)
              }
            }}
          />
          <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-3'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-lg font-semibold text-slate-900'>
                  Logout?
                </div>
                <div className='mt-1 text-sm text-[#5E6582]'>
                  You will be signed out and all local data cleared.
                </div>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  if (!loggingOut) {
                    setLogoutConfirmOpen(false)
                  }
                }}
                className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {loggingOut ? (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Logging out...
                  </span>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
