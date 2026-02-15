'use client'

import { useState } from 'react'
import { SpecSheet } from '@/components/SpecSheet'
import { ServiceIntervalTable } from '@/components/ServiceIntervalTable'
import type { TechnicalDocument, ServiceInterval, Motorcycle } from '@/types/database.types'

interface BikeDetailTabsProps {
  motorcycle: Motorcycle
  documents: TechnicalDocument[]
  serviceIntervals: ServiceInterval[]
}

type TabId = 'specs' | 'service' | 'fluids' | 'wiring'

interface TabDef {
  id: TabId
  label: string
}

function getWiringDocs(documents: TechnicalDocument[]) {
  return documents.filter((d) => d.doc_type === 'wiring_diagram')
}

interface FluidItem {
  label: string
  capacity: string | null
  spec: string | null
}

function getFluidItems(
  motorcycle: Motorcycle,
  serviceIntervals: ServiceInterval[]
): FluidItem[] {
  const items: FluidItem[] = []

  if (motorcycle.oil_capacity_liters) {
    const oilSpec = serviceIntervals.find(
      (i) => i.fluid_spec && i.service_name.toLowerCase().includes('oil')
    )
    items.push({
      label: 'Engine Oil',
      capacity: `${motorcycle.oil_capacity_liters} L`,
      spec: oilSpec?.fluid_spec ?? null,
    })
  }

  if (motorcycle.coolant_capacity_liters) {
    items.push({
      label: 'Coolant',
      capacity: `${motorcycle.coolant_capacity_liters} L`,
      spec: null,
    })
  }

  if (motorcycle.fuel_capacity_liters) {
    items.push({
      label: 'Fuel Tank',
      capacity: `${motorcycle.fuel_capacity_liters} L`,
      spec: null,
    })
  }

  const brakeFluid = serviceIntervals.find(
    (i) => i.fluid_spec && i.service_name.toLowerCase().includes('brake')
  )
  if (brakeFluid) {
    items.push({
      label: 'Brake Fluid',
      capacity: null,
      spec: brakeFluid.fluid_spec,
    })
  }

  const forkOil = serviceIntervals.find(
    (i) => i.fluid_spec && i.service_name.toLowerCase().includes('fork')
  )
  if (forkOil) {
    items.push({
      label: 'Fork Oil',
      capacity: null,
      spec: forkOil.fluid_spec,
    })
  }

  return items
}

export function BikeDetailTabs({
  motorcycle,
  documents,
  serviceIntervals,
}: BikeDetailTabsProps) {
  const wiringDocs = getWiringDocs(documents)
  const fluidItems = getFluidItems(motorcycle, serviceIntervals)

  // Specs tab is always shown
  const tabs: TabDef[] = [{ id: 'specs', label: 'Specs' }]
  if (serviceIntervals.length > 0) tabs.push({ id: 'service', label: 'Service' })
  if (fluidItems.length > 0) tabs.push({ id: 'fluids', label: 'Fluids' })
  if (wiringDocs.length > 0) tabs.push({ id: 'wiring', label: 'Wiring' })

  const [activeTab, setActiveTab] = useState<TabId>('specs')
  const [lightboxDoc, setLightboxDoc] = useState<TechnicalDocument | null>(null)

  const showTabBar = tabs.length > 1
  const displayTab = tabs.find((t) => t.id === activeTab) ? activeTab : tabs[0].id

  return (
    <>
      {/* Tab bar */}
      {showTabBar && (
        <div className="mb-4 flex gap-2 border-b border-border" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={displayTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                displayTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {displayTab === 'specs' && <SpecSheet motorcycle={motorcycle} />}
      {displayTab === 'service' && <ServiceIntervalTable intervals={serviceIntervals} />}
      {displayTab === 'fluids' && <FluidsContent items={fluidItems} />}
      {displayTab === 'wiring' && (
        <WiringContent
          docs={wiringDocs}
          onOpenLightbox={setLightboxDoc}
        />
      )}

      {/* Lightbox overlay */}
      {lightboxDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxDoc(null)}
          role="dialog"
          aria-label={`Viewing ${lightboxDoc.title}`}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxDoc(null)}
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

// --- Wiring Tab ---

function WiringContent({
  docs,
  onOpenLightbox,
}: {
  docs: TechnicalDocument[]
  onOpenLightbox: (doc: TechnicalDocument) => void
}) {
  return (
    <div className="space-y-4">
      {docs.map((doc) => (
        <div key={doc.id}>
          <button
            className="w-full cursor-pointer overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90"
            onClick={() => onOpenLightbox(doc)}
            aria-label={`View ${doc.title} full size`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.file_url}
              alt={doc.title}
              className="w-full"
            />
          </button>
          {doc.source_attribution && (
            <p className="mt-1 text-xs text-muted-foreground">
              Source: {doc.source_attribution}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// --- Fluids Tab ---

function FluidsContent({ items }: { items: FluidItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="fluids-table">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-semibold">Fluid</th>
            <th className="px-4 py-3 text-left font-semibold">Capacity</th>
            <th className="px-4 py-3 text-left font-semibold">Specification</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.label} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3 font-medium">{item.label}</td>
              <td className="px-4 py-3">{item.capacity ?? '—'}</td>
              <td className="px-4 py-3">{item.spec ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
