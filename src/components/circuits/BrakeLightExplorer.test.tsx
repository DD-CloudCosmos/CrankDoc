import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrakeLightExplorer } from './BrakeLightExplorer'

describe('brake-light learning', () => {
  it('lets either brake operate the lamp only with the ignition on', async () => {
    const user = userEvent.setup()
    render(<BrakeLightExplorer />)
    expect(screen.getByRole('status', { name: 'Lamp state' })).toHaveTextContent('Brake light off')
    await user.click(screen.getByRole('button', { name: 'Front brake' }))
    expect(screen.getByRole('status', { name: 'Lamp state' })).toHaveTextContent('Brake light off')
    await user.click(screen.getByRole('button', { name: 'Ignition' }))
    expect(screen.getByRole('status', { name: 'Lamp state' })).toHaveTextContent('Brake light on')
    await user.click(screen.getByRole('button', { name: 'Front brake' }))
    await user.click(screen.getByRole('button', { name: 'Rear brake' }))
    expect(screen.getByRole('status', { name: 'Lamp state' })).toHaveTextContent('Brake light on')
  })
  it('preserves circuit state between modes and resets it on restart', async () => {
    const user = userEvent.setup()
    render(<BrakeLightExplorer />)
    await user.click(screen.getByRole('button', { name: 'Ignition' }))
    await user.click(screen.getByRole('button', { name: 'Front brake' }))
    await user.click(screen.getByRole('radio', { name: 'Explore' }))
    expect(screen.getByRole('status', { name: 'Lamp state' })).toHaveTextContent('Brake light on')
    await user.click(screen.getByRole('radio', { name: 'Teach me' }))
    await user.click(screen.getByRole('button', { name: 'Restart lesson' }))
    expect(screen.getByRole('button', { name: 'Ignition' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status', { name: 'Lamp state' })).toHaveTextContent('Brake light off')
  })
  it('explains selected wire codes without changing electrical state', async () => {
    const user = userEvent.setup()
    render(<BrakeLightExplorer />)
    await user.click(screen.getByRole('button', { name: 'Select Brake feed' }))
    expect(screen.getByRole('region', { name: 'Selected connection' })).toHaveTextContent('Green / yellow')
    expect(screen.getByRole('region', { name: 'Selected connection' })).toHaveTextContent('Black / yellow')
    expect(screen.getByRole('status', { name: 'Lamp state' })).toHaveTextContent('Brake light off')
  })
  it('gives explanatory prediction feedback and returns to previous steps', async () => {
    const user = userEvent.setup()
    render(<BrakeLightExplorer />)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Both brakes are required' }))
    expect(screen.getByText(/Each switch can complete the circuit on its own/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Either brake is enough' }))
    expect(screen.getByText(/Correct. The switches are in parallel/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Complete the path' })).toBeInTheDocument()
  })
})

it('zooms the drawing itself on narrow screens and allows long answers to wrap', async () => {
  const user = userEvent.setup()
  render(<BrakeLightExplorer />)
  await user.click(screen.getByRole('button', { name: 'Zoom in' }))
  expect(screen.getByRole('img', { name: /Honda brake-light circuit/ }).parentElement).toHaveClass('min-w-[1400px]')
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(screen.getByRole('button', { name: 'Next' }))
  expect(screen.getByRole('button', { name: 'Both brakes are required' })).toHaveClass('whitespace-normal', 'max-w-full')
})
