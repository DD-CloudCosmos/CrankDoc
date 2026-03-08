import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BackButtonProps {
  href: string
  label: string
}

export function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="sm" className="mb-4">
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  )
}
