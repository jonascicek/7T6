const sanitizeRouteSegment = (segment: string) =>
  segment
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9-_/]/g, '')

const configuredSegment = sanitizeRouteSegment(import.meta.env.VITE_ADMIN_ROUTE_SEGMENT || '')
const fallbackSegment = 'intern-7t6-entry-a94k1x'

const adminBaseSegment = configuredSegment || fallbackSegment

export const adminLoginPath = `/${adminBaseSegment}`
export const adminPanelPath = `/${adminBaseSegment}/panel`

const legacyAdminPaths = new Set(['/admin', '/admin/login'])
export const isLegacyAdminPath = (pathname: string) => legacyAdminPaths.has(pathname)

export const isAdminLoginPath = (pathname: string) => pathname === adminLoginPath
export const isAdminPanelPath = (pathname: string) => pathname === adminPanelPath
