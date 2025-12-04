'use client';

import Image from 'next/image';

export default function AdminHeader() {
  return (
    <header className="bg-black h-16 flex items-center relative z-10">
      {/* Logo positioned in the left corner (sidebar area) */}
      <div className="w-60 flex items-center px-4">
        <div className="flex items-center">
          <div className="w-10 h-10 relative flex-shrink-0">
            <Image
              src="/images/logo/fotter_logo.webp"
              alt="DettyFusion Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        </div>
      </div>
      
      {/* Main content area of header */}
      <div className="flex-1 bg-black">
        {/* Additional header content can go here */}
      </div>
    </header>
  );
}
