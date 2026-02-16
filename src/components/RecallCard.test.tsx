import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecallCard } from './RecallCard'
import type { Recall } from '@/types/database.types'

const baseRecall: Recall = {
  id: 'recall-1',
  nhtsa_campaign_number: '24V-567',
  data_source: 'NHTSA',
  manufacturer: 'Honda',
  make: 'Honda',
  model: 'CBR600RR',
  model_year: 2022,
  component: 'Fuel System',
  summary: 'Fuel hose may crack under heat causing a fuel leak.',
  consequence: 'A fuel leak in the presence of an ignition source increases the risk of fire.',
  remedy: 'Dealers will replace the fuel hose free of charge.',
  notes: null,
  report_received_date: '2024-03-15',
  park_it: false,
  park_outside: false,
  created_at: '2024-03-20T00:00:00Z',
}

describe('RecallCard', () => {
  it('renders all fields correctly', () => {
    render(<RecallCard recall={baseRecall} />)

    expect(screen.getByText('24V-567')).toBeInTheDocument()
    expect(screen.getByText('Fuel System')).toBeInTheDocument()
    expect(screen.getByText('Fuel hose may crack under heat causing a fuel leak.')).toBeInTheDocument()
    expect(screen.getByText('A fuel leak in the presence of an ignition source increases the risk of fire.')).toBeInTheDocument()
    expect(screen.getByText('Dealers will replace the fuel hose free of charge.')).toBeInTheDocument()
    expect(screen.getByText('Consequence')).toBeInTheDocument()
    expect(screen.getByText('Remedy')).toBeInTheDocument()
    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument()
  })

  it('has the recall-card test id', () => {
    render(<RecallCard recall={baseRecall} />)
    expect(screen.getByTestId('recall-card')).toBeInTheDocument()
  })

  it('shows PARK IT badge when park_it is true', () => {
    const recall: Recall = { ...baseRecall, park_it: true }
    render(<RecallCard recall={recall} />)
    expect(screen.getByText('PARK IT')).toBeInTheDocument()
  })

  it('shows PARK OUTSIDE badge when park_outside is true', () => {
    const recall: Recall = { ...baseRecall, park_outside: true }
    render(<RecallCard recall={recall} />)
    expect(screen.getByText('PARK OUTSIDE')).toBeInTheDocument()
  })

  it('hides park badges when both are false', () => {
    render(<RecallCard recall={baseRecall} />)
    expect(screen.queryByText('PARK IT')).not.toBeInTheDocument()
    expect(screen.queryByText('PARK OUTSIDE')).not.toBeInTheDocument()
  })

  it('shows both park badges when both are true', () => {
    const recall: Recall = { ...baseRecall, park_it: true, park_outside: true }
    render(<RecallCard recall={recall} />)
    expect(screen.getByText('PARK IT')).toBeInTheDocument()
    expect(screen.getByText('PARK OUTSIDE')).toBeInTheDocument()
  })

  it('handles null component gracefully', () => {
    const recall: Recall = { ...baseRecall, component: null }
    render(<RecallCard recall={recall} />)
    expect(screen.getByText('24V-567')).toBeInTheDocument()
    // CardTitle should not be rendered
    expect(screen.queryByText('Fuel System')).not.toBeInTheDocument()
  })

  it('handles null summary', () => {
    const recall: Recall = { ...baseRecall, summary: null }
    render(<RecallCard recall={recall} />)
    expect(screen.getByText('24V-567')).toBeInTheDocument()
    expect(screen.queryByText('Fuel hose may crack under heat causing a fuel leak.')).not.toBeInTheDocument()
  })

  it('handles null consequence', () => {
    const recall: Recall = { ...baseRecall, consequence: null }
    render(<RecallCard recall={recall} />)
    expect(screen.getByText('24V-567')).toBeInTheDocument()
    expect(screen.queryByText('Consequence')).not.toBeInTheDocument()
  })

  it('handles null remedy', () => {
    const recall: Recall = { ...baseRecall, remedy: null }
    render(<RecallCard recall={recall} />)
    expect(screen.getByText('24V-567')).toBeInTheDocument()
    expect(screen.queryByText('Remedy')).not.toBeInTheDocument()
  })

  it('handles null report_received_date', () => {
    const recall: Recall = { ...baseRecall, report_received_date: null }
    render(<RecallCard recall={recall} />)
    expect(screen.getByText('24V-567')).toBeInTheDocument()
    // Date should not appear; campaign number still shows
    expect(screen.queryByText('Mar 15, 2024')).not.toBeInTheDocument()
  })
})
