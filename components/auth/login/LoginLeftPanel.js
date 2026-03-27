'use client'

import Image from 'next/image'

export default function LoginLeftPanel ({
  backgroundImage = '/images/logo/logo.png'
}) {
  return (
    <div className='relative hidden lg:block bg-black overflow-hidden'>
      <Image
        src={backgroundImage}
        alt='Welcome back'
        fill
        priority
        className='object-contain p-10'
      />

      <div className='absolute inset-0 bg-gradient-to-tr from-black/30 via-black/10 to-transparent' />
    </div>
  )
}
