/**
 * Parser Registry
 *
 * Maps parser IDs to parser functions, allowing the scrape pipeline
 * to dispatch to the correct parser based on source configuration.
 */

import type { ParsedSection } from '../scraper.types'

/** A parser function that converts HTML into structured text. */
export type ParserFn = (
  html: string,
  title: string
) => Promise<{ fullText: string; sections: ParsedSection[] }>

const registry = new Map<string, ParserFn>()

/** Registers a parser function under the given ID. */
export function registerParser(id: string, parser: ParserFn): void {
  registry.set(id, parser)
}

/** Returns the parser function for the given ID, or undefined if not registered. */
export function getParser(id: string): ParserFn | undefined {
  return registry.get(id)
}

/** Returns true if a parser is registered under the given ID. */
export function hasParser(id: string): boolean {
  return registry.has(id)
}

/** Clears all registered parsers. Useful for test cleanup. */
export function clearParsers(): void {
  registry.clear()
}
