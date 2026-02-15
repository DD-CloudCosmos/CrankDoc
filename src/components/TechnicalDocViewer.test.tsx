import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TechnicalDocViewer } from './TechnicalDocViewer'
import type { TechnicalDocument } from '@/types/database.types'

const mockDocs: TechnicalDocument[] = [
  {
    id: 'doc-1',
    motorcycle_id: 'moto-1',
    title: 'CBR600RR Wiring Diagram',
    doc_type: 'wiring_diagram',
    description: 'Complete wiring diagram for 2007-2012 models',
    file_url: 'https://example.com/wiring.png',
    file_type: 'image/png',
    source_attribution: 'Honda Service Manual',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'doc-2',
    motorcycle_id: 'moto-1',
    title: 'Torque Specifications',
    doc_type: 'torque_chart',
    description: null,
    file_url: 'https://example.com/torque.pdf',
    file_type: 'application/pdf',
    source_attribution: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'doc-3',
    motorcycle_id: 'moto-1',
    title: 'Fluid Capacities',
    doc_type: 'fluid_chart',
    description: 'Oil, coolant, and brake fluid specs',
    file_url: 'https://example.com/fluids.svg',
    file_type: 'image/svg+xml',
    source_attribution: null,
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('TechnicalDocViewer', () => {
  it('renders empty state when no documents', () => {
    render(<TechnicalDocViewer documents={[]} />)
    expect(screen.getByText(/no technical documents available/i)).toBeInTheDocument()
  })

  it('renders all document cards', () => {
    render(<TechnicalDocViewer documents={mockDocs} />)
    expect(screen.getByText('CBR600RR Wiring Diagram')).toBeInTheDocument()
    expect(screen.getByText('Torque Specifications')).toBeInTheDocument()
    expect(screen.getByText('Fluid Capacities')).toBeInTheDocument()
  })

  it('renders doc type badges with correct labels', () => {
    render(<TechnicalDocViewer documents={mockDocs} />)
    expect(screen.getByText('Wiring')).toBeInTheDocument()
    expect(screen.getByText('Torque')).toBeInTheDocument()
    expect(screen.getByText('Fluids')).toBeInTheDocument()
  })

  it('renders description when available', () => {
    render(<TechnicalDocViewer documents={mockDocs} />)
    expect(screen.getByText('Complete wiring diagram for 2007-2012 models')).toBeInTheDocument()
    expect(screen.getByText('Oil, coolant, and brake fluid specs')).toBeInTheDocument()
  })

  it('renders source attribution when available', () => {
    render(<TechnicalDocViewer documents={mockDocs} />)
    expect(screen.getByText(/Honda Service Manual/)).toBeInTheDocument()
  })

  it('opens lightbox when clicking an image document', async () => {
    const user = userEvent.setup()
    render(<TechnicalDocViewer documents={mockDocs} />)

    const wiringCard = screen.getByText('CBR600RR Wiring Diagram').closest('[role="button"]')!
    await user.click(wiringCard)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-label', 'Viewing CBR600RR Wiring Diagram')
  })

  it('closes lightbox when clicking close button', async () => {
    const user = userEvent.setup()
    render(<TechnicalDocViewer documents={mockDocs} />)

    const wiringCard = screen.getByText('CBR600RR Wiring Diagram').closest('[role="button"]')!
    await user.click(wiringCard)

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const closeButton = screen.getByLabelText('Close')
    await user.click(closeButton)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes lightbox when clicking overlay background', async () => {
    const user = userEvent.setup()
    render(<TechnicalDocViewer documents={mockDocs} />)

    const wiringCard = screen.getByText('CBR600RR Wiring Diagram').closest('[role="button"]')!
    await user.click(wiringCard)

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const overlay = screen.getByRole('dialog')
    await user.click(overlay)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens PDF in new tab instead of lightbox', async () => {
    const user = userEvent.setup()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<TechnicalDocViewer documents={mockDocs} />)

    const pdfCard = screen.getByText('Torque Specifications').closest('[role="button"]')!
    await user.click(pdfCard)

    expect(openSpy).toHaveBeenCalledWith('https://example.com/torque.pdf', '_blank', 'noopener,noreferrer')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    openSpy.mockRestore()
  })

  it('renders image thumbnails for image documents', () => {
    render(<TechnicalDocViewer documents={mockDocs} />)
    const images = screen.getAllByRole('img')
    // doc-1 (png) and doc-3 (svg) are image types and get thumbnails
    expect(images.length).toBeGreaterThanOrEqual(2)
  })
})
