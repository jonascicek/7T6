import React, { useCallback, useEffect, useMemo, useState } from 'react'

type NavigateOptions = {
  replace?: boolean
}

type LocationState = {
  pathname: string
}

const NAVIGATE_EVENT = '7t6:navigate'

const notifyNavigation = () => {
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

const isExternalUrl = (to: string) => /^([a-z]+:)?\/\//i.test(to) || to.startsWith('mailto:') || to.startsWith('tel:')

export const navigateTo = (to: string, options: NavigateOptions = {}) => {
  if (typeof window === 'undefined') return

  const nextUrl = to || '/'
  if (options.replace) {
    window.history.replaceState({}, '', nextUrl)
  } else {
    window.history.pushState({}, '', nextUrl)
  }

  notifyNavigation()
  window.scrollTo(0, 0)
}

export function useLocation(): LocationState {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const updateLocation = () => setPathname(window.location.pathname)

    window.addEventListener('popstate', updateLocation)
    window.addEventListener(NAVIGATE_EVENT, updateLocation)

    return () => {
      window.removeEventListener('popstate', updateLocation)
      window.removeEventListener(NAVIGATE_EVENT, updateLocation)
    }
  }, [])

  return useMemo(() => ({ pathname }), [pathname])
}

export function useNavigate() {
  return useCallback((to: string, options: NavigateOptions = {}) => {
    navigateTo(to, options)
  }, [])
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string
}

export function Link({ to, onClick, target, rel, children, ...rest }: LinkProps) {
  const navigate = useNavigate()

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      target === '_blank' ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      isExternalUrl(to)
    ) {
      return
    }

    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} target={target} rel={rel} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}

type NavigateProps = {
  to: string
  replace?: boolean
}

export function Navigate({ to, replace = false }: NavigateProps) {
  useEffect(() => {
    navigateTo(to, { replace })
  }, [replace, to])

  return null
}
