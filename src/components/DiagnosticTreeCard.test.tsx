import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiagnosticTreeCard } from './DiagnosticTreeCard'
import type { DiagnosticTree } from '@/types/database.types'

describe('DiagnosticTreeCard', () => {
  const mockTree: DiagnosticTree = {
    id: 'tree-1',
    motorcycle_id: 'moto-1',
    title: "Engine Won't Start",
    description: 'Systematic diagnosis for a non-starting engine.',
    category: 'electrical',
    difficulty: 'beginner',
    tree_data: { nodes: [] },
    created_at: '2024-01-01T00:00:00Z',
  }

  it('renders the tree title', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
  })

  it('renders the tree description', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    expect(screen.getByText('Systematic diagnosis for a non-starting engine.')).toBeInTheDocument()
  })

  it('renders the difficulty badge', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    expect(screen.getByText(/beginner/i)).toBeInTheDocument()
  })

  it('renders the category', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    expect(screen.getByText(/electrical/i)).toBeInTheDocument()
  })

  it('renders as a link to the diagnose page', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/diagnose/tree-1')
  })

  it('handles null description gracefully', () => {
    const treeNoDesc = { ...mockTree, description: null }
    render(<DiagnosticTreeCard tree={treeNoDesc} />)
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
  })

  it('handles null difficulty gracefully', () => {
    const treeNoDiff = { ...mockTree, difficulty: null }
    render(<DiagnosticTreeCard tree={treeNoDiff} />)
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
  })

  it('optionally shows motorcycle name', () => {
    render(<DiagnosticTreeCard tree={mockTree} motorcycleName="Honda CBR600RR" />)
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
  })
})
