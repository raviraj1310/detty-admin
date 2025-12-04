"use client"

import { createContext, useContext, useMemo, useState, useCallback } from "react"
import LottieLoader from "./LottieLoader"

const Ctx = createContext(null)

export function GlobalLoaderProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("Loading...")

  const showLoader = useCallback((msg) => {
    setMessage(String(msg || "Loading...") )
    setOpen(true)
  }, [])

  const hideLoader = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ open, message, showLoader, hideLoader }), [open, message, showLoader, hideLoader])

  const animationUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_LOADER_URL || undefined) : undefined
  return (
    <Ctx.Provider value={value}>
      <LottieLoader open={open} message={message} animationUrl={animationUrl} />
      {children}
    </Ctx.Provider>
  )
}

export const useGlobalLoader = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error("useGlobalLoader must be used within GlobalLoaderProvider")
  return v
}