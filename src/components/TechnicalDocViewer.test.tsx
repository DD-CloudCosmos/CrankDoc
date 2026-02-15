import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TechnicalDocViewer } from './TechnicalDocViewer'
import type { TechnicalDocument, ServiceInterval, Motorcycle } from '@/types/database.types'

// --- Fixtures ---

const baseMoto: Motorcycle = {
  id: 'moto-1',
  make: 'Honda',
  model: 'CBR600RR',
  year_start: 2007,
  year_end: 2012,
  engine_type: 'Inline-4',
  displacement_cc: 599,
  category: 'sport',
  image_url: null,
  generation: '3rd Gen',
  fuel_system: 'EFI',
  dry_weight_kg: 155,
  horsepower: 118,
  torque_nm: 66,
  fuel_capacity_liters: 18,
  oil_capacity_liters: 3.4,
  coolant_capacity_liters: 2.2,
  valve_clearance_intake: '0.16-0.19mm',
  valve_clearance_exhaust: '0.22-0.25mm',
  spark_plug: 'IMR9C-9HES',
  tire_front: '120/70ZR17',
  tire_rear: '180/55ZR17',
  created_at: '2024-01-01T00:00:00Z',
}

const motoNoCapacities: Motorcycle = {
  ...baseMoto,
  id: 'moto-2',
  oil_capacity_liters: null,
  coolant_capacity_liters: null,
  fuel_capacity_liters: null,
}

const wiringDoc: TechnicalDocument = {
  id: 'doc-1',
  motorcycle_id: 'moto-1',
  title: 'CBR600RR Wiring Diagram',
  doc_type: 'wiring_diagram',
  description: 'Simplified electrical overview',
  file_url: 'https://example.com/wiring.svg',
  file_type: 'image/svg+xml',
  source_attribution: 'CrankDoc simplified overview diagram',
  created_at: '2024-01-01T00:00:00Z',
}

const torqueDoc: TechnicalDocument = {
  id: 'doc-2',
  motorcycle_id: 'moto-1',
  title: 'CBR600RR Torque Specifications',
  doc_type: 'torque_chart',
  description: null,
  file_url: 'https://example.com/torque.svg',
  file_type: 'image/svg+xml',
  source_attribution: null,
  created_at: '2024-01-01T00:00:00Z',
}

const baseInterval: ServiceInterval = {
  id: 'si-1',
  motorcycle_id: 'moto-1',
  service_name: 'Engine Oil Change',
  interval_miles: 4000,
  interval_km: 6400,
  interval_months: 12,
  description: 'Replace engine oil and filter',
  torque_spec: '26 Nm',
  fluid_spec: '10W-30 Full Synthetic',
  created_at: '2024-01-01T00:00:00Z',
}

const sparkPlugInterval: ServiceInterval = {
  id: 'si-2',
  motorcycle_id: 'moto-1',
  service_name: 'Spark Plug Replacement',
  interval_miles: 16000,
  interval_km: 25600,
  interval_months: null,
  description: null,
  torque_spec: '12 Nm',
  fluid_spec: null,
  created_at: '2024-01-01T00:00:00Z',
}

const brakeFluidInterval: ServiceInterval = {
  id: 'si-3',
  motorcycle_id: 'moto-1',
  service_name: 'Brake Fluid Change',
  interval_miles: 8000,
  interval_km: 12800,
  interval_months: 24,
  description: null,
  torque_spec: null,
  fluid_spec: 'DOT 4',
  created_at: '2024-01-01T00:00:00Z',
}

const forkOilInterval: ServiceInterval = {
  id: 'si-4',
  motorcycle_id: 'moto-1',
  service_name: 'Fork Oil Change',
  interval_miles: 12000,
  interval_km: 19200,
  interval_months: null,
  description: null,
  torque_spec: null,
  fluid_spec: '10W Fork Oil',
  created_at: '2024-01-01T00:00:00Z',
}

const noSpecInterval: ServiceInterval = {
  id: 'si-5',
  motorcycle_id: 'moto-1',
  service_name: 'Chain Adjustment',
  interval_miles: 500,
  interval_km: 800,
  interval_months: null,
  description: null,
  torque_spec: null,
  fluid_spec: null,
  created_at: '2024-01-01T00:00:00Z',
}

// --- Tests ---

describe('TechnicalDocViewer', () => {
  it('renders empty state when no documents and no torque/fluid data', () => {
    render(
      <TechnicalDocViewer
        documents={[]}
        serviceIntervals={[noSpecInterval]}
        motorcycle={motoNoCapacities}
      />
    )
    expect(screen.getByText(/no technical documents available/i)).toBeInTheDocument()
  })

  it('renders tab buttons for available data types', () => {
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval, sparkPlugInterval, brakeFluidInterval]}
        motorcycle={baseMoto}
      />
    )
    expect(screen.getByRole('tab', { name: 'Wiring' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Torque Specs' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Fluids' })).toBeInTheDocument()
  })

  it('switches content when clicking tabs', async () => {
    const user = userEvent.setup()
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval, sparkPlugInterval]}
        motorcycle={baseMoto}
      />
    )

    // First tab (Wiring) is active by default — wiring image visible
    expect(screen.getByAltText('CBR600RR Wiring Diagram')).toBeInTheDocument()

    // Click Torque Specs tab
    await user.click(screen.getByRole('tab', { name: 'Torque Specs' }))
    expect(screen.queryByAltText('CBR600RR Wiring Diagram')).not.toBeInTheDocument()
    expect(screen.getByTestId('torque-table')).toBeInTheDocument()

    // Click Fluids tab
    await user.click(screen.getByRole('tab', { name: 'Fluids' }))
    expect(screen.queryByTestId('torque-table')).not.toBeInTheDocument()
    expect(screen.getByTestId('fluids-table')).toBeInTheDocument()
  })

  it('torque tab renders HTML table with service items and specs', () => {
    render(
      <TechnicalDocViewer
        documents={[]}
        serviceIntervals={[baseInterval, sparkPlugInterval]}
        motorcycle={motoNoCapacities}
      />
    )
    // Only torque tab should show (no wiring, no fluids with no capacities/fluid specs from non-brake/fork)
    const table = screen.getByTestId('torque-table')
    expect(table).toBeInTheDocument()

    // Check column headers
    expect(screen.getByText('Service Item')).toBeInTheDocument()
    expect(screen.getByText('Torque Specification')).toBeInTheDocument()

    // Check rows
    expect(screen.getByText('Engine Oil Change')).toBeInTheDocument()
    expect(screen.getByText('26 Nm')).toBeInTheDocument()
    expect(screen.getByText('Spark Plug Replacement')).toBeInTheDocument()
    expect(screen.getByText('12 Nm')).toBeInTheDocument()
  })

  it('fluids tab renders capacity and spec data', async () => {
    const user = userEvent.setup()
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval, brakeFluidInterval, forkOilInterval]}
        motorcycle={baseMoto}
      />
    )

    // Switch to fluids tab
    await user.click(screen.getByRole('tab', { name: 'Fluids' }))

    const table = screen.getByTestId('fluids-table')
    expect(table).toBeInTheDocument()

    // Capacity headers
    expect(screen.getByText('Fluid')).toBeInTheDocument()
    expect(screen.getByText('Capacity')).toBeInTheDocument()
    expect(screen.getByText('Specification')).toBeInTheDocument()

    // Motorcycle capacity data
    expect(screen.getByText('Engine Oil')).toBeInTheDocument()
    expect(screen.getByText('3.4 L')).toBeInTheDocument()
    expect(screen.getByText('10W-30 Full Synthetic')).toBeInTheDocument()

    expect(screen.getByText('Coolant')).toBeInTheDocument()
    expect(screen.getByText('2.2 L')).toBeInTheDocument()

    expect(screen.getByText('Fuel Tank')).toBeInTheDocument()
    expect(screen.getByText('18 L')).toBeInTheDocument()

    // Fluid specs from intervals
    expect(screen.getByText('Brake Fluid')).toBeInTheDocument()
    expect(screen.getByText('DOT 4')).toBeInTheDocument()

    expect(screen.getByText('Fork Oil')).toBeInTheDocument()
    expect(screen.getByText('10W Fork Oil')).toBeInTheDocument()
  })

  it('wiring tab renders SVG image full-width', () => {
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[]}
        motorcycle={motoNoCapacities}
      />
    )
    const img = screen.getByAltText('CBR600RR Wiring Diagram')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/wiring.svg')
    expect(img).toHaveClass('w-full')
  })

  it('lightbox opens when clicking wiring diagram', async () => {
    const user = userEvent.setup()
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[]}
        motorcycle={motoNoCapacities}
      />
    )

    await user.click(screen.getByLabelText(/view.*full size/i))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-label', 'Viewing CBR600RR Wiring Diagram')
  })

  it('lightbox closes when clicking close button', async () => {
    const user = userEvent.setup()
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[]}
        motorcycle={motoNoCapacities}
      />
    )

    await user.click(screen.getByLabelText(/view.*full size/i))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Close'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lightbox closes when clicking overlay background', async () => {
    const user = userEvent.setup()
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[]}
        motorcycle={motoNoCapacities}
      />
    )

    await user.click(screen.getByLabelText(/view.*full size/i))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('hides tabs with no data', () => {
    render(
      <TechnicalDocViewer
        documents={[]}
        serviceIntervals={[baseInterval]}
        motorcycle={motoNoCapacities}
      />
    )
    // No wiring docs, no fluid data (no capacities, no brake/fork fluid specs) — only torque tab
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    // Content shows directly (single tab skips tab bar)
    expect(screen.getByTestId('torque-table')).toBeInTheDocument()
  })

  it('shows content directly when only one tab has data', () => {
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[]}
        motorcycle={motoNoCapacities}
      />
    )
    // Only wiring data — no tab bar, content shown directly
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getByAltText('CBR600RR Wiring Diagram')).toBeInTheDocument()
  })

  it('shows source attribution in lightbox for wiring diagrams', async () => {
    const user = userEvent.setup()
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[]}
        motorcycle={motoNoCapacities}
      />
    )

    await user.click(screen.getByLabelText(/view.*full size/i))
    // Source appears in lightbox and in card
    const attributions = screen.getAllByText(/Source: CrankDoc simplified overview diagram/)
    expect(attributions.length).toBeGreaterThanOrEqual(1)
  })

  it('deduplicates torque items by service name', () => {
    const duplicateInterval: ServiceInterval = {
      ...baseInterval,
      id: 'si-dup',
      // Same service_name as baseInterval
    }
    render(
      <TechnicalDocViewer
        documents={[]}
        serviceIntervals={[baseInterval, duplicateInterval]}
        motorcycle={motoNoCapacities}
      />
    )
    // Should only show one row for "Engine Oil Change"
    const rows = screen.getAllByText('Engine Oil Change')
    expect(rows).toHaveLength(1)
  })

  it('sets aria-selected on active tab', async () => {
    const user = userEvent.setup()
    render(
      <TechnicalDocViewer
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval]}
        motorcycle={baseMoto}
      />
    )

    const wiringTab = screen.getByRole('tab', { name: 'Wiring' })
    const torqueTab = screen.getByRole('tab', { name: 'Torque Specs' })

    expect(wiringTab).toHaveAttribute('aria-selected', 'true')
    expect(torqueTab).toHaveAttribute('aria-selected', 'false')

    await user.click(torqueTab)
    expect(wiringTab).toHaveAttribute('aria-selected', 'false')
    expect(torqueTab).toHaveAttribute('aria-selected', 'true')
  })
})
