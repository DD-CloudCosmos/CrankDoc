// Keep the service worker's PRIVATE_PATHS in sync with these roots.
const PRIVATE_PATHS = ['/garage', '/account', '/auth', '/api/garage']

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}
