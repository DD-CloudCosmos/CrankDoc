'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TechnicalDocument } from '@/types/database.types'

interface TechnicalDocViewerProps {
  documents: TechnicalDocument[]
}

const DOC_TYPE_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  wiring_diagram: { label: 'Wiring', variant: 'default' },
  torque_chart: { label: 'Torque', variant: 'secondary' },
  fluid_chart: { label: 'Fluids', variant: 'outline' },
  exploded_view: { label: 'Diagram', variant: 'secondary' },
  reference: { label: 'Reference', variant: 'outline' },
}

function getDocTypeConfig(docType: string) {
  return DOC_TYPE_CONFIG[docType] || { label: docType, variant: 'outline' as const }
}

function isImageType(fileType: string) {
  return fileType.startsWith('image/')
}

function isPdfType(fileType: string) {
  return fileType === 'application/pdf'
}

export function TechnicalDocViewer({ documents }: TechnicalDocViewerProps) {
  const [lightboxDoc, setLightboxDoc] = useState<TechnicalDocument | null>(null)

  if (documents.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No technical documents available for this motorcycle.
      </p>
    )
  }

  function handleDocClick(doc: TechnicalDocument) {
    if (isImageType(doc.file_type)) {
      setLightboxDoc(doc)
    } else {
      window.open(doc.file_url, '_blank', 'noopener,noreferrer')
    }
  }

  function closeLightbox() {
    setLightboxDoc(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => {
          const config = getDocTypeConfig(doc.doc_type)
          return (
            <Card
              key={doc.id}
              className="cursor-pointer transition-transform duration-200 hover:-translate-y-1"
              onClick={() => handleDocClick(doc)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleDocClick(doc)
                }
              }}
            >
              {isImageType(doc.file_type) && (
                <div className="aspect-[4/3] w-full overflow-hidden rounded-t-[24px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doc.file_url}
                    alt={doc.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {doc.description && (
                  <p className="mb-2 text-sm text-muted-foreground">{doc.description}</p>
                )}
                {doc.source_attribution && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    Source: {doc.source_attribution}
                  </p>
                )}
                {isPdfType(doc.file_type) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      const link = document.createElement('a')
                      link.href = doc.file_url
                      link.download = doc.title
                      link.rel = 'noopener noreferrer'
                      link.click()
                    }}
                  >
                    Download PDF
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Lightbox overlay */}
      {lightboxDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-label={`Viewing ${lightboxDoc.title}`}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeLightbox}
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-gray-200"
              aria-label="Close"
            >
              X
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxDoc.file_url}
              alt={lightboxDoc.title}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
            {lightboxDoc.source_attribution && (
              <p className="mt-2 text-center text-sm text-white/70">
                Source: {lightboxDoc.source_attribution}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
