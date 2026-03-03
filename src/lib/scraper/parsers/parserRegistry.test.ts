import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerParser,
  getParser,
  hasParser,
  clearParsers,
  type ParserFn,
} from './parserRegistry'

describe('parserRegistry', () => {
  beforeEach(() => {
    clearParsers()
  })

  it('registers and retrieves a parser', async () => {
    const mockParser: ParserFn = async (html, title) => ({
      fullText: `parsed: ${title}`,
      sections: [{ heading: 'Test', content: html, level: 2 }],
    })

    registerParser('test-parser', mockParser)
    const retrieved = getParser('test-parser')

    expect(retrieved).toBe(mockParser)

    const result = await retrieved!('<p>hello</p>', 'Test Page')
    expect(result.fullText).toBe('parsed: Test Page')
    expect(result.sections).toHaveLength(1)
  })

  it('returns undefined for unregistered parser', () => {
    expect(getParser('nonexistent')).toBeUndefined()
  })

  it('hasParser returns true for registered parser', () => {
    const mockParser: ParserFn = async () => ({ fullText: '', sections: [] })
    registerParser('exists', mockParser)

    expect(hasParser('exists')).toBe(true)
  })

  it('hasParser returns false for unregistered parser', () => {
    expect(hasParser('missing')).toBe(false)
  })

  it('clearParsers removes all registered parsers', () => {
    const mockParser: ParserFn = async () => ({ fullText: '', sections: [] })
    registerParser('one', mockParser)
    registerParser('two', mockParser)

    expect(hasParser('one')).toBe(true)
    expect(hasParser('two')).toBe(true)

    clearParsers()

    expect(hasParser('one')).toBe(false)
    expect(hasParser('two')).toBe(false)
  })

  it('overwrites parser when registering with same ID', () => {
    const parser1: ParserFn = async () => ({ fullText: 'first', sections: [] })
    const parser2: ParserFn = async () => ({ fullText: 'second', sections: [] })

    registerParser('overwrite', parser1)
    registerParser('overwrite', parser2)

    expect(getParser('overwrite')).toBe(parser2)
  })
})
