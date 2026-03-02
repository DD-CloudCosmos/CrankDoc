import { describe, it, expect } from 'vitest'
import {
  EXTRACTION_TYPES,
  TARGET_TABLE_MAP,
  getExtractionPrompt,
  buildExtractionMessages,
  estimateCost,
  validateExtractionResult,
} from './extractor'
import type { ExtractionRequest, ExtractionType } from './extractor'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal ExtractionRequest for testing. */
function buildRequest(overrides: Partial<ExtractionRequest> = {}): ExtractionRequest {
  return {
    documentSourceId: 'doc-source-uuid-1',
    extractionType: 'specs',
    chunks: [
      {
        id: 'chunk-1',
        content: 'Displacement: 599cc\nHorsepower: 117 HP\nTorque: 48.5 lb-ft',
        contentType: 'spec_table',
      },
      {
        id: 'chunk-2',
        content: 'Oil capacity: 3.1 liters\nSpark plug: NGK CR9EH-9',
        contentType: 'spec_table',
      },
    ],
    metadata: {
      make: 'Honda',
      model: 'CBR600RR',
      yearStart: 2007,
      yearEnd: 2012,
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('EXTRACTION_TYPES', () => {
  it('contains all five extraction types', () => {
    expect(EXTRACTION_TYPES).toEqual([
      'specs',
      'service_intervals',
      'procedures',
      'dtc_codes',
      'diagnostic_trees',
    ])
  })
})

describe('TARGET_TABLE_MAP', () => {
  it('maps each extraction type to a database table', () => {
    expect(TARGET_TABLE_MAP.specs).toBe('motorcycles')
    expect(TARGET_TABLE_MAP.service_intervals).toBe('service_intervals')
    expect(TARGET_TABLE_MAP.procedures).toBe('diagnostic_trees')
    expect(TARGET_TABLE_MAP.dtc_codes).toBe('dtc_codes')
    expect(TARGET_TABLE_MAP.diagnostic_trees).toBe('diagnostic_trees')
  })
})

// ---------------------------------------------------------------------------
// getExtractionPrompt
// ---------------------------------------------------------------------------

describe('getExtractionPrompt', () => {
  const metadata = { make: 'Honda', model: 'CBR600RR', yearStart: 2007, yearEnd: 2012 }

  it('returns a prompt containing the JSON schema for specs extraction', () => {
    const prompt = getExtractionPrompt('specs', metadata)

    expect(prompt).toContain('displacement_cc')
    expect(prompt).toContain('horsepower')
    expect(prompt).toContain('torque_nm')
    expect(prompt).toContain('oil_capacity_l')
    expect(prompt).toContain('valve_clearance_intake_mm')
    expect(prompt).toContain('spark_plug')
  })

  it('returns a prompt containing the JSON schema for service_intervals', () => {
    const prompt = getExtractionPrompt('service_intervals', metadata)

    expect(prompt).toContain('service_name')
    expect(prompt).toContain('interval_miles')
    expect(prompt).toContain('interval_km')
    expect(prompt).toContain('interval_months')
    expect(prompt).toContain('torque_spec_nm')
    expect(prompt).toContain('fluid_spec')
  })

  it('returns a prompt containing the JSON schema for dtc_codes', () => {
    const prompt = getExtractionPrompt('dtc_codes', metadata)

    expect(prompt).toContain('"code"')
    expect(prompt).toContain('"description"')
    expect(prompt).toContain('category')
    expect(prompt).toContain('possible_causes')
    expect(prompt).toContain('severity')
  })

  it('returns a prompt containing the JSON schema for procedures', () => {
    const prompt = getExtractionPrompt('procedures', metadata)

    expect(prompt).toContain('"title"')
    expect(prompt).toContain('"steps"')
    expect(prompt).toContain('step_number')
    expect(prompt).toContain('instruction')
    expect(prompt).toContain('safety_level')
  })

  it('returns a prompt containing the JSON schema for diagnostic_trees', () => {
    const prompt = getExtractionPrompt('diagnostic_trees', metadata)

    expect(prompt).toContain('"title"')
    expect(prompt).toContain('"nodes"')
    expect(prompt).toContain('question')
    expect(prompt).toContain('yes_next')
    expect(prompt).toContain('no_next')
  })

  it('includes the {context} placeholder in all extraction types', () => {
    const types: ExtractionType[] = [
      'specs',
      'service_intervals',
      'dtc_codes',
      'procedures',
      'diagnostic_trees',
    ]

    for (const type of types) {
      const prompt = getExtractionPrompt(type, metadata)
      expect(prompt).toContain('{context}')
    }
  })

  it('includes unit conversion rules in all extraction types', () => {
    const types: ExtractionType[] = [
      'specs',
      'service_intervals',
      'dtc_codes',
      'procedures',
      'diagnostic_trees',
    ]

    for (const type of types) {
      const prompt = getExtractionPrompt(type, metadata)
      // All prompts should mention unit conversion in some form
      expect(prompt.toLowerCase()).toContain('convert')
    }
  })

  it('includes the motorcycle label in the prompt', () => {
    const prompt = getExtractionPrompt('specs', metadata)

    expect(prompt).toContain('Honda')
    expect(prompt).toContain('CBR600RR')
    expect(prompt).toContain('2007')
  })

  it('handles null yearEnd in metadata', () => {
    const metadataNoEnd = { make: 'Yamaha', model: 'MT-07', yearStart: 2021, yearEnd: null }
    const prompt = getExtractionPrompt('specs', metadataNoEnd)

    expect(prompt).toContain('Yamaha')
    expect(prompt).toContain('MT-07')
    expect(prompt).toContain('2021')
  })
})

// ---------------------------------------------------------------------------
// buildExtractionMessages
// ---------------------------------------------------------------------------

describe('buildExtractionMessages', () => {
  it('produces a system message with extraction instructions', () => {
    const request = buildRequest()
    const { system } = buildExtractionMessages(request)

    expect(system).toContain('structured data extraction')
    expect(system).toContain('valid JSON')
    expect(system).toContain('Never fabricate')
  })

  it('produces a user message containing chunk content', () => {
    const request = buildRequest()
    const { user } = buildExtractionMessages(request)

    expect(user).toContain('Displacement: 599cc')
    expect(user).toContain('Oil capacity: 3.1 liters')
    expect(user).toContain('chunk-1')
    expect(user).toContain('chunk-2')
  })

  it('replaces the {context} placeholder with actual chunk data', () => {
    const request = buildRequest()
    const { user } = buildExtractionMessages(request)

    expect(user).not.toContain('{context}')
    expect(user).toContain('Displacement: 599cc')
  })

  it('includes chunk metadata (ID and content type) in the user message', () => {
    const request = buildRequest()
    const { user } = buildExtractionMessages(request)

    expect(user).toContain('ID: chunk-1')
    expect(user).toContain('Type: spec_table')
  })
})

// ---------------------------------------------------------------------------
// estimateCost
// ---------------------------------------------------------------------------

describe('estimateCost', () => {
  it('calculates correct cost for claude-sonnet-4-20250514', () => {
    // 1000 prompt tokens at $3/MTok = $0.003
    // 500 completion tokens at $15/MTok = $0.0075
    const cost = estimateCost(1000, 500, 'claude-sonnet-4-20250514')

    expect(cost).toBeCloseTo(0.0105, 6)
  })

  it('calculates correct cost for claude-opus-4-20250514', () => {
    // 1000 prompt tokens at $15/MTok = $0.015
    // 500 completion tokens at $75/MTok = $0.0375
    const cost = estimateCost(1000, 500, 'claude-opus-4-20250514')

    expect(cost).toBeCloseTo(0.0525, 6)
  })

  it('uses sonnet pricing for unknown models', () => {
    const knownCost = estimateCost(1000, 500, 'claude-sonnet-4-20250514')
    const unknownCost = estimateCost(1000, 500, 'some-unknown-model')

    expect(unknownCost).toBe(knownCost)
  })

  it('returns 0 for zero tokens', () => {
    const cost = estimateCost(0, 0, 'claude-sonnet-4-20250514')

    expect(cost).toBe(0)
  })

  it('handles large token counts correctly', () => {
    // 1M prompt tokens at $3/MTok = $3
    // 1M completion tokens at $15/MTok = $15
    const cost = estimateCost(1_000_000, 1_000_000, 'claude-sonnet-4-20250514')

    expect(cost).toBeCloseTo(18, 2)
  })
})

// ---------------------------------------------------------------------------
// validateExtractionResult
// ---------------------------------------------------------------------------

describe('validateExtractionResult', () => {
  // --- Specs ---
  describe('specs validation', () => {
    it('passes for a valid specs object', () => {
      const validSpecs = {
        displacement_cc: 599,
        horsepower: 117,
        torque_nm: 65.7,
        oil_capacity_l: 3.1,
        valve_clearance_intake_mm: '0.16-0.19',
        valve_clearance_exhaust_mm: '0.22-0.27',
        spark_plug: 'NGK CR9EH-9',
        front_tire: '120/70ZR17',
        rear_tire: '180/55ZR17',
        wet_weight_kg: 186,
        seat_height_mm: 820,
        fuel_capacity_l: 18.1,
        compression_ratio: '12.2:1',
        bore_mm: 67,
        stroke_mm: 42.5,
      }

      const result = validateExtractionResult(validSpecs, 'specs')

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('fails when displacement_cc is negative', () => {
      const specs = { displacement_cc: -599 }
      const result = validateExtractionResult(specs, 'specs')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('displacement_cc must be a positive number, got -599')
    })

    it('fails when displacement_cc is missing', () => {
      const specs = { horsepower: 117 }
      const result = validateExtractionResult(specs, 'specs')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('displacement_cc is required')
    })

    it('fails when a numeric field is a string', () => {
      const specs = { displacement_cc: 599, horsepower: '117' }
      const result = validateExtractionResult(specs, 'specs')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('horsepower must be a number'))).toBe(true)
    })

    it('passes when optional numeric fields are null', () => {
      const specs = {
        displacement_cc: 599,
        horsepower: null,
        torque_nm: null,
        oil_capacity_l: null,
      }

      const result = validateExtractionResult(specs, 'specs')

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('fails when data is an array instead of an object', () => {
      const result = validateExtractionResult([{ displacement_cc: 599 }], 'specs')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Specs must be a JSON object, not an array or primitive')
    })
  })

  // --- Service Intervals ---
  describe('service_intervals validation', () => {
    it('passes for a valid service intervals array', () => {
      const intervals = [
        {
          service_name: 'Oil Change',
          interval_miles: 4000,
          interval_km: 6000,
          interval_months: 12,
          torque_spec_nm: 30,
          fluid_spec: 'SAE 10W-40',
          notes: null,
        },
      ]

      const result = validateExtractionResult(intervals, 'service_intervals')

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('fails for an empty array', () => {
      const result = validateExtractionResult([], 'service_intervals')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Service intervals array must not be empty')
    })

    it('fails when service_name is missing', () => {
      const intervals = [{ interval_miles: 4000 }]
      const result = validateExtractionResult(intervals, 'service_intervals')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('service_name'))).toBe(true)
    })

    it('fails when data is not an array', () => {
      const result = validateExtractionResult({ service_name: 'Oil Change' }, 'service_intervals')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Service intervals must be a JSON array')
    })
  })

  // --- DTC Codes ---
  describe('dtc_codes validation', () => {
    it('passes for a valid DTC codes array', () => {
      const codes = [
        {
          code: 'P0100',
          description: 'Intake Air Temperature Sensor Circuit',
          category: 'Engine',
          possible_causes: ['Faulty sensor', 'Wiring issue'],
          severity: 'warning',
        },
      ]

      const result = validateExtractionResult(codes, 'dtc_codes')

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('fails when code field is missing', () => {
      const codes = [{ description: 'Some issue' }]
      const result = validateExtractionResult(codes, 'dtc_codes')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('"code"'))).toBe(true)
    })

    it('fails when description field is missing', () => {
      const codes = [{ code: 'P0100' }]
      const result = validateExtractionResult(codes, 'dtc_codes')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('"description"'))).toBe(true)
    })

    it('fails for an empty array', () => {
      const result = validateExtractionResult([], 'dtc_codes')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('DTC codes array must not be empty')
    })

    it('fails when data is not an array', () => {
      const result = validateExtractionResult('P0100', 'dtc_codes')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('DTC codes must be a JSON array')
    })
  })

  // --- Procedures ---
  describe('procedures validation', () => {
    it('passes for a valid procedures array', () => {
      const procedures = [
        {
          title: 'Oil Change',
          steps: [
            { step_number: 1, instruction: 'Warm engine for 5 minutes', warning: null, torque_spec_nm: null, tool_required: null },
            { step_number: 2, instruction: 'Remove drain bolt', warning: 'Hot oil', torque_spec_nm: 30, tool_required: '17mm socket' },
          ],
          safety_level: 'green',
          estimated_time_minutes: 30,
          tools_required: ['17mm socket', 'oil pan', 'funnel'],
        },
      ]

      const result = validateExtractionResult(procedures, 'procedures')

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('fails when title is missing from a procedure', () => {
      const procedures = [{ steps: [{ step_number: 1, instruction: 'Do thing' }] }]
      const result = validateExtractionResult(procedures, 'procedures')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('"title"'))).toBe(true)
    })

    it('fails when steps is missing from a procedure', () => {
      const procedures = [{ title: 'Oil Change' }]
      const result = validateExtractionResult(procedures, 'procedures')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('"steps"'))).toBe(true)
    })
  })

  // --- Diagnostic Trees ---
  describe('diagnostic_trees validation', () => {
    it('passes for a valid diagnostic trees array', () => {
      const trees = [
        {
          title: 'Engine Won\'t Start',
          symptom: 'Cranks but does not start',
          nodes: [
            { id: 'node_1', question: 'Is there fuel in the tank?', yes_next: 'node_2', no_next: null, action: null, warning: null },
          ],
          safety_level: 'green',
        },
      ]

      const result = validateExtractionResult(trees, 'diagnostic_trees')

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('fails when title is missing from a diagnostic tree', () => {
      const trees = [{ nodes: [{ id: 'node_1', question: 'Test?' }] }]
      const result = validateExtractionResult(trees, 'diagnostic_trees')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('"title"'))).toBe(true)
    })

    it('fails when nodes is missing from a diagnostic tree', () => {
      const trees = [{ title: 'Engine Issue' }]
      const result = validateExtractionResult(trees, 'diagnostic_trees')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('"nodes"'))).toBe(true)
    })
  })

  // --- General / Edge Cases ---
  describe('general validation', () => {
    it('fails when data is null', () => {
      const result = validateExtractionResult(null, 'specs')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Extraction result is null or undefined')
    })

    it('fails when data is undefined', () => {
      const result = validateExtractionResult(undefined, 'specs')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Extraction result is null or undefined')
    })

    it('fails when non-object data is provided for specs', () => {
      const result = validateExtractionResult('not an object', 'specs')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Specs must be a JSON object, not an array or primitive')
    })

    it('fails when non-array data is provided for array types', () => {
      const arrayTypes: ExtractionType[] = ['service_intervals', 'dtc_codes', 'procedures', 'diagnostic_trees']

      for (const type of arrayTypes) {
        const result = validateExtractionResult({ not: 'an array' }, type)

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })
  })
})
