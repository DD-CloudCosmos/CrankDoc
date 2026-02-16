import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Recall } from '@/types/database.types'

interface RecallCardProps {
  recall: Recall
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function RecallCard({ recall }: RecallCardProps) {
  const hasParkBadges = recall.park_it || recall.park_outside

  return (
    <Card data-testid="recall-card">
      <CardHeader className="pb-2">
        {hasParkBadges && (
          <div className="mb-2 flex items-center gap-2">
            {recall.park_it && (
              <Badge className="bg-red-600 text-white hover:bg-red-600/80">
                PARK IT
              </Badge>
            )}
            {recall.park_outside && (
              <Badge className="bg-amber-600 text-white hover:bg-amber-600/80">
                PARK OUTSIDE
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {recall.nhtsa_campaign_number}
          </span>
          {recall.report_received_date && (
            <span className="text-xs text-muted-foreground">
              {formatDate(recall.report_received_date)}
            </span>
          )}
        </div>

        {recall.component && (
          <CardTitle className="text-base">{recall.component}</CardTitle>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {recall.summary && (
          <p className="text-sm text-zinc-300">{recall.summary}</p>
        )}

        {recall.consequence && (
          <div>
            <p className="text-sm font-medium text-amber-400">Consequence</p>
            <p className="text-sm text-zinc-300">{recall.consequence}</p>
          </div>
        )}

        {recall.remedy && (
          <div>
            <p className="text-sm font-medium text-green-400">Remedy</p>
            <p className="text-sm text-zinc-300">{recall.remedy}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
