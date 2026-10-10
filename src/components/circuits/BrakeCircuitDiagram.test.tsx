import { expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { BrakeCircuitDiagram } from './BrakeCircuitDiagram'

it('highlights the connected brake net separately from closed-path state', () => {
  const { container } = render(<BrakeCircuitDiagram controls={{ ignition: false, front: false, rear: false }} selected="brake-feed" onSelect={() => {}} showColours />)
  for (const id of ['front-out', 'rear-out', 'brake-feed']) {
    expect(container.querySelector(`[data-wire="${id}"]`)).toHaveAttribute('data-selected', 'true')
    expect(container.querySelector(`[data-wire="${id}"]`)).toHaveAttribute('data-complete-path', 'false')
  }
  expect(container.querySelector('[data-wire="front-in"]')).toHaveAttribute('data-selected', 'false')
})
