import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getAccount } from '@/lib/account'
import { getBike } from '@/lib/garageRepository.server'
import { listTemplates } from '@/lib/maintenance/templates'
import { bikeFixture, templateFixture } from '@/test/garageFixtures'
import Page from './page'
vi.mock('@/lib/account',()=>({getAccount:vi.fn()}))
vi.mock('@/lib/garageRepository.server',()=>({getBike:vi.fn()}))
vi.mock('@/lib/maintenance/templates',()=>({listTemplates:vi.fn()}))
vi.mock('next/navigation',()=>({notFound:()=>{throw new Error('Not found')}}))
vi.mock('../../../../PrivateGarage',()=>({PrivateGarage:({children}:{children:React.ReactNode})=>children}))
const bike=bikeFixture(),template=templateFixture({kind:'custom'}),params=Promise.resolve({bikeId:bike.id,templateId:template.id})
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getAccount).mockResolvedValue({userId:'owner'} as never);vi.mocked(getBike).mockResolvedValue(bike);vi.mocked(listTemplates).mockResolvedValue([template])})
it('renders only eligible owner templates with blank fields',async()=>{render(await Page({params}));expect(screen.getByText(/Base-template preview/)).toBeVisible();expect(screen.getByLabelText('Blank date')).toBeVisible();expect(listTemplates).toHaveBeenCalledWith(expect.objectContaining({userId:'owner'}),bike)})
it('denies anonymous, foreign and unsupported templates',async()=>{vi.mocked(getAccount).mockResolvedValueOnce(null);render(await Page({params}));expect(listTemplates).not.toHaveBeenCalled();vi.mocked(getBike).mockResolvedValueOnce(null);await expect(Page({params})).rejects.toThrow('Not found');vi.mocked(listTemplates).mockResolvedValueOnce([]);await expect(Page({params})).rejects.toThrow('Not found');vi.mocked(listTemplates).mockResolvedValueOnce([{...template,kind:'scheduled',motorcycleId:'foreign',years:[2023]}]);await expect(Page({params})).rejects.toThrow('Not found')})
