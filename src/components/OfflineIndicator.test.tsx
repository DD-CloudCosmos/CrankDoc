import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { OfflineIndicator } from './OfflineIndicator'

describe('OfflineIndicator', () => {
  beforeEach(() => {
    // Default to online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function goOffline() {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    })
    window.dispatchEvent(new Event('offline'))
  }

  function goOnline() {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    })
    window.dispatchEvent(new Event('online'))
  }

  it('renders nothing when online', () => {
    const { container } = render(<OfflineIndicator />)
    expect(container.firstChild).toBeNull()
  })

  it('shows offline banner when offline event fires', () => {
    render(<OfflineIndicator />)

    act(() => {
      goOffline()
    })

    expect(
      screen.getByText(
        "You're offline — some features may be unavailable"
      )
    ).toBeInTheDocument()
  })

  it('shows back online message when online event fires after being offline', () => {
    render(<OfflineIndicator />)

    // Go offline first
    act(() => {
      goOffline()
    })

    expect(
      screen.getByText(
        "You're offline — some features may be unavailable"
      )
    ).toBeInTheDocument()

    // Come back online
    act(() => {
      goOnline()
    })

    expect(screen.getByText('Back online')).toBeInTheDocument()
  })

  it('shows offline banner on mount when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    })

    render(<OfflineIndicator />)

    expect(
      screen.getByText(
        "You're offline — some features may be unavailable"
      )
    ).toBeInTheDocument()
  })

  it('has aria-live polite for screen readers', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    })

    render(<OfflineIndicator />)

    const banner = screen.getByRole('status')
    expect(banner).toHaveAttribute('aria-live', 'polite')
  })

  it('auto-hides back online message after timeout', () => {
    vi.useFakeTimers()

    render(<OfflineIndicator />)

    // Go offline then online
    act(() => {
      goOffline()
    })
    act(() => {
      goOnline()
    })

    expect(screen.getByText('Back online')).toBeInTheDocument()

    // Advance past the 3s timeout
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText('Back online')).not.toBeInTheDocument()

    vi.useRealTimers()
  })
})
