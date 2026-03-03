import { describe, it, expect } from 'vitest'
import { parseBmwHtml } from './bmwParser'

const BMW_HTML = `
<html>
<head><title>R 1250 GS - BMW Motorrad</title></head>
<body>
  <table>
    <tr><td>Engine</td><td>Air/liquid-cooled flat twin (boxer), 4-stroke</td></tr>
    <tr><td>Displacement</td><td>1,254 cc</td></tr>
    <tr><td>Bore x Stroke</td><td>102.5 x 76.0 mm</td></tr>
    <tr><td>Rated Output</td><td>100 kW (136 hp) at 7,750 rpm</td></tr>
    <tr><td>Max Torque</td><td>143 Nm at 6,250 rpm</td></tr>
    <tr><td>Transmission</td><td>6-speed constant mesh gearbox</td></tr>
    <tr><td>Final Drive</td><td>Shaft drive</td></tr>
    <tr><td>Front Suspension</td><td>BMW Telelever, central spring strut</td></tr>
    <tr><td>Rear Suspension</td><td>BMW EVO Paralever, WAD shock absorber</td></tr>
    <tr><td>Seat Height</td><td>850/870 mm</td></tr>
    <tr><td>Wet Weight</td><td>249 kg</td></tr>
    <tr><td>Fuel Capacity</td><td>20 liters</td></tr>
  </table>
  <p>The BMW R 1250 GS sets the benchmark in the adventure touring segment with its powerful ShiftCam boxer engine, delivering variable valve timing for optimal performance across the rev range.</p>
</body>
</html>
`

const EMPTY_HTML = `<html><head><title>Empty</title></head><body></body></html>`

describe('bmwParser', () => {
  it('extracts spec table', async () => {
    const result = await parseBmwHtml(BMW_HTML, 'R 1250 GS - BMW Motorrad')
    expect(result.fullText).toContain('SPECIFICATIONS')
    expect(result.fullText).toContain('Displacement: 1,254 cc')
    expect(result.fullText).toContain('Rated Output: 100 kW (136 hp)')
    expect(result.fullText).toContain('Final Drive: Shaft drive')
  })

  it('extracts description', async () => {
    const result = await parseBmwHtml(BMW_HTML, 'R 1250 GS')
    expect(result.fullText).toContain('DESCRIPTION')
    expect(result.fullText).toContain('ShiftCam boxer engine')
  })

  it('cleans title', async () => {
    const result = await parseBmwHtml(BMW_HTML, 'R 1250 GS - BMW Motorrad')
    expect(result.fullText).toMatch(/^R 1250 GS/i)
  })

  it('returns sections', async () => {
    const result = await parseBmwHtml(BMW_HTML, 'R 1250 GS')
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty page', async () => {
    const result = await parseBmwHtml(EMPTY_HTML, 'Empty')
    expect(result.sections).toHaveLength(0)
  })
})
