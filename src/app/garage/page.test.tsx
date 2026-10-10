import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getAccount } from '@/lib/account'
import { listBikes } from '@/lib/garageRepository.server'
import GaragePage, { dynamic } from './page'
vi.mock('@/lib/account', () => ({ getAccount: vi.fn() }))
vi.mock('@/lib/garageRepository.server', () => ({ listBikes: vi.fn() }))
vi.mock('./PrivateGarage', () => ({ PrivateGarage: ({ children }: { children: React.ReactNode }) => children }))
vi.mock('./GarageCollection', () => ({ GarageCollection: () => <p>Private collection</p> }))
beforeEach(() => vi.clearAllMocks())
it('requires sign-in without reading bikes for a signed-out visitor', async () => {
  vi.mocked(getAccount).mockResolvedValue(null)
  render(await GaragePage())
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/account?next=/garage')
  expect(listBikes).not.toHaveBeenCalled()
  expect(dynamic).toBe('force-dynamic')
})
it('loads the verified owner and public catalogue beneath the private boundary', async () => {
  const query = { select: vi.fn(), order: vi.fn(), then: (resolve: (result: unknown) => void) => resolve({ data: [], error: null }) }
  query.select.mockReturnValue(query); query.order.mockReturnValue(query)
  const account = { userId: 'owner', client: { from: () => query } } as unknown as NonNullable<Awaited<ReturnType<typeof getAccount>>>
  vi.mocked(getAccount).mockResolvedValue(account); vi.mocked(listBikes).mockResolvedValue([])
  render(await GaragePage())
  expect(listBikes).toHaveBeenCalledWith(account)
  expect(screen.getByText('Private collection')).toBeInTheDocument()
})
