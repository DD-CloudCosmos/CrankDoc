import { describe, it, expect } from 'vitest'
import { parseKymcoHtml } from './kymcoParser'

const KYMCO_HTML = `
<html>
<head><title>AK 550 - KYMCO</title></head>
<body>
  <table>
    <tr><td>Engine Type</td><td>4-stroke, 2-cylinder, liquid-cooled, DOHC</td></tr>
    <tr><td>Displacement</td><td>550.4 cc</td></tr>
    <tr><td>Bore x Stroke</td><td>70.0 x 71.6 mm</td></tr>
    <tr><td>Max Power</td><td>54 hp (40 kW) @ 7,500 rpm</td></tr>
    <tr><td>Max Torque</td><td>55.3 Nm @ 5,500 rpm</td></tr>
    <tr><td>Transmission</td><td>CVT with centrifugal clutch</td></tr>
    <tr><td>Front Suspension</td><td>Inverted telescopic fork, 110mm travel</td></tr>
    <tr><td>Rear Suspension</td><td>Dual shock absorbers, adjustable preload</td></tr>
    <tr><td>Front Brake</td><td>Dual 280mm discs, radial 4-piston</td></tr>
    <tr><td>Rear Brake</td><td>Single 260mm disc</td></tr>
    <tr><td>Seat Height</td><td>790 mm</td></tr>
    <tr><td>Wet Weight</td><td>226 kg</td></tr>
    <tr><td>Fuel Capacity</td><td>15.5 liters</td></tr>
  </table>
  <p>The KYMCO AK 550 is a premium maxi-scooter powered by a parallel-twin engine, offering motorcycle-level performance with the convenience of a scooter's twist-and-go transmission.</p>
</body>
</html>
`

const EMPTY_HTML = `<html><head><title>Empty</title></head><body></body></html>`

describe('kymcoParser', () => {
  it('extracts spec table', async () => {
    const result = await parseKymcoHtml(KYMCO_HTML, 'AK 550 - KYMCO')
    expect(result.fullText).toContain('SPECIFICATIONS')
    expect(result.fullText).toContain('Displacement: 550.4 cc')
    expect(result.fullText).toContain('Max Power: 54 hp (40 kW)')
    expect(result.fullText).toContain('Transmission: CVT with centrifugal clutch')
  })

  it('extracts description', async () => {
    const result = await parseKymcoHtml(KYMCO_HTML, 'AK 550')
    expect(result.fullText).toContain('DESCRIPTION')
    expect(result.fullText).toContain('premium maxi-scooter')
  })

  it('cleans title', async () => {
    const result = await parseKymcoHtml(KYMCO_HTML, 'AK 550 - KYMCO')
    expect(result.fullText).toMatch(/^AK 550/)
  })

  it('returns sections', async () => {
    const result = await parseKymcoHtml(KYMCO_HTML, 'AK 550')
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty page', async () => {
    const result = await parseKymcoHtml(EMPTY_HTML, 'Empty')
    expect(result.sections).toHaveLength(0)
  })
})
