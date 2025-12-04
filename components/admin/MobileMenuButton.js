'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

export default function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
      aria-label="Toggle sidebar"
    >
      <Menu className="w-6 h-6 text-gray-700" />
    </button>
  );
}
