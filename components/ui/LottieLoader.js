"use client"

import { useEffect, useRef } from "react"

export default function LottieLoader({
  open,
  message = "Loading...",
  animationUrl = "https://assets9.lottiefiles.com/packages/lf20_usmfx6bp.json",
  accentColor = "#FF5B2C",
  overlayOpacity = 0.25,
  variant = "brand"
}) {
  const containerRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    if (!open) {
      if (animRef.current) {
        try { animRef.current.destroy() } catch {}
        animRef.current = null
      }
      return
    }

    const ensureScript = () => new Promise((resolve) => {
      const isDotLottie = String(animationUrl || '').toLowerCase().endsWith('.lottie')
      if (isDotLottie) {
        if (typeof window !== 'undefined' && customElements.get('dotlottie-wc')) return resolve()
        const s = document.createElement('script')
        s.src = 'https://unpkg.com/@lottiefiles/[email protected]/dist/dotlottie-wc.js'
        s.type = 'module'
        s.onload = () => resolve()
        document.head.appendChild(s)
      } else {
        if (typeof window !== "undefined" && window.lottie) return resolve()
        const s = document.createElement("script")
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"
        s.async = true
        s.onload = () => resolve()
        document.head.appendChild(s)
      }
    })

    const load = async () => {
      await ensureScript()
      const isDotLottie = String(animationUrl || '').toLowerCase().endsWith('.lottie')
      if (!containerRef.current) return
      if (isDotLottie && typeof window !== 'undefined') {
        containerRef.current.innerHTML = ''
        const el = document.createElement('dotlottie-wc')
        el.setAttribute('src', animationUrl)
        el.setAttribute('loop', '')
        el.setAttribute('autoplay', '')
        el.setAttribute('speed', '1')
        el.style.width = '100%'
        el.style.height = '100%'
        containerRef.current.appendChild(el)
      } else if (window.lottie) {
        animRef.current = window.lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: animationUrl
        })
      }
    }
    load()

    return () => {
      if (animRef.current) {
        try { animRef.current.destroy() } catch {}
        animRef.current = null
      }
    }
  }, [open, animationUrl])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/[0.25] backdrop-blur-sm">
      <div className="absolute inset-0"  />
      <div className="relative z-[1001] flex flex-col items-center gap-3">
        <div className="text-sm font-semibold  text-white-900">{message}</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: accentColor, animation: "pulse 1.2s ease-in-out infinite" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: accentColor, animation: "pulse 1.2s ease-in-out infinite", animationDelay: "0.2s" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: accentColor, animation: "pulse 1.2s ease-in-out infinite", animationDelay: "0.4s" }} />
        </div>
        <style jsx>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg);} }
          @keyframes pulse { 0% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.25); opacity: 1; } 100% { transform: scale(1); opacity: 0.6; } }
        `}</style>
      </div>
    </div>
  )
}