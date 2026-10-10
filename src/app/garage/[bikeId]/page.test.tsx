import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getAccount } from '@/lib/account'
import { getBike } from '@/lib/garageRepository.server'
import BikePage, { dynamic } from './page'
vi.mock('@/lib/account', () => ({ getAccount: vi.fn() }))
vi.mock('@/lib/garageRepository.server', () => ({ getBike: vi.fn() }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('Not found') } }))
vi.mock('../PrivateGarage', () => ({ PrivateGarage: ({ children }: { children: React.ReactNode }) => children }))
vi.mock('./BikeWorkspace', () => ({ BikeWorkspace: () => <p>Private bike</p> }))
const id = '00000000-0000-4000-8000-000000000001'
beforeEach(() => vi.clearAllMocks())
it('shows sign-in for a valid signed-out bike request', async () => {
  vi.mocked(getAccount).mockResolvedValue(null)
  render(await BikePage({ params: Promise.resolve({ bikeId: id }) }))
  expect(screen.getByRole('link', { name: /Sign in/ })).toHaveAttribute('href', `/account?next=${encodeURIComponent(`/garage/${id}`)}`)
  expect(getBike).not.toHaveBeenCalled()
  expect(dynamic).toBe('force-dynamic')
})
it('uses the same not-found result for invalid and foreign IDs', async () => {
  const account = { userId: 'owner' } as NonNullable<Awaited<ReturnType<typeof getAccount>>>
  vi.mocked(getAccount).mockResolvedValue(account); vi.mocked(getBike).mockResolvedValue(null)
  await expect(BikePage({ params: Promise.resolve({ bikeId: 'invalid' }) })).rejects.toThrow('Not found')
  await expect(BikePage({ params: Promise.resolve({ bikeId: id }) })).rejects.toThrow('Not found')
  expect(getBike).toHaveBeenCalledWith(account, id)
})
it('opens a verified owner bike', async () => {
  vi.mocked(getAccount).mockResolvedValue({ userId: 'owner' } as never)
  vi.mocked(getBike).mockResolvedValue({ id } as never)
  render(await BikePage({ params: Promise.resolve({ bikeId: id }) }))
  expect(screen.getByText('Private bike')).toBeInTheDocument()
})
