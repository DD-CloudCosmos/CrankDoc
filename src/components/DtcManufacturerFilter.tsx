'use client'

import { Button } from '@/components/ui/button'

interface DtcManufacturerFilterProps {
  activeManufacturer: string
  onChange: (manufacturer: string) => void
}

const MANUFACTURERS = [
  { label: 'All', value: '' },
  { label: 'Harley-Davidson', value: 'Harley-Davidson' },
  { label: 'BMW', value: 'BMW' },
  { label: 'Honda', value: 'Honda' },
  { label: 'Yamaha', value: 'Yamaha' },
  { label: 'Kawasaki', value: 'Kawasaki' },
  { label: 'Suzuki', value: 'Suzuki' },
  { label: 'Ducati', value: 'Ducati' },
  { label: 'KTM', value: 'KTM' },
  { label: 'Triumph', value: 'Triumph' },
  { label: 'Indian/Polaris', value: 'Indian/Polaris' },
  { label: 'KYMCO', value: 'Kymco' },
]

export function DtcManufacturerFilter({ activeManufacturer, onChange }: DtcManufacturerFilterProps) {
  return (
    <div role="group" aria-label="Manufacturer">
      <p className="mb-1.5 text-[13px] uppercase text-muted-foreground">Manufacturer</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {MANUFACTURERS.map((mfr) => (
          <Button
            key={mfr.value}
            variant={activeManufacturer === mfr.value ? 'pill-active' : 'pill'}
            size="sm"
            className="shrink-0"
            aria-pressed={activeManufacturer === mfr.value}
            onClick={() => onChange(mfr.value)}
          >
            {mfr.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
