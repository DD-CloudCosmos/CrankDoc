import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstallPrompt } from './InstallPrompt'

describe('InstallPrompt', () => {
  it('renders nothing when no beforeinstallprompt event has fired', () => {
    const { container } = render(<InstallPrompt />)
    expect(container.innerHTML).toBe('')
  })

  it('shows install banner when beforeinstallprompt fires', () => {
    render(<InstallPrompt />)

    act(() => {
      const event = new Event('beforeinstallprompt')
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      Object.defineProperty(event, 'prompt', { value: vi.fn().mockResolvedValue(undefined) })
      Object.defineProperty(event, 'userChoice', { value: Promise.resolve({ outcome: 'dismissed' }) })
      window.dispatchEvent(event)
    })

    expect(screen.getByText('Install CrankDoc')).toBeInTheDocument()
    expect(screen.getByText('Add to your home screen for quick access')).toBeInTheDocument()
  })

  it('hides banner when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    render(<InstallPrompt />)

    act(() => {
      const event = new Event('beforeinstallprompt')
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      Object.defineProperty(event, 'prompt', { value: vi.fn().mockResolvedValue(undefined) })
      Object.defineProperty(event, 'userChoice', { value: Promise.resolve({ outcome: 'dismissed' }) })
      window.dispatchEvent(event)
    })

    expect(screen.getByText('Install CrankDoc')).toBeInTheDocument()

    const buttons = screen.getAllByRole('button')
    const dismissButton = buttons.find(btn => btn.textContent !== 'Install')!
    await user.click(dismissButton)

    expect(screen.queryByText('Install CrankDoc')).not.toBeInTheDocument()
  })

  it('calls prompt when install button is clicked', async () => {
    const user = userEvent.setup()
    const promptFn = vi.fn().mockResolvedValue(undefined)
    render(<InstallPrompt />)

    act(() => {
      const event = new Event('beforeinstallprompt')
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      Object.defineProperty(event, 'prompt', { value: promptFn })
      Object.defineProperty(event, 'userChoice', { value: Promise.resolve({ outcome: 'accepted' }) })
      window.dispatchEvent(event)
    })

    const installButton = screen.getByRole('button', { name: 'Install' })
    await user.click(installButton)

    expect(promptFn).toHaveBeenCalled()
  })
})
