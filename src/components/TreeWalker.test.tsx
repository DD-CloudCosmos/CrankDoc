import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreeWalker } from './TreeWalker'
import type { DecisionTreeData } from '@/types/database.types'
import { GARAGE_STORAGE_KEY } from '@/lib/garage'

const mockTreeData: DecisionTreeData = {
  nodes: [
    {
      id: 'start',
      type: 'question',
      text: 'Does the engine turn over?',
      safety: 'green',
      options: [
        { text: 'Yes, it cranks', next: 'cranks' },
        { text: 'No, nothing happens', next: 'no_crank' },
      ],
    },
    {
      id: 'cranks',
      type: 'check',
      text: 'Check battery voltage',
      safety: 'green',
      instructions: 'Use a multimeter to measure battery voltage.',
      next: 'battery_result',
    },
    {
      id: 'no_crank',
      type: 'solution',
      text: 'Dead battery',
      safety: 'green',
      action: 'Charge or replace battery',
      details: 'Connect a battery charger or replace the battery.',
    },
    {
      id: 'battery_result',
      type: 'question',
      text: 'What is the voltage?',
      safety: 'yellow',
      warning: 'Be careful with electrical components.',
      options: [
        { text: 'Below 12V', next: 'low_battery' },
        { text: 'Above 12V', next: 'good_battery' },
      ],
    },
    {
      id: 'low_battery',
      type: 'solution',
      text: 'Low battery charge',
      safety: 'green',
      action: 'Charge battery',
      details: 'Use a battery tender to charge.',
    },
    {
      id: 'good_battery',
      type: 'solution',
      text: 'Battery is fine - check starter',
      safety: 'yellow',
      action: 'Inspect starter motor',
      details: 'Test starter relay and motor.',
    },
  ],
}

describe('TreeWalker', () => {
  it('renders the first node (start) on mount', () => {
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
    expect(screen.getByText("Does the engine turn over?")).toBeInTheDocument()
  })

  it('displays options for question nodes', () => {
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
    expect(screen.getByText('Yes, it cranks')).toBeInTheDocument()
    expect(screen.getByText('No, nothing happens')).toBeInTheDocument()
  })

  it('navigates to next node when option is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByText('Dead battery')).toBeInTheDocument()
    expect(screen.getByText('Charge or replace battery')).toBeInTheDocument()
  })

  it('shows instructions for check nodes', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('Yes, it cranks'))

    expect(screen.getByText('Check battery voltage')).toBeInTheDocument()
    expect(screen.getByText('Use a multimeter to measure battery voltage.')).toBeInTheDocument()
  })

  it('shows continue button for check nodes', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('Yes, it cranks'))

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('navigates from check node to next node on continue', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('Yes, it cranks'))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText('What is the voltage?')).toBeInTheDocument()
  })

  it('displays safety warning when present', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('Yes, it cranks'))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText('Be careful with electrical components.')).toBeInTheDocument()
  })

  it('shows solution details for solution nodes', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByText('Dead battery')).toBeInTheDocument()
    expect(screen.getByText('Charge or replace battery')).toBeInTheDocument()
    expect(screen.getByText('Connect a battery charger or replace the battery.')).toBeInTheDocument()
  })

  it('shows back button after navigating away from start', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('navigates back to previous node when back button is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))
    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(screen.getByText('Does the engine turn over?')).toBeInTheDocument()
  })

  it('shows restart button on solution nodes', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument()
  })

  it('restarts tree when restart button is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))
    await user.click(screen.getByRole('button', { name: /start over/i }))

    expect(screen.getByText('Does the engine turn over?')).toBeInTheDocument()
  })

  it('shows step counter (progress)', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    expect(screen.getByText(/step 1/i)).toBeInTheDocument()

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByText(/step 2/i)).toBeInTheDocument()
  })

  it('displays the tree title', () => {
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
  })

  it('displays safety badge for current node', () => {
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
    expect(screen.getByText('Beginner-safe')).toBeInTheDocument()
  })

  it('shows the answers given so far', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
    expect(screen.queryByRole('heading', { name: 'Your answers' })).not.toBeInTheDocument()

    await user.click(screen.getByText('Yes, it cranks'))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    const trail = screen.getByRole('heading', { name: 'Your answers' }).closest('section')!
    expect(trail).toHaveTextContent('Yes, it cranks')
    expect(trail).toHaveTextContent('Check battery voltage')
  })

  describe('with an experience level set', () => {
    beforeEach(() => window.localStorage.clear())

    it('flags a care-required step for beginners', async () => {
      window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ bikeIds: [], skill: 'beginner', onboarded: true }))
      const user = userEvent.setup()
      render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
      expect(screen.queryByText(/above the experience level/i)).not.toBeInTheDocument()

      await user.click(screen.getByText('Yes, it cranks'))
      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByText(/above the experience level/i)).toBeInTheDocument()
      // The step is still fully shown
      expect(screen.getByText('What is the voltage?')).toBeInTheDocument()
    })
  })
})
