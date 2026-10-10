import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { jobFixture, taskFixture } from '@/test/garageFixtures'
import { MaintenanceRecord } from './MaintenanceRecord'
it('renders optional record and task details as text, including a zero cost',()=>{
 render(<MaintenanceRecord job={jobFixture({status:'partial',notes:'<b>Private notes</b>',parts:'Filter',performer:'Owner',costMinor:0,currency:'EUR',tasks:[taskFixture({state:'skipped',reason:'Part unavailable',notes:'<img src=x>'})]})} />)
 for(const text of ['Partial','<b>Private notes</b>','Parts: Filter','Performed by: Owner','Cost: EUR 0.00','Part unavailable','<img src=x>']) expect(screen.getByText(text)).toBeInTheDocument()
 expect(document.querySelector('img')).toBeNull()
})
it('shows no invented cost when the cost is unknown',()=>{
 render(<MaintenanceRecord job={jobFixture({status:'completed'})} />);expect(screen.getByText('Completed')).toBeInTheDocument();expect(screen.queryByText(/Cost:/)).not.toBeInTheDocument()
})
it('displays every minor unit in a large valid cost',()=>{
 render(<MaintenanceRecord job={jobFixture({costMinor:Number.MAX_SAFE_INTEGER-1,currency:'USD'})} />);expect(screen.getByText('Cost: USD 90071992547409.90')).toBeInTheDocument()
})
