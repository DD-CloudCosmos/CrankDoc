import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

interface FeatureHighlightProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}

export function FeatureHighlight({ icon, title, description, href }: FeatureHighlightProps) {
  return (
    <Link href={href} className="block transition-transform hover:scale-105">
      <Card className="h-full">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
