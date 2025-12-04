'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast({
  open = false,
  onOpenChange,
  title = '',
  description = '',
  variant = 'success',
  duration = 4000,
  position = 'top-right',
  className = ''
}) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    if (!duration || duration <= 0) return;
    const t = setTimeout(() => {
      setVisible(false);
      onOpenChange && onOpenChange(false);
    }, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onOpenChange]);

  const Icon = useMemo(() => {
    if (variant === 'success') return CheckCircle;
    if (variant === 'error') return AlertCircle;
    return Info;
  }, [variant]);

  const iconBg = useMemo(() => {
    if (variant === 'success') return 'bg-[#22C55E]';
    if (variant === 'error') return 'bg-[#EF4444]';
    return 'bg-[#0EA5E9]';
  }, [variant]);

  const containerPos = (() => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6 justify-start';
      case 'top-right':
        return 'top-6 right-6 justify-end';
      case 'bottom-left':
        return 'bottom-6 left-6 justify-start';
      case 'bottom-right':
        return 'bottom-6 right-6 justify-end';
      case 'top':
        return 'top-6 inset-x-0 justify-center';
      case 'bottom':
        return 'bottom-6 inset-x-0 justify-center';
      default:
        return 'top-6 right-6 justify-end';
    }
  })();

  return (
    <div
      className={`fixed ${containerPos} z-[9999] flex px-4 ${className}`}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className={`transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} pointer-events-auto`}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-4 rounded-2xl border border-[#E5E6EF] bg-white px-5 py-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
          <div className={`${iconBg} rounded-full p-2`}> 
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-slate-900">{title}</div>
            {description ? (
              <div className="text-sm text-[#5E6582]">{description}</div>
            ) : null}
          </div>
          <button
            onClick={() => { setVisible(false); onOpenChange && onOpenChange(false); }}
            className="ml-2 rounded-full bg-[#F8FAF9] p-2 text-[#2D3658] hover:bg-[#EEF2F7]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}