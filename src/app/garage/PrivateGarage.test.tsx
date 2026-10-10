import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { PrivateGarage, useGarageReconciliation } from './PrivateGarage'
const auth = vi.hoisted(() => ({ getUser: vi.fn(), onAuthStateChange: vi.fn() }))
vi.mock('@/lib/supabase/auth-browser', () => ({ createAuthBrowserClient: () => ({ auth }) }))
let notify: (event: string, session: null | { user: { id: string } }) => void
const user = (id: string | null) => ({ data: { user: id ? { id } : null }, error: null })
beforeEach(() => {
  vi.clearAllMocks(); auth.getUser.mockResolvedValue(user('a'))
  auth.onAuthStateChange.mockImplementation(callback => { notify = callback; return { data: { subscription: { unsubscribe: vi.fn() } } } })
})
it('hides private content until verified, clears it on account change and blocks stale lookups', async () => {
  let resolve!: (value: ReturnType<typeof user>) => void
  auth.getUser.mockReturnValueOnce(new Promise(done => { resolve = done }))
  render(<PrivateGarage ownerId="a"><p>Private registration</p></PrivateGarage>)
  expect(screen.getByText('Private registration')).not.toBeVisible()
  act(() => notify('SIGNED_IN', { user: { id: 'b' } }))
  expect(screen.queryByText('Private registration')).not.toBeInTheDocument()
  await act(async () => resolve(user('a')))
  expect(screen.queryByText('Private registration')).not.toBeInTheDocument()
})
it('removes private drafts on explicit sign-out', async () => {
  render(<PrivateGarage ownerId="a"><input aria-label="Draft" defaultValue="Private" /></PrivateGarage>)
  await waitFor(() => expect(screen.getByLabelText('Draft')).toBeVisible())
  act(() => notify('SIGNED_OUT', null))
  expect(screen.queryByLabelText('Draft')).not.toBeInTheDocument()
})
it('hides back-forward snapshots before restore and checks the current account', async () => {
  render(<PrivateGarage ownerId="a"><p>Private registration</p></PrivateGarage>)
  await waitFor(() => expect(screen.getByText('Private registration')).toBeVisible())
  fireEvent(window, new Event('pagehide'))
  expect(screen.getByText('Private registration')).not.toBeVisible()
  auth.getUser.mockResolvedValue(user('b'))
  fireEvent(window, new Event('pageshow'))
  await waitFor(() => expect(screen.queryByText('Private registration')).not.toBeInTheDocument())
})
it('retains an unsaved draft invisibly on expiry and restores it only for the same owner', async () => {
  render(<PrivateGarage ownerId="a"><input aria-label="Draft" defaultValue="Keep me" /></PrivateGarage>)
  await waitFor(() => expect(screen.getByLabelText('Draft')).toBeVisible())
  auth.getUser.mockResolvedValue(user(null)); fireEvent.focus(window)
  await waitFor(() => expect(screen.getByLabelText('Draft')).not.toBeVisible())
  expect(screen.getByRole('link', { name: 'Sign in to open My Garage' })).toHaveAttribute('target', '_blank')
  auth.getUser.mockResolvedValue(user('a')); fireEvent.focus(window)
  await waitFor(() => expect(screen.getByLabelText('Draft')).toBeVisible())
  expect(screen.getByLabelText('Draft')).toHaveValue('Keep me')
})
it('does not reveal a hidden page when an earlier account lookup finishes late', async () => {
  let resolve!: (value: ReturnType<typeof user>) => void
  auth.getUser.mockReturnValueOnce(new Promise(done => { resolve = done }))
  render(<PrivateGarage ownerId="a"><p>Private registration</p></PrivateGarage>)
  fireEvent(window, new Event('pagehide'))
  await act(async () => resolve(user('a')))
  expect(screen.getByText('Private registration')).not.toBeVisible()
})
it('keeps drafts hidden when account verification cannot reach the server', async () => {
  auth.getUser.mockRejectedValue(new Error('Network unavailable'))
  render(<PrivateGarage ownerId="a"><input aria-label="Draft" defaultValue="Keep me" /></PrivateGarage>)
  expect(await screen.findByRole('link', { name: 'Sign in to open My Garage' })).toBeInTheDocument()
  expect(screen.getByLabelText('Draft')).not.toBeVisible()
})

it('waits for record reconciliation before restoration and cannot reveal it after sign-out', async () => {
  let resolve!: () => void
  const reconcile = vi.fn().mockResolvedValueOnce(undefined).mockImplementationOnce(() => new Promise<void>(done => { resolve = done }))
  function Records() {
    useGarageReconciliation(reconcile)
    return <p>Private registration</p>
  }
  render(<PrivateGarage ownerId="a"><Records /></PrivateGarage>)
  await waitFor(() => expect(screen.getByText('Private registration')).toBeVisible())
  fireEvent(window, new Event('pagehide')); fireEvent(window, new Event('pageshow'))
  await waitFor(() => expect(reconcile).toHaveBeenCalledTimes(2))
  expect(screen.getByText('Private registration')).not.toBeVisible()
  act(() => notify('SIGNED_OUT', null))
  await act(async () => resolve())
  expect(screen.queryByText('Private registration')).not.toBeInTheDocument()
})

import { QuickJobForm } from './[bikeId]/QuickJobForm'
import { bikeFixture } from '@/test/garageFixtures'
it('preserves maintenance values invisibly on expiry and removes them on owner change',async()=>{
 render(<PrivateGarage ownerId="a"><QuickJobForm bike={bikeFixture()} onSave={vi.fn()} /></PrivateGarage>)
 await waitFor(()=>expect(screen.getByLabelText('Work performed')).toBeVisible())
 fireEvent.change(screen.getByLabelText('Work performed'),{target:{value:'Private oil change'}})
 auth.getUser.mockResolvedValue(user(null));fireEvent.focus(window)
 await waitFor(()=>expect(screen.getByLabelText('Work performed')).not.toBeVisible())
 auth.getUser.mockResolvedValue(user('a'));fireEvent.focus(window)
 await waitFor(()=>expect(screen.getByLabelText('Work performed')).toBeVisible())
 expect(screen.getByLabelText('Work performed')).toHaveValue('Private oil change')
 act(()=>notify('SIGNED_IN',{user:{id:'b'}}));expect(screen.queryByLabelText('Work performed')).not.toBeInTheDocument()
})

import { BikeWorkspace } from './[bikeId]/BikeWorkspace'
import { jobFixture } from '@/test/garageFixtures'
const workspaceActions=vi.hoisted(()=>({loadBikeWorkspace:vi.fn(),saveQuickJob:vi.fn(),correctJob:vi.fn(),removeJob:vi.fn(),saveBike:vi.fn(),setArchived:vi.fn(),deleteBike:vi.fn()}))
vi.mock('./actions',()=>workspaceActions)
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()})}))
it('reconciles owned mileage and history on return without overwriting either dirty form',async()=>{
 const bike=bikeFixture({nickname:'Original',mileageKm:100,registration:'PRIVATE'})
 workspaceActions.loadBikeWorkspace.mockResolvedValueOnce({bike,jobs:[]})
 render(<PrivateGarage ownerId="a"><BikeWorkspace bike={bike} /></PrivateGarage>)
 await waitFor(()=>expect(screen.getByRole('heading',{name:'Original'})).toBeVisible())
 fireEvent.click(screen.getByRole('radio',{name:'Maintenance'}));fireEvent.click(screen.getByRole('button',{name:'Log maintenance'}));fireEvent.change(screen.getByLabelText('Work performed'),{target:{value:'Unsaved work'}})
 fireEvent.click(screen.getByRole('radio',{name:'Bike details'}));fireEvent.change(screen.getByLabelText('Nickname'),{target:{value:'Draft nickname'}})
 auth.getUser.mockResolvedValue(user(null));fireEvent.focus(window)
 await waitFor(()=>expect(screen.getByLabelText('Nickname')).not.toBeVisible())
 workspaceActions.loadBikeWorkspace.mockResolvedValue({bike:{...bike,nickname:'Remote',mileageKm:900},jobs:[jobFixture({status:'completed',title:'Remote work'})]})
 auth.getUser.mockResolvedValue(user('a'));fireEvent.focus(window)
 await waitFor(()=>expect(screen.getByLabelText('Nickname')).toBeVisible());expect(screen.getByLabelText('Nickname')).toHaveValue('Draft nickname')
 fireEvent.click(screen.getByRole('radio',{name:'Maintenance'}));expect(screen.getByLabelText('Work performed')).toHaveValue('Unsaved work');expect(screen.getByRole('button',{name:'Show record: Remote work'})).toBeInTheDocument()
 fireEvent.click(screen.getByRole('radio',{name:'Overview'}));expect(screen.getByText('900 km')).toBeInTheDocument()
 act(()=>notify('SIGNED_IN',{user:{id:'b'}}));expect(screen.queryByText('900 km')).not.toBeInTheDocument();expect(screen.queryByLabelText('Registration')).not.toBeInTheDocument()
})
