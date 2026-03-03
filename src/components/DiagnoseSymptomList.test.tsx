import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiagnoseSymptomList } from './DiagnoseSymptomList'
import type { Motorcycle, DiagnosticTree } from '@/types/database.types'

const mockMotorcycle: Motorcycle = {
  id: 'moto-1',
  make: 'Honda',
  model: 'CBR600RR',
  year_start: 2007,
  year_end: 2012,
  category: 'sport',
  generation: '3rd Gen',
  displacement_cc: 599,
  engine_type: null,
  image_url: null,
  fuel_system: null,
  dry_weight_kg: null,
  horsepower: null,
  torque_nm: null,
  fuel_capacity_liters: null,
  oil_capacity_liters: null,
  coolant_capacity_liters: null,
  valve_clearance_intake: null,
  valve_clearance_exhaust: null,
  spark_plug: null,
  tire_front: null,
  tire_rear: null,
  created_at: '2024-01-01T00:00:00Z',
}

function makeTree(overrides: Partial<DiagnosticTree> = {}): DiagnosticTree {
  return {
    id: 'tree-1',
    motorcycle_id: 'moto-1',
    title: 'Battery Not Charging',
    description: 'Diagnose charging system issues.',
    category: 'electrical',
    difficulty: 'beginner',
    tree_data: { nodes: [] },
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const mockTrees: DiagnosticTree[] = [
  makeTree({ id: 'tree-1', title: 'Battery Not Charging', category: 'electrical', difficulty: 'beginner', description: 'Diagnose charging system issues.' }),
  makeTree({ id: 'tree-2', title: 'Starter Motor Failure', category: 'electrical', difficulty: 'intermediate', description: 'Check starter motor and solenoid.' }),
  makeTree({ id: 'tree-3', title: 'Engine Overheating', category: 'cooling', difficulty: 'advanced', description: 'Diagnose overheating problems.' }),
  makeTree({ id: 'tree-4', title: 'Brake Squeal', category: 'brakes', difficulty: null, description: null }),
]

describe('DiagnoseSymptomList', () => {
  it('renders bike context bar with motorcycle info', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={mockTrees} bikeId="moto-1" />)
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
    expect(screen.getByText(/3rd Gen/)).toBeInTheDocument()
    expect(screen.getByText(/Sport/)).toBeInTheDocument()
  })

  it('shows year range when no generation is set', () => {
    const motoNoGen = { ...mockMotorcycle, generation: null }
    render(<DiagnoseSymptomList motorcycle={motoNoGen} trees={mockTrees} bikeId="moto-1" />)
    expect(screen.getByText(/2007-2012/)).toBeInTheDocument()
  })

  it('shows year-present when year_end is null', () => {
    const motoPresent = { ...mockMotorcycle, generation: null, year_end: null }
    render(<DiagnoseSymptomList motorcycle={motoPresent} trees={mockTrees} bikeId="moto-1" />)
    expect(screen.getByText(/2007-present/)).toBeInTheDocument()
  })

  it('shows "Change" link that points to /diagnose', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={mockTrees} bikeId="moto-1" />)
    const changeLink = screen.getByRole('link', { name: /change/i })
    expect(changeLink).toHaveAttribute('href', '/diagnose')
  })

  it('groups trees by category with section headers', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={mockTrees} bikeId="moto-1" />)
    expect(screen.getByText('Electrical')).toBeInTheDocument()
    expect(screen.getByText('Cooling')).toBeInTheDocument()
    expect(screen.getByText('Brakes')).toBeInTheDocument()
  })

  it('renders tree titles', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={mockTrees} bikeId="moto-1" />)
    expect(screen.getByText('Battery Not Charging')).toBeInTheDocument()
    expect(screen.getByText('Starter Motor Failure')).toBeInTheDocument()
    expect(screen.getByText('Engine Overheating')).toBeInTheDocument()
    expect(screen.getByText('Brake Squeal')).toBeInTheDocument()
  })

  it('tree rows link to /diagnose/{treeId}', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={mockTrees} bikeId="moto-1" />)
    const links = screen.getAllByRole('link')
    const treeLinks = links.filter((link) => link.getAttribute('href')?.startsWith('/diagnose/tree-'))
    expect(treeLinks).toHaveLength(4)
    expect(treeLinks[0]).toHaveAttribute('href', '/diagnose/tree-1')
    expect(treeLinks[1]).toHaveAttribute('href', '/diagnose/tree-2')
    expect(treeLinks[2]).toHaveAttribute('href', '/diagnose/tree-3')
    expect(treeLinks[3]).toHaveAttribute('href', '/diagnose/tree-4')
  })

  it('renders difficulty badges', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={mockTrees} bikeId="moto-1" />)
    expect(screen.getByText('beginner')).toBeInTheDocument()
    expect(screen.getByText('intermediate')).toBeInTheDocument()
    expect(screen.getByText('advanced')).toBeInTheDocument()
  })

  it('does not render difficulty badge when difficulty is null', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={mockTrees} bikeId="moto-1" />)
    // tree-4 has difficulty: null — only 3 badges should render
    const badges = screen.getAllByText(/^(beginner|intermediate|advanced)$/)
    expect(badges).toHaveLength(3)
  })

  it('renders tree description when present', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={mockTrees} bikeId="moto-1" />)
    expect(screen.getByText('Diagnose charging system issues.')).toBeInTheDocument()
    expect(screen.getByText('Diagnose overheating problems.')).toBeInTheDocument()
  })

  it('shows "General Guides" when motorcycle is null', () => {
    render(<DiagnoseSymptomList motorcycle={null} trees={mockTrees} bikeId="general" />)
    expect(screen.getByText('General Guides')).toBeInTheDocument()
    expect(screen.getByText('Universal troubleshooting for all motorcycles')).toBeInTheDocument()
  })

  it('renders empty state when trees array is empty', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={[]} bikeId="moto-1" />)
    expect(screen.getByText('No diagnostic guides found for this motorcycle')).toBeInTheDocument()
    const backLink = screen.getByRole('link', { name: /back to bike selection/i })
    expect(backLink).toHaveAttribute('href', '/diagnose')
  })

  it('renders heading "What\'s the problem?"', () => {
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={mockTrees} bikeId="moto-1" />)
    expect(screen.getByRole('heading', { name: /what's the problem/i })).toBeInTheDocument()
  })

  it('groups trees with null category under "General"', () => {
    const treesWithNull: DiagnosticTree[] = [
      makeTree({ id: 'tree-null', title: 'General Check', category: null }),
    ]
    render(<DiagnoseSymptomList motorcycle={mockMotorcycle} trees={treesWithNull} bikeId="moto-1" />)
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('General Check')).toBeInTheDocument()
  })
})
