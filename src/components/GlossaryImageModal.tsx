'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface GlossaryImageModalProps {
  open: boolean
  onClose: () => void
  imageUrl: string
  termName: string
}

export function GlossaryImageModal({ open, onClose, imageUrl, termName }: GlossaryImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl" data-testid="glossary-image-modal">
        <DialogHeader>
          <DialogTitle>{termName}</DialogTitle>
          <DialogDescription>Technical illustration</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center" style={{ touchAction: 'pinch-zoom' }}>
          <img
            src={imageUrl}
            alt={termName}
            className="w-full h-auto max-h-[85vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
