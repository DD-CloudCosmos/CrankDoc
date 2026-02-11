import { createServerClient } from '@/lib/supabase/server'
import { DtcCodeList } from '@/components/DtcCodeList'
import type { DtcCode } from '@/types/database.types'

async function getDtcCodes(): Promise<{ data: DtcCode[] | null; error: string | null }> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('dtc_codes')
    .select('*')
    .order('code')

  if (error) {
    console.error('Error fetching DTC codes:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export default async function DtcPage() {
  const { data: codes, error } = await getDtcCodes()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">DTC Lookup</h1>
        <p className="text-muted-foreground">
          Search Diagnostic Trouble Codes by code number or description
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-8 text-center">
          <p className="text-red-400">Error loading DTC codes</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Failed to fetch DTC codes from database. Please try again later.
          </p>
        </div>
      )}

      {!error && codes && (
        <DtcCodeList codes={codes} />
      )}
    </div>
  )
}
