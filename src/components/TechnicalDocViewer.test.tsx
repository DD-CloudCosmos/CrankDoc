import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TechnicalDocViewer } from './TechnicalDocViewer'
import type { TechnicalDocument } from '@/types/database.types'

const mockImageDoc: TechnicalDocument = {
  id: 'doc-1',
  motorcycle_id: 'moto-1',
  title: 'CBR600RR Wiring Diagram',
  doc_type: 'wiring_diagram',
  description: 'Complete wiring diagram for 2007-2012 models',
  file_url: 'https://example.com/wiring.png',
  file_type: 'image/png',
  source_attribution: 'Honda Service Manual',
  created_at: '2024-01-01T00:00:00Z',
}

const mockPdfDoc: TechnicalDocument = {
  id: 'doc-2',
  motorcycle_id: 'moto-1',
  title: 'Torque Specifications',
  doc_type: 'torque_chart',
  description: 'Complete torque specs for all fasteners.',
  file_url: 'https://example.com/torque.pdf',
  file_type: 'application/pdf',
  source_attribution: null,
  created_at: '2024-01-01T00:00:00Z',
}

const mockMinimalDoc: TechnicalDocument = {
  id: 'doc-3',
  motorcycle_id: 'moto-1',
  title: 'Fluid Capacities',
  doc_type: 'fluid_chart',
  description: null,
  file_url: 'https://example.com/fluids.svg',
  file_type: 'image/svg+xml',
  source_attribution: null,
  created_at: '2024-01-01T00:00:00Z',
}

const allDocs = [mockImageDoc, mockPdfDoc, mockMinimalDoc]

describe('TechnicalDocViewer', () => {
  it('renders empty state when no documents', () => {
    render(<TechnicalDocViewer documents={[]} />)
    expect(screen.getByText(/no technical documents available/i)).toBeInTheDocument()
  })

  it('renders all document cards', () => {
    render(<TechnicalDocViewer documents={allDocs} />)
    expect(screen.getByText('CBR600RR Wiring Diagram')).toBeInTheDocument()
    expect(screen.getByText('Torque Specifications')).toBeInTheDocument()
    expect(screen.getByText('Fluid Capacities')).toBeInTheDocument()
  })

  it('renders doc type badges with correct labels', () => {
    render(<TechnicalDocViewer documents={allDocs} />)
    expect(screen.getByText('Wiring')).toBeInTheDocument()
    expect(screen.getByText('Torque')).toBeInTheDocument()
    expect(screen.getByText('Fluids')).toBeInTheDocument()
  })

  it('renders fallback badge for unknown doc types', () => {
    const unknownDoc: TechnicalDocument = {
      ...mockImageDoc,
      id: 'doc-unknown',
      doc_type: 'custom_type',
    }
    render(<TechnicalDocViewer documents={[unknownDoc]} />)
    expect(screen.getByText('custom_type')).toBeInTheDocument()
  })

  it('renders description when available', () => {
    render(<TechnicalDocViewer documents={allDocs} />)
    expect(screen.getByText('Complete wiring diagram for 2007-2012 models')).toBeInTheDocument()
  })

  it('does not render description when null', () => {
    render(<TechnicalDocViewer documents={[mockMinimalDoc]} />)
    expect(screen.queryByText(/complete wiring/i)).not.toBeInTheDocument()
  })

  it('renders source attribution when available', () => {
    render(<TechnicalDocViewer documents={[mockImageDoc]} />)
    expect(screen.getByText(/Source: Honda Service Manual/)).toBeInTheDocument()
  })

  it('does not render source attribution when null', () => {
    render(<TechnicalDocViewer documents={[mockPdfDoc]} />)
    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument()
  })

  it('renders image thumbnails for image documents', () => {
    render(<TechnicalDocViewer documents={[mockImageDoc]} />)
    const img = screen.getByAltText('CBR600RR Wiring Diagram')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/wiring.png')
  })

  it('does not render image thumbnail for PDF documents', () => {
    render(<TechnicalDocViewer documents={[mockPdfDoc]} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders Download PDF button for PDF documents', () => {
    render(<TechnicalDocViewer documents={[mockPdfDoc]} />)
    expect(screen.getByText('Download PDF')).toBeInTheDocument()
  })

  it('does not render Download PDF button for image documents', () => {
    render(<TechnicalDocViewer documents={[mockImageDoc]} />)
    expect(screen.queryByText('Download PDF')).not.toBeInTheDocument()
  })

  it('opens lightbox when clicking image document', async () => {
    const user = userEvent.setup()
    render(<TechnicalDocViewer documents={[mockImageDoc]} />)

    const card = screen.getByText('CBR600RR Wiring Diagram').closest('[role="button"]')!
    await user.click(card)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-label', 'Viewing CBR600RR Wiring Diagram')
  })

  it('closes lightbox when clicking close button', async () => {
    const user = userEvent.setup()
    render(<TechnicalDocViewer documents={[mockImageDoc]} />)

    const card = screen.getByText('CBR600RR Wiring Diagram').closest('[role="button"]')!
    await user.click(card)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const closeBtn = screen.getByLabelText('Close')
    await user.click(closeBtn)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes lightbox when clicking overlay background', async () => {
    const user = userEvent.setup()
    render(<TechnicalDocViewer documents={[mockImageDoc]} />)

    const card = screen.getByText('CBR600RR Wiring Diagram').closest('[role="button"]')!
    await user.click(card)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const overlay = screen.getByRole('dialog')
    await user.click(overlay)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows source attribution in lightbox', async () => {
    const user = userEvent.setup()
    render(<TechnicalDocViewer documents={[mockImageDoc]} />)

    const card = screen.getByText('CBR600RR Wiring Diagram').closest('[role="button"]')!
    await user.click(card)

    // Two attributions: one in card, one in lightbox
    const attributions = screen.getAllByText(/Source: Honda Service Manual/)
    expect(attributions.length).toBe(2)
  })

  it('opens PDF in new tab instead of lightbox', async () => {
    const user = userEvent.setup()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<TechnicalDocViewer documents={[mockPdfDoc]} />)

    const card = screen.getByText('Torque Specifications').closest('[role="button"]')!
    await user.click(card)

    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/torque.pdf',
      '_blank',
      'noopener,noreferrer'
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    openSpy.mockRestore()
  })

  it('handles keyboard Enter to open lightbox', () => {
    render(<TechnicalDocViewer documents={[mockImageDoc]} />)
    const card = screen.getByText('CBR600RR Wiring Diagram').closest('[role="button"]')!
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('handles keyboard Space to open lightbox', () => {
    render(<TechnicalDocViewer documents={[mockImageDoc]} />)
    const card = screen.getByText('CBR600RR Wiring Diagram').closest('[role="button"]')!
    fireEvent.keyDown(card, { key: ' ' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
