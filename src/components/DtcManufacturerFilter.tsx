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
]

export function DtcManufacturerFilter({ activeManufacturer, onChange }: DtcManufacturerFilterProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase text-muted-foreground">Manufacturer</p>
      <div className="flex flex-wrap gap-2">
        {MANUFACTURERS.map((mfr) => (
          <Button
            key={mfr.value}
            variant={activeManufacturer === mfr.value ? 'default' : 'outline'}
            size="sm"
            className={activeManufacturer === mfr.value ? 'rounded-[999px] bg-[#1F1F1F] text-white' : 'rounded-[999px] bg-background text-foreground'}
            onClick={() => onChange(mfr.value)}
          >
            {mfr.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
