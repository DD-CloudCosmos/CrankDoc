import { describe, it, expect } from 'vitest'
import { parseKawasakiHtml } from './kawasakiParser'

const KAWASAKI_HTML = `
<html>
<head><title>2024 Ninja 400 - Kawasaki Motors</title></head>
<body>
  <table>
    <tr><td>Engine</td><td>399cc, 4-Stroke, 2-Cylinder, DOHC</td></tr>
    <tr><td>Bore x Stroke</td><td>70.0 x 51.8mm</td></tr>
    <tr><td>Compression Ratio</td><td>11.5:1</td></tr>
    <tr><td>Fuel System</td><td>DFI with 32mm Keihin throttle bodies</td></tr>
    <tr><td>Transmission</td><td>6-speed, return</td></tr>
    <tr><td>Front Suspension</td><td>41mm telescopic fork</td></tr>
    <tr><td>Rear Suspension</td><td>Bottom-Link Uni-Trak with adjustable preload</td></tr>
    <tr><td>Front Brake</td><td>Dual 310mm petal-type discs</td></tr>
    <tr><td>Curb Weight</td><td>168 kg (370 lbs)</td></tr>
    <tr><td>Fuel Capacity</td><td>14 liters (3.7 gal)</td></tr>
    <tr><td>Seat Height</td><td>785mm (30.9 in)</td></tr>
  </table>
  <p>The Ninja 400 is a lightweight sportbike designed for both new and experienced riders, featuring a parallel-twin engine with strong low- and mid-range power delivery.</p>
</body>
</html>
`

const EMPTY_HTML = `<html><head><title>Empty</title></head><body></body></html>`

describe('kawasakiParser', () => {
  it('extracts spec table', async () => {
    const result = await parseKawasakiHtml(KAWASAKI_HTML, '2024 Ninja 400 - Kawasaki Motors')
    expect(result.fullText).toContain('SPECIFICATIONS')
    expect(result.fullText).toContain('Engine: 399cc, 4-Stroke')
    expect(result.fullText).toContain('Curb Weight: 168 kg (370 lbs)')
  })

  it('extracts description', async () => {
    const result = await parseKawasakiHtml(KAWASAKI_HTML, 'Ninja 400')
    expect(result.fullText).toContain('DESCRIPTION')
    expect(result.fullText).toContain('lightweight sportbike')
  })

  it('cleans title', async () => {
    const result = await parseKawasakiHtml(KAWASAKI_HTML, '2024 Ninja 400 - Kawasaki Motors')
    expect(result.fullText).toMatch(/^2024 NINJA 400/)
  })

  it('returns sections', async () => {
    const result = await parseKawasakiHtml(KAWASAKI_HTML, 'Ninja 400')
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty page', async () => {
    const result = await parseKawasakiHtml(EMPTY_HTML, 'Empty')
    expect(result.sections).toHaveLength(0)
  })
})
