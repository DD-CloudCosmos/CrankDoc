import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlossaryImageModal } from './GlossaryImageModal'

describe('GlossaryImageModal', () => {
  it('renders modal with image when open', () => {
    render(
      <GlossaryImageModal
        open={true}
        onClose={vi.fn()}
        imageUrl="/illustrations/carburetor.svg"
        termName="Carburetor"
      />
    )

    expect(screen.getByTestId('glossary-image-modal')).toBeInTheDocument()
    expect(screen.getByText('Carburetor')).toBeInTheDocument()
    const img = screen.getByAltText('Carburetor')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/illustrations/carburetor.svg')
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <GlossaryImageModal
        open={true}
        onClose={onClose}
        imageUrl="/illustrations/carburetor.svg"
        termName="Carburetor"
      />
    )

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows term name as title', () => {
    render(
      <GlossaryImageModal
        open={true}
        onClose={vi.fn()}
        imageUrl="/illustrations/spark-plug.svg"
        termName="Spark Plug"
      />
    )

    expect(screen.getByText('Spark Plug')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <GlossaryImageModal
        open={false}
        onClose={vi.fn()}
        imageUrl="/illustrations/carburetor.svg"
        termName="Carburetor"
      />
    )

    expect(screen.queryByTestId('glossary-image-modal')).not.toBeInTheDocument()
  })
})
