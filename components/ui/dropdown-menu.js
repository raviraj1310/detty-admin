'use client'

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

const DropdownMenuContext = createContext(null)

const cx = (...classes) => classes.filter(Boolean).join(' ')

const composeEventHandlers = (theirHandler, ourHandler) => event => {
  theirHandler?.(event)
  if (!event.defaultPrevented) ourHandler?.(event)
}

const composeRefs =
  (...refs) =>
  node => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(node)
      else ref.current = node
    }
  }

export function DropdownMenu ({ children, open, onOpenChange, className }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = typeof open === 'boolean'
  const isOpen = isControlled ? open : uncontrolledOpen

  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const contentRef = useRef(null)

  const setOpen = next => {
    const value = typeof next === 'function' ? next(isOpen) : next
    if (!isControlled) setUncontrolledOpen(value)
    onOpenChange?.(value)
  }

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = event => {
      const wrapper = wrapperRef.current
      if (!wrapper) return
      if (wrapper.contains(event.target)) return
      setOpen(false)
    }

    const handleKeyDown = event => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen,
      refs: { wrapperRef, triggerRef, contentRef }
    }),
    [isOpen]
  )

  return (
    <DropdownMenuContext.Provider value={value}>
      <div ref={wrapperRef} className={cx('relative inline-block', className)}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger ({ children, asChild, onClick, ...props }) {
  const ctx = useContext(DropdownMenuContext)
  if (!ctx) return null

  const handleClick = composeEventHandlers(onClick, () =>
    ctx.setOpen(prev => !prev)
  )

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ...props,
      onClick: composeEventHandlers(children.props?.onClick, handleClick),
      ref: composeRefs(children.ref, ctx.refs.triggerRef)
    })
  }

  return (
    <button
      type='button'
      {...props}
      ref={ctx.refs.triggerRef}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent ({
  children,
  align = 'start',
  className,
  ...props
}) {
  const ctx = useContext(DropdownMenuContext)
  if (!ctx || !ctx.open) return null

  const alignClass = align === 'end' ? 'right-0' : 'left-0'

  return (
    <div
      {...props}
      ref={ctx.refs.contentRef}
      role='menu'
      className={cx(
        'absolute z-50 mt-2 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl',
        alignClass,
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem ({
  children,
  onClick,
  disabled,
  className,
  ...props
}) {
  const ctx = useContext(DropdownMenuContext)
  if (!ctx) return null

  const handleClick = composeEventHandlers(onClick, () => ctx.setOpen(false))

  return (
    <button
      type='button'
      role='menuitem'
      disabled={disabled}
      {...props}
      onClick={handleClick}
      className={cx(
        'flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  )
}
