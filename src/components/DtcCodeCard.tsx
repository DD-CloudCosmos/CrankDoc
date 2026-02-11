import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DtcCode } from '@/types/database.types'

interface DtcCodeCardProps {
  dtcCode: DtcCode
}

export function DtcCodeCard({ dtcCode }: DtcCodeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-mono text-lg">{dtcCode.code}</CardTitle>
          {dtcCode.category && (
            <Badge variant="outline">{dtcCode.category}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{dtcCode.description}</p>
      </CardHeader>
      {dtcCode.common_causes && dtcCode.common_causes.length > 0 && (
        <CardContent>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Common Causes
          </p>
          <ul className="space-y-1">
            {dtcCode.common_causes.map((cause) => (
              <li key={cause} className="text-sm text-zinc-300">
                {cause}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
