import { describe, it, expect } from 'vitest'
import { parseYamahaHtml } from './yamahaParser'

const YAMAHA_SPEC_HTML = `
<html>
<head><title>2024 MT-07 - Yamaha Motor</title></head>
<body>
  <table>
    <tr><td>Engine Type</td><td>689cc liquid-cooled, 4-stroke, DOHC, 4-valve, parallel twin</td></tr>
    <tr><td>Bore x Stroke</td><td>80.0mm x 68.6mm</td></tr>
    <tr><td>Compression Ratio</td><td>11.5:1</td></tr>
    <tr><td>Fuel Delivery</td><td>Fuel injection</td></tr>
    <tr><td>Transmission</td><td>6-speed; multiplate wet clutch</td></tr>
    <tr><td>Final Drive</td><td>Chain</td></tr>
    <tr><td>Front Suspension</td><td>41mm telescopic fork; 5.1-in travel</td></tr>
    <tr><td>Rear Suspension</td><td>Swingarm, adjustable preload; 5.1-in travel</td></tr>
    <tr><td>Front Brake</td><td>Dual 282mm hydraulic disc</td></tr>
    <tr><td>Rear Brake</td><td>245mm hydraulic disc</td></tr>
    <tr><td>Front Tire</td><td>120/70-17</td></tr>
    <tr><td>Rear Tire</td><td>180/55-17</td></tr>
    <tr><td>Wet Weight</td><td>184 kg (406 lb)</td></tr>
    <tr><td>Fuel Capacity</td><td>14 liters (3.7 gal.)</td></tr>
    <tr><td>Seat Height</td><td>805mm (31.7 in.)</td></tr>
  </table>
  <p>The MT-07 is a lightweight middleweight naked bike that delivers smooth, responsive power from its 689cc parallel twin engine with a crossplane crankshaft concept.</p>
</body>
</html>
`

const YAMAHA_DIV_SPECS_HTML = `
<html>
<head><title>MT-07</title></head>
<body>
  <div class="spec-block">
    <span class="spec-label">Engine</span>
    <span class="spec-value">689cc parallel twin</span>
    <span class="spec-label">Power</span>
    <span class="spec-value">73.4 hp @ 8,750 rpm</span>
  </div>
</body>
</html>
`

const EMPTY_HTML = `<html><head><title>Empty</title></head><body></body></html>`

describe('yamahaParser', () => {
  it('extracts spec table rows', async () => {
    const result = await parseYamahaHtml(YAMAHA_SPEC_HTML, '2024 MT-07 - Yamaha Motor')
    expect(result.fullText).toContain('SPECIFICATIONS')
    expect(result.fullText).toContain('Engine Type: 689cc liquid-cooled')
    expect(result.fullText).toContain('Wet Weight: 184 kg (406 lb)')
    expect(result.fullText).toContain('Fuel Capacity: 14 liters')
  })

  it('extracts description text', async () => {
    const result = await parseYamahaHtml(YAMAHA_SPEC_HTML, 'MT-07')
    expect(result.fullText).toContain('DESCRIPTION')
    expect(result.fullText).toContain('lightweight middleweight naked bike')
  })

  it('cleans title by removing Yamaha suffix', async () => {
    const result = await parseYamahaHtml(YAMAHA_SPEC_HTML, '2024 MT-07 - Yamaha Motor')
    expect(result.fullText).toMatch(/^2024 MT-07/i)
  })

  it('uses ALL CAPS headings', async () => {
    const result = await parseYamahaHtml(YAMAHA_SPEC_HTML, 'MT-07')
    expect(result.fullText).toContain('SPECIFICATIONS')
  })

  it('extracts div-based spec blocks', async () => {
    const result = await parseYamahaHtml(YAMAHA_DIV_SPECS_HTML, 'MT-07')
    expect(result.fullText).toContain('Engine: 689cc parallel twin')
    expect(result.fullText).toContain('Power: 73.4 hp @ 8,750 rpm')
  })

  it('returns sections array', async () => {
    const result = await parseYamahaHtml(YAMAHA_SPEC_HTML, 'MT-07')
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
    expect(result.sections[0].heading).toBe('Specifications')
  })

  it('handles empty page', async () => {
    const result = await parseYamahaHtml(EMPTY_HTML, 'Empty')
    expect(result.sections).toHaveLength(0)
  })
})
