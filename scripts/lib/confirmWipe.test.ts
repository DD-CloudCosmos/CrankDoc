import { describe, it, expect } from 'vitest'
import { checkWipeConfirmation, projectRef } from './confirmWipe'

const URL = 'https://abcd1234.supabase.co'
const TABLES = ['dtc_codes', 'motorcycles']

describe('projectRef', () => {
  it('reads the project ref from a Supabase URL', () => {
    expect(projectRef(URL)).toBe('abcd1234')
  })

  it('returns null for a value that is not a URL', () => {
    expect(projectRef('not a url')).toBeNull()
    expect(projectRef(undefined as unknown as string)).toBeNull()
  })
})

describe('checkWipeConfirmation', () => {
  it('refuses to run without a confirmation and says what would be deleted', () => {
    const result = checkWipeConfirmation([], {}, URL, TABLES)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('dtc_codes, motorcycles')
    expect(result.message).toContain('--confirm-wipe=abcd1234')
    expect(result.message).toContain('No confirmation was given.')
  })

  it('accepts the matching project ref as a flag', () => {
    expect(checkWipeConfirmation(['--confirm-wipe=abcd1234'], {}, URL, TABLES).ok).toBe(true)
  })

  it('accepts the matching project ref from the environment, so seed:all can pass it on', () => {
    expect(checkWipeConfirmation([], { CONFIRM_WIPE: 'abcd1234' }, URL, TABLES).ok).toBe(true)
  })

  it('refuses a confirmation for a different project', () => {
    const result = checkWipeConfirmation(['--confirm-wipe=other999'], {}, URL, TABLES)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('does not match the connected project "abcd1234"')
  })

  it('refuses a bare flag or a generic "yes"', () => {
    expect(checkWipeConfirmation(['--confirm-wipe'], {}, URL, TABLES).ok).toBe(false)
    expect(checkWipeConfirmation(['--confirm-wipe=yes'], {}, URL, TABLES).ok).toBe(false)
    expect(checkWipeConfirmation([], { CONFIRM_WIPE: 'true' }, URL, TABLES).ok).toBe(false)
  })

  it('refuses when the Supabase URL cannot be read', () => {
    expect(checkWipeConfirmation(['--confirm-wipe=abcd1234'], {}, 'nonsense', TABLES).ok).toBe(false)
  })
})
