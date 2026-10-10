import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getAccount } from '@/lib/account'
import { getBike } from '@/lib/garageRepository.server'
import { getJob } from '@/lib/maintenance/jobsRepository.server'
import { bikeFixture, jobFixture } from '@/test/garageFixtures'
import JobPage, { dynamic } from './page'
vi.mock('@/lib/account',()=>({getAccount:vi.fn()}))
vi.mock('@/lib/garageRepository.server',()=>({getBike:vi.fn()}))
vi.mock('@/lib/maintenance/jobsRepository.server',()=>({getJob:vi.fn()}))
vi.mock('next/navigation',()=>({notFound:()=>{throw new Error('Not found')}}))
vi.mock('../../../PrivateGarage',()=>({PrivateGarage:({children}:{children:React.ReactNode})=>children}))
vi.mock('../../Checklist',()=>({Checklist:({initialJob}:{initialJob:{title:string}})=><h1>{initialJob.title}</h1>}))
const bike=bikeFixture();const job=jobFixture();const params=Promise.resolve({bikeId:bike.id,jobId:job.id})
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getAccount).mockResolvedValue({userId:'owner'} as never);vi.mocked(getBike).mockResolvedValue(bike);vi.mocked(getJob).mockResolvedValue(job)})
it('requires sign-in and uses private dynamic responses',async()=>{
 vi.mocked(getAccount).mockResolvedValue(null);render(await JobPage({params}))
 expect(screen.getByRole('link',{name:'Sign in to open this job'})).toHaveAttribute('href',`/account?next=${encodeURIComponent(`/garage/${bike.id}/jobs/${job.id}`)}`)
 expect(getJob).not.toHaveBeenCalled();expect(dynamic).toBe('force-dynamic')
})
it('shows the owned bike and its checklist',async()=>{
 render(await JobPage({params}));expect(screen.getByText(/Weekend bike/)).toBeVisible();expect(screen.getByRole('heading',{name:job.title})).toBeVisible()
 expect(getJob).toHaveBeenCalledWith(expect.objectContaining({userId:'owner'}),job.id)
})
it('hides invalid, foreign and mismatched bike/job combinations',async()=>{
 await expect(JobPage({params:Promise.resolve({bikeId:'invalid',jobId:job.id})})).rejects.toThrow('Not found')
 vi.mocked(getBike).mockResolvedValueOnce(null);await expect(JobPage({params})).rejects.toThrow('Not found')
 vi.mocked(getJob).mockResolvedValueOnce(null);await expect(JobPage({params})).rejects.toThrow('Not found')
 vi.mocked(getJob).mockResolvedValueOnce({...job,bikeId:'another-bike'});await expect(JobPage({params})).rejects.toThrow('Not found')
})
