import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { SITE_STATS } from './siteStats'

const DATA_DIR = path.join(process.cwd(), 'data')

function readJsonFiles(dir: string): unknown[] {
  return fs
    .readdirSync(path.join(DATA_DIR, dir))
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, dir, file), 'utf8')))
}

describe('SITE_STATS matches the seed data', () => {
  const trees = readJsonFiles('trees') as Array<{ tree_data: { nodes: unknown[] } }>

  it('counts diagnostic guides', () => {
    expect(SITE_STATS.treeCount).toBe(trees.length)
  })

  it('counts decision steps', () => {
    const steps = trees.reduce((sum, tree) => sum + tree.tree_data.nodes.length, 0)
    expect(SITE_STATS.stepCount).toBe(steps)
  })

  it('counts fault codes and their manufacturers', () => {
    const files = readJsonFiles('dtc') as unknown[][]
    expect(SITE_STATS.dtcCount).toBe(files.reduce((sum, codes) => sum + codes.length, 0))
    expect(SITE_STATS.dtcManufacturerCount).toBe(files.length)
  })

  it('counts service intervals', () => {
    const files = readJsonFiles('service-intervals') as Array<{ intervals: unknown[] }>
    expect(SITE_STATS.serviceIntervalCount).toBe(files.reduce((sum, file) => sum + file.intervals.length, 0))
  })

  it('counts models that have guides', () => {
    const models = new Set(
      (trees as Array<{ motorcycle_make?: string; motorcycle_model?: string }>)
        .filter((tree) => tree.motorcycle_make)
        .map((tree) => `${tree.motorcycle_make} ${tree.motorcycle_model}`)
    )
    // Harley-Davidson Sportster carb/EFI variants share trees in data/, so the
    // models table holds a few more entries than distinct tree models.
    expect(SITE_STATS.modelCount).toBeGreaterThanOrEqual(models.size)
  })
})
