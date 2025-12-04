'use client';

import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-black py-4 px-6 border-b border-gray-800">
      <div className="flex items-center">
        <div className="w-40 h-40 relative">
          <Image
            src="/images/logo/logo.jpg"
            alt="DettyFusion Logo"
            width={234}
            height={234}
            className="object-contine"
          />
        </div>
      </div>
    </header>
  );
}
