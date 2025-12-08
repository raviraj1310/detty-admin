'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
import { Wallet, User, Map, LogOut, AlertCircle, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

const menuSections = [
  {
    title: null,
    items: [
      {
        label: 'Users',
        icon: '/images/backend/side_menu/side_menu (1).svg',
        href: '/users'
      },
      // { label: 'Profile', icon: 'lucide-user', href: '/users/profile' },
      // { label: 'Itinerary', icon: 'lucide-map', href: '/users/itinerary' },
      {
        label: 'Bookings',
        icon: '/images/backend/side_menu/side_menu (1).svg',
        href: '/users/transactions'
      },

      {
        label: 'Discover Events',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/discover-events'
      },
      {
        label: 'Places to Visit',
        icon: '/images/backend/side_menu/side_menu (10).svg',
        href: '/places-to-visit'
      },
      // { label: 'Accommodation', icon: '/images/backend/side_menu/side_menu (3).svg', href: '/users/accommodation' },
      {
        label: 'Merchandise',
        icon: '/images/backend/side_menu/side_menu (6).svg',
        href: '/merchandise'
      },
      // { label: 'Travel Bundles', icon: '/images/backend/side_menu/side_menu (4).svg', href: '/users/travel-bundles' },
      // { label: 'DIY', icon: '/images/backend/side_menu/side_menu (5).svg', href: '/users/diy' },
      {
        label: 'VISA Applications',
        icon: '/images/backend/side_menu/side_menu (13).svg',
        href: '/visa'
      },
      { label: 'Wallet', icon: 'lucide-wallet', href: '/users/wallet' },
      {
        label: 'Email Subscription',
        icon: 'lucide-wallet',
        href: '/email-subscription'
      },
      {
        label: 'Contact us Enquiries',
        icon: 'lucide-wallet',
        href: '/contact'
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
        href: '/cms/landing-page'
      },
      {
        label: 'About Us',
        icon: '/images/backend/side_menu/side_menu (14).svg',
        href: '/cms/about-us'
      },
      {
        label: 'Partner With Us',
        icon: '/images/backend/side_menu/side_menu (14).svg',
        href: '/cms/partner-with-us'
      },
      {
        label: 'FAQs',
        icon: '/images/backend/side_menu/side_menu (11).svg',
        href: '/cms/faqs'
      },
      {
        label: 'Blog',
        icon: '/images/backend/side_menu/side_menu (11).svg',
        href: '/cms/blog'
      },
      {
        label: 'Terms & Conditions',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/cms/terms-conditions'
      },
      {
        label: 'Terms of Use',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/cms/terms-of-use'
      },
      {
        label: 'Privacy Policy',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/cms/privacy-policy'
      },
      {
        label: 'Cookie Settings',
        icon: '/images/backend/side_menu/side_menu (7).svg',
        href: '/cms/cookie-settings'
      }
    ]
  },
  {
    title: 'Masters',
    items: [
      {
        label: 'Event Type',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/event-type'
      },
      {
        label: 'Discounts',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/discount'
      },
      {
        label: 'Event Service Provider',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/event-service-provider'
      },
      {
        label: 'Activity Type',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/activity-type'
      },
      {
        label: 'Merchandise Category',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/merchandise-category'
      },
      // { label: 'Facilities', icon: '/images/backend/side_menu/side_menu (12).svg', href: '/masters/facilities' },
      {
        label: 'Promo Banner',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/promo-banner'
      },
      {
        label: 'Trusted Partners',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/trusted-partners'
      },
      {
        label: 'FAQ Categories',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/faq-categories'
      },
      {
        label: 'Country',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/country'
      },
      {
        label: 'State',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/state'
      },
      {
        label: 'City',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/city'
      },
      {
        label: 'Accommodation Promo Banner',
        icon: '/images/backend/side_menu/side_menu (12).svg',
        href: '/masters/accommodation-promo-banner'
      }
    ]
  },
  {
    title: 'User Access',
    items: [
      {
        label: 'Admin Settings',
        icon: '/images/backend/side_menu/side_menu (2).svg',
        href: '/settings'
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

  const allItems = menuSections.flatMap(s =>
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
        <div className='px-4 py-1 mt-4 flex-shrink-0'>
          <h1 className='text-sm font-semibold text-gray-900'>Dashboard</h1>
        </div>

        {/* Navigation - Scrollable */}
        <nav className='flex-1 overflow-y-auto py-4 pb-6 space-y-6 min-h-0'>
          {menuSections.map((section, sectionIdx) => (
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
