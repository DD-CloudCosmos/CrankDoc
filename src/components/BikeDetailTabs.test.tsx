import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BikeDetailTabs } from './BikeDetailTabs'
import type { TechnicalDocument, ServiceInterval, Motorcycle, Recall } from '@/types/database.types'

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

const motoMinimal: Motorcycle = {
  ...motoNoCapacities,
  id: 'moto-3',
  engine_type: null,
  displacement_cc: null,
  fuel_system: null,
  dry_weight_kg: null,
  horsepower: null,
  torque_nm: null,
  valve_clearance_intake: null,
  valve_clearance_exhaust: null,
  spark_plug: null,
  tire_front: null,
  tire_rear: null,
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

const _sparkPlugInterval: ServiceInterval = {
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

const _noSpecInterval: ServiceInterval = {
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

const baseRecall: Recall = {
  id: 'recall-1',
  nhtsa_campaign_number: '23V456',
  data_source: 'nhtsa',
  manufacturer: 'Honda',
  make: 'Honda',
  model: 'CBR600RR',
  model_year: 2009,
  component: 'Fuel System',
  summary: 'Fuel line may crack causing a leak',
  consequence: 'Fire risk when fuel contacts hot engine',
  remedy: 'Dealers will replace the fuel line free of charge',
  notes: null,
  report_received_date: '2023-08-15',
  park_it: false,
  park_outside: false,
  created_at: '2024-01-01T00:00:00Z',
}

const parkItRecall: Recall = {
  ...baseRecall,
  id: 'recall-2',
  nhtsa_campaign_number: '24V001',
  component: 'Brakes',
  summary: 'Brake caliper bolt may loosen',
  consequence: 'Loss of braking ability',
  remedy: 'Dealers will inspect and replace bolts',
  report_received_date: '2024-01-10',
  park_it: true,
  park_outside: false,
}

// --- Tests ---

describe('BikeDetailTabs', () => {
  it('renders Specs tab as default active tab', () => {
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval]}
      />
    )
    // Specs tab is active by default — SpecSheet content visible
    expect(screen.getByText('Engine')).toBeInTheDocument()
    expect(screen.getByText('599cc')).toBeInTheDocument()
  })

  it('renders tab buttons for all available data types', () => {
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval, brakeFluidInterval]}
      />
    )
    expect(screen.getByRole('tab', { name: 'Specs' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Service' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Fluids' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Wiring' })).toBeInTheDocument()
  })

  it('switches to Service tab and shows service intervals', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[]}
        serviceIntervals={[baseInterval]}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Service' }))
    expect(screen.getByText('Engine Oil Change')).toBeInTheDocument()
  })

  it('switches to Fluids tab and shows fluid data', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval, brakeFluidInterval, forkOilInterval]}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Fluids' }))

    const table = screen.getByTestId('fluids-table')
    expect(table).toBeInTheDocument()

    expect(screen.getByText('Engine Oil')).toBeInTheDocument()
    expect(screen.getByText('3.4 L')).toBeInTheDocument()
    expect(screen.getByText('10W-30 Full Synthetic')).toBeInTheDocument()
    expect(screen.getByText('Coolant')).toBeInTheDocument()
    expect(screen.getByText('2.2 L')).toBeInTheDocument()
    expect(screen.getByText('Fuel Tank')).toBeInTheDocument()
    expect(screen.getByText('18 L')).toBeInTheDocument()
    expect(screen.getByText('Brake Fluid')).toBeInTheDocument()
    expect(screen.getByText('DOT 4')).toBeInTheDocument()
    expect(screen.getByText('Fork Oil')).toBeInTheDocument()
    expect(screen.getByText('10W Fork Oil')).toBeInTheDocument()
  })

  it('switches to Wiring tab and shows wiring diagram', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval]}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Wiring' }))
    const img = screen.getByAltText('CBR600RR Wiring Diagram')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/wiring.svg')
    expect(img).toHaveClass('w-full')
  })

  it('hides tabs with no data', () => {
    render(
      <BikeDetailTabs
        motorcycle={motoNoCapacities}
        documents={[]}
        serviceIntervals={[]}
      />
    )
    // Only specs tab — no tab bar shown
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    // Specs content shown directly
    expect(screen.getByText('Engine')).toBeInTheDocument()
  })

  it('shows content directly when only Specs tab has data', () => {
    render(
      <BikeDetailTabs
        motorcycle={motoNoCapacities}
        documents={[]}
        serviceIntervals={[]}
      />
    )
    // Only Specs tab — no tab bar shown
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getByText('Engine')).toBeInTheDocument()
  })

  it('lightbox opens when clicking wiring diagram', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval]}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Wiring' }))
    await user.click(screen.getByLabelText(/view.*full size/i))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-label', 'Viewing CBR600RR Wiring Diagram')
  })

  it('lightbox closes when clicking close button', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[wiringDoc]}
        serviceIntervals={[]}
      />
    )

    // Only specs and wiring — need to switch to wiring first
    await user.click(screen.getByRole('tab', { name: 'Wiring' }))
    await user.click(screen.getByLabelText(/view.*full size/i))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Close'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lightbox closes when clicking overlay background', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[wiringDoc]}
        serviceIntervals={[]}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Wiring' }))
    await user.click(screen.getByLabelText(/view.*full size/i))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows source attribution in lightbox for wiring diagrams', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[wiringDoc]}
        serviceIntervals={[]}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Wiring' }))
    await user.click(screen.getByLabelText(/view.*full size/i))
    const attributions = screen.getAllByText(/Source: CrankDoc simplified overview diagram/)
    expect(attributions.length).toBeGreaterThanOrEqual(1)
  })

  it('sets aria-selected on active tab', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[wiringDoc]}
        serviceIntervals={[baseInterval]}
      />
    )

    const specsTab = screen.getByRole('tab', { name: 'Specs' })
    const wiringTab = screen.getByRole('tab', { name: 'Wiring' })

    expect(specsTab).toHaveAttribute('aria-selected', 'true')
    expect(wiringTab).toHaveAttribute('aria-selected', 'false')

    await user.click(wiringTab)
    expect(specsTab).toHaveAttribute('aria-selected', 'false')
    expect(wiringTab).toHaveAttribute('aria-selected', 'true')
  })

  it('shows empty state when motorcycle has no specs', () => {
    render(
      <BikeDetailTabs
        motorcycle={motoMinimal}
        documents={[]}
        serviceIntervals={[]}
      />
    )
    expect(screen.getByText(/no specifications available/i)).toBeInTheDocument()
  })

  it('shows Recalls tab with count when recalls are provided', () => {
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[]}
        serviceIntervals={[]}
        recalls={[baseRecall]}
      />
    )
    expect(screen.getByRole('tab', { name: 'Recalls (1)' })).toBeInTheDocument()
  })

  it('switches to Recalls tab and shows recalls in table', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[]}
        serviceIntervals={[]}
        recalls={[baseRecall]}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Recalls (1)' }))
    expect(screen.getByTestId('recall-table-row')).toBeInTheDocument()
    expect(screen.getByText('23V456')).toBeInTheDocument()
    expect(screen.getByText('Fuel System')).toBeInTheDocument()
  })

  it('shows urgency banner when park-it recall is present', async () => {
    const user = userEvent.setup()
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[]}
        serviceIntervals={[]}
        recalls={[parkItRecall]}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Recalls (1)' }))
    expect(screen.getByText(/stop driving this vehicle/i)).toBeInTheDocument()
  })

  it('deduplicates recalls by campaign number', async () => {
    const user = userEvent.setup()
    const duplicateRecall: Recall = { ...baseRecall, id: 'recall-3', model_year: 2010 }
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[]}
        serviceIntervals={[]}
        recalls={[baseRecall, duplicateRecall]}
      />
    )

    // Should deduplicate to 1 recall since same campaign number
    await user.click(screen.getByRole('tab', { name: 'Recalls (1)' }))
    expect(screen.getAllByTestId('recall-table-row')).toHaveLength(1)
  })

  it('does not show Recalls tab when recalls array is empty', () => {
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[]}
        serviceIntervals={[]}
        recalls={[]}
      />
    )
    expect(screen.queryByRole('tab', { name: /recalls/i })).not.toBeInTheDocument()
  })

  it('does not show Recalls tab when recalls prop is omitted', () => {
    render(
      <BikeDetailTabs
        motorcycle={baseMoto}
        documents={[]}
        serviceIntervals={[]}
      />
    )
    expect(screen.queryByRole('tab', { name: /recalls/i })).not.toBeInTheDocument()
  })
})
