import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * The install prompt and the home-screen icon silently break when an icon
 * file is missing (it happened: the PNGs were gitignored and never deployed).
 * These tests check that every icon the app points to is really in public/.
 */
const publicDir = path.join(process.cwd(), 'public')

function existsInPublic(urlPath: string) {
  return fs.existsSync(path.join(publicDir, urlPath))
}

describe('PWA assets', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'manifest.json'), 'utf8')) as {
    icons: { src: string; sizes: string; purpose?: string }[]
  }

  it('has every icon file listed in the manifest', () => {
    expect(manifest.icons.length).toBeGreaterThan(0)
    for (const icon of manifest.icons) {
      expect(existsInPublic(icon.src), `${icon.src} is missing from public/`).toBe(true)
    }
  })

  it('offers the 192px and 512px icons browsers need to show the install prompt, plus a maskable one', () => {
    const sizes = manifest.icons.filter((icon) => !icon.purpose).map((icon) => icon.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
  })

  it('has the Apple touch icon the layout points to', () => {
    const layout = fs.readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf8')
    const applePath = layout.match(/apple:\s*'([^']+)'/)?.[1]
    expect(applePath).toBeDefined()
    expect(existsInPublic(applePath as string), `${applePath} is missing from public/`).toBe(true)
  })

  it('does not ignore PNG files under public/ in git', () => {
    const gitignore = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8')
    expect(gitignore).toContain('!public/**/*.png')
  })
})
