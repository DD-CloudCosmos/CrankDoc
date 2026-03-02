'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { SmartSearch } from './SmartSearch'

interface BikeAskAIProps {
  motorcycleId: string
  make: string
  model: string
}

export function BikeAskAI({ motorcycleId, make, model }: BikeAskAIProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Ask AI about this bike
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Ask about {make} {model}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ask AI-powered questions about {make} {model}
          </DialogDescription>
        </DialogHeader>
        <SmartSearch motorcycleId={motorcycleId} make={make} model={model} />
      </DialogContent>
    </Dialog>
  )
}
