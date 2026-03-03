import { describe, it, expect } from 'vitest'
import { parseHarleyHtml } from './harleyParser'

const HARLEY_HTML = `
<html>
<head><title>Sportster 883 Iron - Harley-Davidson</title></head>
<body>
  <table>
    <tr><td>Engine</td><td>Air-cooled, Evolution</td></tr>
    <tr><td>Displacement</td><td>883 cc (53.9 cu in)</td></tr>
    <tr><td>Bore x Stroke</td><td>76.2 x 96.8 mm (3.0 x 3.81 in)</td></tr>
    <tr><td>Compression Ratio</td><td>10.0:1</td></tr>
    <tr><td>Fuel System</td><td>Electronic Sequential Port Fuel Injection</td></tr>
    <tr><td>Transmission</td><td>5-Speed</td></tr>
    <tr><td>Final Drive</td><td>Belt</td></tr>
    <tr><td>Front Suspension</td><td>39mm forks</td></tr>
    <tr><td>Rear Suspension</td><td>Twin coil-over shocks, adjustable preload</td></tr>
    <tr><td>Lean Angle</td><td>28.5° (right), 29.6° (left)</td></tr>
    <tr><td>Seat Height</td><td>760 mm (29.9 in)</td></tr>
    <tr><td>Wet Weight</td><td>256 kg (564 lbs)</td></tr>
    <tr><td>Fuel Capacity</td><td>12.5 liters (3.3 gal)</td></tr>
  </table>
  <p>The Iron 883 is the blacked-out backbone of the Sportster lineup, delivering raw, stripped-down style with an Evolution V-Twin engine that produces strong low-end torque.</p>
</body>
</html>
`

const EMPTY_HTML = `<html><head><title>Empty</title></head><body></body></html>`

describe('harleyParser', () => {
  it('extracts spec table', async () => {
    const result = await parseHarleyHtml(HARLEY_HTML, 'Sportster 883 Iron - Harley-Davidson')
    expect(result.fullText).toContain('SPECIFICATIONS')
    expect(result.fullText).toContain('Displacement: 883 cc (53.9 cu in)')
    expect(result.fullText).toContain('Final Drive: Belt')
  })

  it('extracts description', async () => {
    const result = await parseHarleyHtml(HARLEY_HTML, 'Sportster 883 Iron')
    expect(result.fullText).toContain('DESCRIPTION')
    expect(result.fullText).toContain('Evolution V-Twin engine')
  })

  it('cleans title', async () => {
    const result = await parseHarleyHtml(HARLEY_HTML, 'Sportster 883 Iron - Harley-Davidson')
    expect(result.fullText).toMatch(/^SPORTSTER 883 IRON/)
  })

  it('returns sections', async () => {
    const result = await parseHarleyHtml(HARLEY_HTML, 'Sportster 883')
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty page', async () => {
    const result = await parseHarleyHtml(EMPTY_HTML, 'Empty')
    expect(result.sections).toHaveLength(0)
  })
})
