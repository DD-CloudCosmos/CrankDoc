/**
 * Structured Data Extraction
 *
 * Extracts structured data (specs, service intervals, DTC codes, procedures,
 * diagnostic trees) from document chunks using Claude. Produces typed JSON
 * that can be written directly into CrankDoc database tables.
 *
 * Server-side only — intended for the admin ingestion pipeline.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Supported extraction categories, each mapping to a target database table. */
export const EXTRACTION_TYPES = [
  'specs',
  'service_intervals',
  'procedures',
  'dtc_codes',
  'diagnostic_trees',
] as const

export type ExtractionType = (typeof EXTRACTION_TYPES)[number]

/** Maps each extraction type to its destination database table. */
export const TARGET_TABLE_MAP: Record<ExtractionType, string> = {
  specs: 'motorcycles',
  service_intervals: 'service_intervals',
  procedures: 'diagnostic_trees',
  dtc_codes: 'dtc_codes',
  diagnostic_trees: 'diagnostic_trees',
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Request payload for a structured extraction job. */
export interface ExtractionRequest {
  documentSourceId: string
  extractionType: ExtractionType
  chunks: Array<{ id: string; content: string; contentType: string }>
  metadata: {
    make: string
    model: string
    yearStart: number
    yearEnd: number | null
  }
}

/** Result of a single extraction run. */
export interface ExtractionResult {
  /** The structured JSON extracted by Claude */
  extractedData: unknown
  /** IDs of chunks that contributed to the extraction */
  chunksUsed: string[]
  promptTokens: number
  completionTokens: number
  costUsd: number
}

/** Describes a conflict between existing DB data and newly extracted data. */
export interface ExtractionConflict {
  field: string
  existingValue: unknown
  extractedValue: unknown
  sourceDocument: string
  confidence: 'high' | 'medium' | 'low'
}

// ---------------------------------------------------------------------------
// Pricing (USD per million tokens)
// ---------------------------------------------------------------------------

type ModelPricing = { input: number; output: number }

const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-opus-4-20250514': { input: 15, output: 75 },
}

const DEFAULT_PRICING: ModelPricing = MODEL_PRICING['claude-sonnet-4-20250514']

// ---------------------------------------------------------------------------
// Prompt Templates
// ---------------------------------------------------------------------------

/**
 * Returns the appropriate extraction prompt template for the given type.
 *
 * Every prompt includes:
 * - A target JSON schema the model must produce
 * - Rules for accuracy, unit conversion, and range handling
 * - A `{context}` placeholder that will be replaced with chunk content
 */
export function getExtractionPrompt(
  type: ExtractionType,
  metadata: ExtractionRequest['metadata']
): string {
  const bikeLabel = [
    metadata.make,
    metadata.model,
    metadata.yearStart,
    metadata.yearEnd ? `-${metadata.yearEnd}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  switch (type) {
    case 'specs':
      return buildSpecsPrompt(bikeLabel)
    case 'service_intervals':
      return buildServiceIntervalsPrompt(bikeLabel)
    case 'dtc_codes':
      return buildDtcCodesPrompt(bikeLabel)
    case 'procedures':
      return buildProceduresPrompt(bikeLabel)
    case 'diagnostic_trees':
      return buildDiagnosticTreesPrompt(bikeLabel)
  }
}

function buildSpecsPrompt(bikeLabel: string): string {
  return `Extract motorcycle specifications for the ${bikeLabel} from the following reference material.

Return a JSON object matching this schema:
{
  "displacement_cc": <number>,
  "horsepower": <number | null>,
  "torque_nm": <number | null>,
  "oil_capacity_l": <number | null>,
  "valve_clearance_intake_mm": <string | null>,
  "valve_clearance_exhaust_mm": <string | null>,
  "spark_plug": <string | null>,
  "front_tire": <string | null>,
  "rear_tire": <string | null>,
  "wet_weight_kg": <number | null>,
  "seat_height_mm": <number | null>,
  "fuel_capacity_l": <number | null>,
  "compression_ratio": <string | null>,
  "bore_mm": <number | null>,
  "stroke_mm": <number | null>
}

RULES:
- Only extract values explicitly stated in the text. Do not estimate or infer.
- Convert units where needed: lb-ft to Nm (multiply by 1.3558), inches to mm, quarts to liters (multiply by 0.9464), lbs to kg (multiply by 0.4536).
- Use range strings for clearances (e.g., "0.16-0.19").
- Numeric values must be positive numbers.
- Use null for any field not found in the source material.

{context}`
}

function buildServiceIntervalsPrompt(bikeLabel: string): string {
  return `Extract service interval schedule for the ${bikeLabel} from the following reference material.

Return a JSON array of objects matching this schema:
[
  {
    "service_name": <string>,
    "interval_miles": <number | null>,
    "interval_km": <number | null>,
    "interval_months": <number | null>,
    "torque_spec_nm": <number | null>,
    "fluid_spec": <string | null>,
    "notes": <string | null>
  }
]

RULES:
- Only extract service items explicitly listed in the text.
- Convert units where needed: lb-ft to Nm (multiply by 1.3558), miles to km (multiply by 1.6093).
- Every item must have a service_name.
- Numeric intervals must be positive numbers.
- Use null for any field not found in the source material.

{context}`
}

function buildDtcCodesPrompt(bikeLabel: string): string {
  return `Extract DTC (Diagnostic Trouble Code) definitions for the ${bikeLabel} from the following reference material.

Return a JSON array of objects matching this schema:
[
  {
    "code": <string>,
    "description": <string>,
    "category": <string | null>,
    "possible_causes": <string[] | null>,
    "severity": <"critical" | "warning" | "info" | null>
  }
]

RULES:
- Only extract DTC codes explicitly listed in the text.
- The "code" field must contain the exact code (e.g., "P0100", "C1200").
- The "description" field must contain the human-readable description.
- Group by category when the source material organizes them that way.
- Convert units where needed in cause descriptions: use metric as primary.
- Use null for any field not found in the source material.

{context}`
}

function buildProceduresPrompt(bikeLabel: string): string {
  return `Extract step-by-step repair or maintenance procedures for the ${bikeLabel} from the following reference material.

Return a JSON array of objects matching this schema:
[
  {
    "title": <string>,
    "steps": [
      {
        "step_number": <number>,
        "instruction": <string>,
        "warning": <string | null>,
        "torque_spec_nm": <number | null>,
        "tool_required": <string | null>
      }
    ],
    "safety_level": <"green" | "yellow" | "red">,
    "estimated_time_minutes": <number | null>,
    "tools_required": <string[]>
  }
]

RULES:
- Only extract procedures explicitly described in the text.
- Preserve the original step order.
- Convert units where needed: lb-ft to Nm (multiply by 1.3558), inches to mm.
- Include safety warnings from the source material on the relevant step.
- Set safety_level based on the work type: "green" for basic maintenance, "yellow" for intermediate, "red" for brake/electrical/fuel/structural work.
- Use null for any field not found in the source material.

{context}`
}

function buildDiagnosticTreesPrompt(bikeLabel: string): string {
  return `Extract diagnostic troubleshooting decision trees for the ${bikeLabel} from the following reference material.

Return a JSON array of objects matching this schema:
[
  {
    "title": <string>,
    "symptom": <string>,
    "nodes": [
      {
        "id": <string>,
        "question": <string>,
        "yes_next": <string | null>,
        "no_next": <string | null>,
        "action": <string | null>,
        "warning": <string | null>
      }
    ],
    "safety_level": <"green" | "yellow" | "red">
  }
]

RULES:
- Only extract troubleshooting flows explicitly described in the text.
- Each node should have a clear yes/no question or a terminal action.
- Use unique string IDs for nodes (e.g., "node_1", "node_2").
- Convert units where needed: use metric as primary.
- Include safety warnings from the source material on relevant nodes.
- Set safety_level based on the systems involved: "green" for basic, "yellow" for intermediate, "red" for brake/electrical/fuel/structural.
- Use null for any field not found in the source material.

{context}`
}

// ---------------------------------------------------------------------------
// Message Assembly
// ---------------------------------------------------------------------------

/**
 * Assembles the full system and user messages for an extraction request.
 *
 * The system message contains high-level extraction instructions.
 * The user message injects chunk content into the prompt template's
 * `{context}` placeholder.
 */
export function buildExtractionMessages(
  request: ExtractionRequest
): { system: string; user: string } {
  const prompt = getExtractionPrompt(request.extractionType, request.metadata)

  const chunkContent = request.chunks
    .map((chunk, index) => {
      return `--- Chunk ${index + 1} (ID: ${chunk.id}, Type: ${chunk.contentType}) ---\n${chunk.content}`
    })
    .join('\n\n')

  const system = `You are a structured data extraction engine for CrankDoc, a motorcycle diagnostic application. Your task is to extract structured data from motorcycle service manuals and technical documents.

INSTRUCTIONS:
1. Read the provided reference material carefully.
2. Extract ONLY the data requested in the specified JSON schema.
3. Return valid JSON and nothing else — no markdown fences, no commentary.
4. If a field cannot be determined from the source material, use null.
5. Never fabricate or estimate values. Only use data explicitly present in the text.
6. Convert units to metric as the primary unit where applicable.`

  const user = prompt.replace('{context}', chunkContent)

  return { system, user }
}

// ---------------------------------------------------------------------------
// Cost Estimation
// ---------------------------------------------------------------------------

/**
 * Estimates USD cost for a Claude API call based on token counts.
 *
 * Pricing (per million tokens):
 * - claude-sonnet-4-20250514: $3 input / $15 output
 * - claude-opus-4-20250514: $15 input / $75 output
 * - Unknown models default to Sonnet pricing.
 */
export function estimateCost(
  promptTokens: number,
  completionTokens: number,
  model: string
): number {
  const pricing = MODEL_PRICING[model] ?? DEFAULT_PRICING

  const inputCost = (promptTokens / 1_000_000) * pricing.input
  const outputCost = (completionTokens / 1_000_000) * pricing.output

  return inputCost + outputCost
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Performs basic structural validation of extracted data.
 *
 * Returns a list of validation errors. An empty errors array with
 * `valid: true` means the data passed all checks.
 */
export function validateExtractionResult(
  data: unknown,
  type: ExtractionType
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (data === null || data === undefined) {
    errors.push('Extraction result is null or undefined')
    return { valid: false, errors }
  }

  switch (type) {
    case 'specs':
      validateSpecs(data, errors)
      break
    case 'service_intervals':
      validateServiceIntervals(data, errors)
      break
    case 'dtc_codes':
      validateDtcCodes(data, errors)
      break
    case 'procedures':
      validateProcedures(data, errors)
      break
    case 'diagnostic_trees':
      validateDiagnosticTrees(data, errors)
      break
  }

  return { valid: errors.length === 0, errors }
}

function validateSpecs(data: unknown, errors: string[]): void {
  if (typeof data !== 'object' || Array.isArray(data)) {
    errors.push('Specs must be a JSON object, not an array or primitive')
    return
  }

  const record = data as Record<string, unknown>

  // Check that numeric fields are positive when present
  const numericFields = [
    'displacement_cc',
    'horsepower',
    'torque_nm',
    'oil_capacity_l',
    'wet_weight_kg',
    'seat_height_mm',
    'fuel_capacity_l',
    'bore_mm',
    'stroke_mm',
  ]

  for (const field of numericFields) {
    const value = record[field]
    if (value !== null && value !== undefined) {
      if (typeof value !== 'number') {
        errors.push(`${field} must be a number, got ${typeof value}`)
      } else if (value <= 0) {
        errors.push(`${field} must be a positive number, got ${value}`)
      }
    }
  }

  // displacement_cc is required
  if (record['displacement_cc'] === null || record['displacement_cc'] === undefined) {
    errors.push('displacement_cc is required')
  }
}

function validateServiceIntervals(data: unknown, errors: string[]): void {
  if (!Array.isArray(data)) {
    errors.push('Service intervals must be a JSON array')
    return
  }

  if (data.length === 0) {
    errors.push('Service intervals array must not be empty')
    return
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i] as Record<string, unknown>
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`Service interval at index ${i} must be an object`)
      continue
    }
    if (!item['service_name'] || typeof item['service_name'] !== 'string') {
      errors.push(`Service interval at index ${i} is missing required field "service_name"`)
    }
  }
}

function validateDtcCodes(data: unknown, errors: string[]): void {
  if (!Array.isArray(data)) {
    errors.push('DTC codes must be a JSON array')
    return
  }

  if (data.length === 0) {
    errors.push('DTC codes array must not be empty')
    return
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i] as Record<string, unknown>
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`DTC code at index ${i} must be an object`)
      continue
    }
    if (!item['code'] || typeof item['code'] !== 'string') {
      errors.push(`DTC code at index ${i} is missing required field "code"`)
    }
    if (!item['description'] || typeof item['description'] !== 'string') {
      errors.push(`DTC code at index ${i} is missing required field "description"`)
    }
  }
}

function validateProcedures(data: unknown, errors: string[]): void {
  if (!Array.isArray(data)) {
    errors.push('Procedures must be a JSON array')
    return
  }

  if (data.length === 0) {
    errors.push('Procedures array must not be empty')
    return
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i] as Record<string, unknown>
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`Procedure at index ${i} must be an object`)
      continue
    }
    if (!item['title'] || typeof item['title'] !== 'string') {
      errors.push(`Procedure at index ${i} is missing required field "title"`)
    }
    if (!Array.isArray(item['steps'])) {
      errors.push(`Procedure at index ${i} is missing required field "steps" (must be an array)`)
    }
  }
}

function validateDiagnosticTrees(data: unknown, errors: string[]): void {
  if (!Array.isArray(data)) {
    errors.push('Diagnostic trees must be a JSON array')
    return
  }

  if (data.length === 0) {
    errors.push('Diagnostic trees array must not be empty')
    return
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i] as Record<string, unknown>
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`Diagnostic tree at index ${i} must be an object`)
      continue
    }
    if (!item['title'] || typeof item['title'] !== 'string') {
      errors.push(`Diagnostic tree at index ${i} is missing required field "title"`)
    }
    if (!Array.isArray(item['nodes'])) {
      errors.push(`Diagnostic tree at index ${i} is missing required field "nodes" (must be an array)`)
    }
  }
}
