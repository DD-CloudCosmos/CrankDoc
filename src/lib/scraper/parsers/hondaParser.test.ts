import { describe, it, expect } from 'vitest'
import { parseHondaHtml } from './hondaParser'

const HONDA_SPEC_HTML = `
<html>
<head><title>2024 CBR600RR - Honda Powersports</title></head>
<body>
  <table>
    <tr><td>Engine Type</td><td>599cc Liquid-Cooled Inline Four-Cylinder</td></tr>
    <tr><td>Bore and Stroke</td><td>67mm x 42.5mm</td></tr>
    <tr><td>Compression Ratio</td><td>12.2:1</td></tr>
    <tr><td>Fuel System</td><td>PGM-DSFI with 40mm throttle bodies</td></tr>
    <tr><td>Transmission</td><td>6-speed</td></tr>
    <tr><td>Front Suspension</td><td>43mm Showa Big Piston Fork; adjustable preload, compression and rebound damping</td></tr>
    <tr><td>Rear Suspension</td><td>Unit Pro-Link with single shock; adjustable preload, compression and rebound damping</td></tr>
    <tr><td>Front Brake</td><td>Dual 310mm discs with radial-mount four-piston calipers</td></tr>
    <tr><td>Rear Brake</td><td>Single 220mm disc with single-piston caliper</td></tr>
    <tr><td>Front Tire</td><td>120/70ZR-17</td></tr>
    <tr><td>Rear Tire</td><td>180/55ZR-17</td></tr>
    <tr><td>Seat Height</td><td>820.4mm (32.3 in.)</td></tr>
    <tr><td>Curb Weight</td><td>196kg (432 lbs.)</td></tr>
    <tr><td>Fuel Capacity</td><td>18.1 liters (4.8 gal.)</td></tr>
    <tr><td>Wheelbase</td><td>1,375mm (54.1 in.)</td></tr>
  </table>
  <p>The CBR600RR delivers MotoGP-derived technology in a middleweight supersport package, featuring a compact inline four-cylinder engine with Dual Stage Fuel Injection for precise throttle response.</p>
  <p>Login to view more</p>
</body>
</html>
`

const HONDA_DL_HTML = `
<html>
<head><title>CBR600RR Specs</title></head>
<body>
  <dl>
    <dt>Engine</dt><dd>599cc Inline Four</dd>
    <dt>Power</dt><dd>121 hp @ 14,000 rpm</dd>
    <dt>Torque</dt><dd>65 Nm @ 11,500 rpm</dd>
  </dl>
</body>
</html>
`

const EMPTY_HTML = `<html><head><title>Empty</title></head><body></body></html>`

describe('hondaParser', () => {
  it('extracts spec table rows', async () => {
    const result = await parseHondaHtml(HONDA_SPEC_HTML, '2024 CBR600RR - Honda Powersports')
    expect(result.fullText).toContain('SPECIFICATIONS')
    expect(result.fullText).toContain('Engine Type: 599cc Liquid-Cooled Inline Four-Cylinder')
    expect(result.fullText).toContain('Compression Ratio: 12.2:1')
    expect(result.fullText).toContain('Seat Height: 820.4mm (32.3 in.)')
  })

  it('extracts feature descriptions', async () => {
    const result = await parseHondaHtml(HONDA_SPEC_HTML, '2024 CBR600RR - Honda Powersports')
    expect(result.fullText).toContain('FEATURES')
    expect(result.fullText).toContain('MotoGP-derived technology')
  })

  it('filters short paragraphs', async () => {
    const result = await parseHondaHtml(HONDA_SPEC_HTML, '2024 CBR600RR')
    expect(result.fullText).not.toContain('Login to view more')
  })

  it('cleans title by removing Honda suffix', async () => {
    const result = await parseHondaHtml(HONDA_SPEC_HTML, '2024 CBR600RR - Honda Powersports')
    expect(result.fullText).toMatch(/^2024 CBR600RR/i)
  })

  it('uses ALL CAPS headings', async () => {
    const result = await parseHondaHtml(HONDA_SPEC_HTML, 'CBR600RR')
    expect(result.fullText).toContain('SPECIFICATIONS')
    expect(result.fullText).toContain('FEATURES')
  })

  it('extracts specs from definition lists', async () => {
    const result = await parseHondaHtml(HONDA_DL_HTML, 'CBR600RR Specs')
    expect(result.fullText).toContain('Engine: 599cc Inline Four')
    expect(result.fullText).toContain('Power: 121 hp @ 14,000 rpm')
  })

  it('returns sections array', async () => {
    const result = await parseHondaHtml(HONDA_SPEC_HTML, 'CBR600RR')
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
    expect(result.sections[0].heading).toBe('Specifications')
    expect(result.sections[0].level).toBe(2)
  })

  it('handles empty page', async () => {
    const result = await parseHondaHtml(EMPTY_HTML, 'Empty')
    expect(result.sections).toHaveLength(0)
    expect(result.fullText).toBe('EMPTY')
  })
})
