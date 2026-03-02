import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SmartSearch } from './SmartSearch'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

/**
 * Creates a mock Response whose body is a ReadableStream that emits
 * the given text content (optionally with a sources delimiter).
 */
function createStreamResponse(answerText: string, sources?: unknown[]): Response {
  const encoder = new TextEncoder()
  let content = answerText
  if (sources) {
    content += '\n---SOURCES---\n' + JSON.stringify(sources)
  }

  const stream = new ReadableStream({
    start(controller) {
      // Emit the full content in a single chunk for simplicity
      controller.enqueue(encoder.encode(content))
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

/**
 * Creates a mock Response that streams answer text in multiple chunks
 * to test incremental rendering.
 */
function createChunkedStreamResponse(
  chunks: string[],
  sources?: unknown[]
): Response {
  const encoder = new TextEncoder()
  const allChunks = [...chunks]
  if (sources) {
    allChunks.push('\n---SOURCES---\n' + JSON.stringify(sources))
  }

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of allChunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

const mockSources = [
  {
    sectionTitle: 'Valve Clearance Specifications',
    pageNumbers: [42, 43],
    contentType: 'service_manual',
    make: 'Honda',
    model: 'CBR600RR',
    similarity: 0.92,
  },
  {
    sectionTitle: 'Engine Maintenance',
    pageNumbers: null,
    contentType: 'technical_bulletin',
    make: 'Honda',
    model: null,
    similarity: 0.85,
  },
]

describe('SmartSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input and submit button', () => {
    render(<SmartSearch />)

    expect(
      screen.getByPlaceholderText('Ask about motorcycle maintenance...')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('shows example questions initially', () => {
    render(<SmartSearch />)

    expect(screen.getByTestId('example-questions')).toBeInTheDocument()
    expect(
      screen.getByText('What is the valve clearance for a CBR600RR?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('How do I change the oil on a Ninja 400?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('What does DTC P0131 mean on a Honda?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('What are the torque specs for an R1250GS cylinder head?')
    ).toBeInTheDocument()
  })

  it('clicking example question populates input', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(createStreamResponse('Test answer'))

    render(<SmartSearch />)

    await user.click(
      screen.getByText('What is the valve clearance for a CBR600RR?')
    )

    const input = screen.getByPlaceholderText(
      'Ask about motorcycle maintenance...'
    ) as HTMLInputElement
    expect(input.value).toBe(
      'What is the valve clearance for a CBR600RR?'
    )
  })

  it('submitting form calls fetch with correct body', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(createStreamResponse('Answer text'))

    render(<SmartSearch motorcycleId="abc-123" make="Honda" model="CBR600RR" />)

    const input = screen.getByPlaceholderText(
      'Ask about motorcycle maintenance...'
    )
    await user.type(input, 'valve clearance')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/rag/query',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'valve clearance',
          motorcycleId: 'abc-123',
          make: 'Honda',
          model: 'CBR600RR',
        }),
      })
    )
  })

  it('shows loading state during streaming', async () => {
    // Create a stream that never closes so we can observe loading state
    const stream = new ReadableStream({
      start() {
        // Intentionally never close — keeps isLoading true
      },
    })

    mockFetch.mockResolvedValueOnce(
      new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    )

    const user = userEvent.setup()
    render(<SmartSearch />)

    const input = screen.getByPlaceholderText(
      'Ask about motorcycle maintenance...'
    )
    await user.type(input, 'test query')
    await user.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByTestId('answer-skeleton')).toBeInTheDocument()
    })

    // Example questions should be hidden during loading
    expect(screen.queryByTestId('example-questions')).not.toBeInTheDocument()
  })

  it('displays streamed answer text', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(
      createChunkedStreamResponse(
        ['The valve clearance ', 'for a CBR600RR is 0.16mm intake.'],
        mockSources
      )
    )

    render(<SmartSearch />)

    const input = screen.getByPlaceholderText(
      'Ask about motorcycle maintenance...'
    )
    await user.type(input, 'valve clearance CBR600RR')
    await user.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(
        screen.getByText(
          'The valve clearance for a CBR600RR is 0.16mm intake.'
        )
      ).toBeInTheDocument()
    })

    // Verify answer card is visible
    expect(screen.getByTestId('answer-card')).toBeInTheDocument()
  })

  it('shows error state on fetch failure', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to generate query embedding' }),
    })

    render(<SmartSearch />)

    const input = screen.getByPlaceholderText(
      'Ask about motorcycle maintenance...'
    )
    await user.type(input, 'test query')
    await user.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(
        screen.getByText('Failed to generate query embedding')
      ).toBeInTheDocument()
    })
  })

  it('displays filtered badge when make and model provided', () => {
    render(<SmartSearch make="Honda" model="CBR600RR" />)

    const badge = screen.getByTestId('bike-filter-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Honda CBR600RR')
  })

  it('does not display filtered badge when only make is provided', () => {
    render(<SmartSearch make="Honda" />)

    expect(screen.queryByTestId('bike-filter-badge')).not.toBeInTheDocument()
  })

  it('displays sources after stream completes', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(
      createStreamResponse('Here is the answer.', mockSources)
    )

    render(<SmartSearch />)

    const input = screen.getByPlaceholderText(
      'Ask about motorcycle maintenance...'
    )
    await user.type(input, 'valve specs')
    await user.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByTestId('sources-card')).toBeInTheDocument()
    })

    expect(
      screen.getByText('Valve Clearance Specifications')
    ).toBeInTheDocument()
    expect(screen.getByText('Engine Maintenance')).toBeInTheDocument()
    expect(screen.getByText('service_manual')).toBeInTheDocument()
    expect(screen.getByText('technical_bulletin')).toBeInTheDocument()
    expect(screen.getByText('p. 42, 43')).toBeInTheDocument()
    expect(screen.getByText('92% match')).toBeInTheDocument()
    expect(screen.getByText('85% match')).toBeInTheDocument()
  })

  it('disables submit button when query is empty', () => {
    render(<SmartSearch />)

    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
  })

  it('shows generic error when fetch throws a network error', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<SmartSearch />)

    const input = screen.getByPlaceholderText(
      'Ask about motorcycle maintenance...'
    )
    await user.type(input, 'test query')
    await user.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('hides example questions after receiving an answer', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(createStreamResponse('Test answer'))

    render(<SmartSearch />)

    // Initially visible
    expect(screen.getByTestId('example-questions')).toBeInTheDocument()

    const input = screen.getByPlaceholderText(
      'Ask about motorcycle maintenance...'
    )
    await user.type(input, 'test')
    await user.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText('Test answer')).toBeInTheDocument()
    })

    // Example questions hidden after answer
    expect(screen.queryByTestId('example-questions')).not.toBeInTheDocument()
  })
})
