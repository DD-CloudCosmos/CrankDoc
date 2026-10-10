import { expect, it } from 'vitest'
import { isPrivatePath } from './privatePaths'
it('recognises private roots and descendants without matching public neighbours', () => {
  for (const root of ['/garage', '/account', '/auth', '/api/garage']) {
    expect(isPrivatePath(root)).toBe(true)
    expect(isPrivatePath(`${root}/child`)).toBe(true)
    expect(isPrivatePath(`${root}-public`)).toBe(false)
  }
  expect(isPrivatePath('/')).toBe(false)
})
