import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getAccount } from '@/lib/account'
import { getBike } from '@/lib/garageRepository.server'
import { getJob } from '@/lib/maintenance/jobsRepository.server'
import { bikeFixture, jobFixture } from '@/test/garageFixtures'
import Page, { dynamic } from './page'
vi.mock('@/lib/account',()=>({getAccount:vi.fn()}))
vi.mock('@/lib/garageRepository.server',()=>({getBike:vi.fn()}))
vi.mock('@/lib/maintenance/jobsRepository.server',()=>({getJob:vi.fn()}))
vi.mock('next/navigation',()=>({notFound:()=>{throw new Error('Not found')}}))
vi.mock('../../../../PrivateGarage',()=>({PrivateGarage:({children}:{children:React.ReactNode})=>children}))
const bike=bikeFixture(),job=jobFixture(),params=Promise.resolve({bikeId:bike.id,jobId:job.id})
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getAccount).mockResolvedValue({userId:'owner'} as never);vi.mocked(getBike).mockResolvedValue(bike);vi.mocked(getJob).mockResolvedValue(job)})
it('requires sign-in without loading a job',async()=>{vi.mocked(getAccount).mockResolvedValue(null);render(await Page({params}));expect(screen.getByText('Sign in to print this job')).toBeVisible();expect(getJob).not.toHaveBeenCalled();expect(dynamic).toBe('force-dynamic')})
it('renders saved facts through both owner-scoped reads',async()=>{render(await Page({params}));expect(screen.getByRole('heading',{name:'Service'})).toBeVisible();expect(getBike).toHaveBeenCalledWith(expect.objectContaining({userId:'owner'}),bike.id);expect(getJob).toHaveBeenCalledWith(expect.objectContaining({userId:'owner'}),job.id)})
it('rejects invalid, foreign and mismatched identifiers uniformly',async()=>{await expect(Page({params:Promise.resolve({bikeId:'invalid',jobId:job.id})})).rejects.toThrow('Not found');vi.mocked(getBike).mockResolvedValueOnce(null);await expect(Page({params})).rejects.toThrow('Not found');vi.mocked(getJob).mockResolvedValueOnce(null);await expect(Page({params})).rejects.toThrow('Not found');vi.mocked(getJob).mockResolvedValueOnce({...job,bikeId:'foreign'});await expect(Page({params})).rejects.toThrow('Not found')})
