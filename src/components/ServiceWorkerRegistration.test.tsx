import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration'

describe('ServiceWorkerRegistration', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: {
        register: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env.NODE_ENV = originalEnv
  })

  it('renders nothing visually', () => {
    const { container } = render(<ServiceWorkerRegistration />)
    expect(container.innerHTML).toBe('')
  })

  it('does not register service worker in non-production environment', () => {
    process.env.NODE_ENV = 'test'
    render(<ServiceWorkerRegistration />)
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled()
  })

  it('registers service worker in production environment', async () => {
    process.env.NODE_ENV = 'production'
    render(<ServiceWorkerRegistration />)

    await vi.waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
    })
  })
})
