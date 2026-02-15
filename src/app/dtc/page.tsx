import { DtcCodeList } from '@/components/DtcCodeList'

export default function DtcPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">DTC Lookup</h1>
        <p className="text-muted-foreground">
          Search Diagnostic Trouble Codes by code number or description
        </p>
      </div>

      <DtcCodeList />
    </div>
  )
}
