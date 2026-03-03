import { describe, it, expect } from 'vitest'
import { parseMotorcycleSpecsHtml } from './motorcyclespecsParser'

// HTML fixture simulating a motorcyclespecs.co.za page
const SPEC_PAGE_HTML = `
<html>
<head><title>Honda CBR 600RR - motorcyclespecs.co.za</title></head>
<body>
  <table>
    <tr><td>Make Model</td><td>Honda CBR 600RR</td></tr>
    <tr><td>Year</td><td>2004</td></tr>
    <tr><td>Engine</td><td>Four stroke, transverse four cylinder, DOHC, 4 valve per cylinder</td></tr>
    <tr><td>Capacity</td><td>599 cc / 36.5 cu-in</td></tr>
    <tr><td>Bore x Stroke</td><td>67 x 42.5 mm</td></tr>
    <tr><td>Compression Ratio</td><td>12.0:1</td></tr>
    <tr><td>Cooling System</td><td>Liquid cooled</td></tr>
    <tr><td>Max Power</td><td>117 hp / 87.2 kW @ 13000 rpm</td></tr>
    <tr><td>Max Torque</td><td>64 Nm / 6.53 kgf-m @ 11000 rpm</td></tr>
    <tr><td>Transmission</td><td>6 Speed</td></tr>
    <tr><td>Final Drive</td><td>Chain</td></tr>
    <tr><td>Front Suspension</td><td>45mm HMAS cartridge fork, adjustable preload, rebound, compression</td></tr>
    <tr><td>Rear Suspension</td><td>Unit Pro-Link HMAS single shock</td></tr>
    <tr><td>Front Brakes</td><td>2x 310mm discs, 4 piston calipers</td></tr>
    <tr><td>Rear Brakes</td><td>Single 220mm disc</td></tr>
    <tr><td>Front Tyre</td><td>120/70 ZR17</td></tr>
    <tr><td>Rear Tyre</td><td>180/55 ZR17</td></tr>
    <tr><td>Dry Weight</td><td>169 kg / 372.5 lbs</td></tr>
    <tr><td>Fuel Capacity</td><td>18 Litres / 4.7 US gal</td></tr>
    <tr><td>Seat Height</td><td>820 mm / 32.3 in</td></tr>
    <tr><td>Top Speed</td><td>162.5 mph</td></tr>
  </table>
  <p>The Honda CBR600RR was first introduced in 2003 as a replacement for the CBR600F4i. It features Dual Stage Fuel Injection and a compact inline four-cylinder engine designed for both track and street use. The CBR600RR has won numerous Supersport championships around the world.</p>
  <p>Key features include an aluminium twin-spar frame, Unit Pro-Link rear suspension, and race-derived aerodynamics that provide excellent stability at high speeds.</p>
  <p>Click here for more info</p>
</body>
</html>
`

const MINIMAL_HTML = `
<html>
<head><title>Unknown Bike</title></head>
<body>
  <p>Short text.</p>
</body>
</html>
`

const NO_SPECS_HTML = `
<html>
<head><title>Review Page</title></head>
<body>
  <p>The Yamaha MT-07 is a lightweight naked bike that has become one of the most popular motorcycles in Europe. Its parallel twin engine produces smooth, usable power across the rev range.</p>
</body>
</html>
`

describe('motorcyclespecsParser', () => {
  describe('parseMotorcycleSpecsHtml', () => {
    it('extracts spec table as key-value pairs', async () => {
      const result = await parseMotorcycleSpecsHtml(SPEC_PAGE_HTML, 'Honda CBR 600RR')

      expect(result.fullText).toContain('SPECIFICATIONS')
      expect(result.fullText).toContain('Make Model: Honda CBR 600RR')
      expect(result.fullText).toContain('Engine: Four stroke, transverse four cylinder')
      expect(result.fullText).toContain('Capacity: 599 cc / 36.5 cu-in')
      expect(result.fullText).toContain('Max Power: 117 hp / 87.2 kW @ 13000 rpm')
      expect(result.fullText).toContain('Dry Weight: 169 kg / 372.5 lbs')
    })

    it('extracts narrative description text', async () => {
      const result = await parseMotorcycleSpecsHtml(SPEC_PAGE_HTML, 'Honda CBR 600RR')

      expect(result.fullText).toContain('DESCRIPTION')
      expect(result.fullText).toContain('CBR600RR was first introduced in 2003')
      expect(result.fullText).toContain('aluminium twin-spar frame')
    })

    it('filters out ad content from description', async () => {
      const result = await parseMotorcycleSpecsHtml(SPEC_PAGE_HTML, 'Honda CBR 600RR')

      expect(result.fullText).not.toContain('Click here for more info')
    })

    it('uses ALL CAPS section headings', async () => {
      const result = await parseMotorcycleSpecsHtml(SPEC_PAGE_HTML, 'Honda CBR 600RR')

      expect(result.fullText).toMatch(/^HONDA CBR 600RR/)
      expect(result.fullText).toContain('SPECIFICATIONS')
      expect(result.fullText).toContain('DESCRIPTION')
    })

    it('returns sections array with correct structure', async () => {
      const result = await parseMotorcycleSpecsHtml(SPEC_PAGE_HTML, 'Honda CBR 600RR')

      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].heading).toBe('Specifications')
      expect(result.sections[0].level).toBe(2)
      expect(result.sections[1].heading).toBe('Description')
      expect(result.sections[1].level).toBe(2)
    })

    it('handles page with no spec table', async () => {
      const result = await parseMotorcycleSpecsHtml(NO_SPECS_HTML, 'Review Page')

      expect(result.fullText).not.toContain('SPECIFICATIONS')
      expect(result.fullText).toContain('DESCRIPTION')
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].heading).toBe('Description')
    })

    it('handles minimal page with no useful content', async () => {
      const result = await parseMotorcycleSpecsHtml(MINIMAL_HTML, 'Unknown Bike')

      // Short paragraph filtered out (< 50 chars)
      expect(result.sections).toHaveLength(0)
      expect(result.fullText).toBe('UNKNOWN BIKE')
    })

    it('cleans title by removing site suffix', async () => {
      const result = await parseMotorcycleSpecsHtml(
        SPEC_PAGE_HTML,
        'Honda CBR 600RR - motorcyclespecs.co.za'
      )

      expect(result.fullText).toMatch(/^HONDA CBR 600RR\n/)
    })
  })
})
