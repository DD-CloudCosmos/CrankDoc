'use client'

import { useState } from 'react'
import { SpecSheet } from '@/components/SpecSheet'
import { ServiceIntervalTable } from '@/components/ServiceIntervalTable'
import { RecallCard } from '@/components/RecallCard'
import type { TechnicalDocument, ServiceInterval, Motorcycle, Recall } from '@/types/database.types'

interface BikeDetailTabsProps {
  motorcycle: Motorcycle
  documents: TechnicalDocument[]
  serviceIntervals: ServiceInterval[]
  recalls?: Recall[]
}

type TabId = 'specs' | 'service' | 'fluids' | 'wiring' | 'recalls'

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

/**
 * Deduplicate recalls by campaign number (one campaign can span multiple years).
 * Sort by date descending, with park-it recalls pinned to top.
 */
function getDeduplicatedRecalls(recalls: Recall[]): Recall[] {
  const seen = new Set<string>()
  const unique: Recall[] = []

  for (const recall of recalls) {
    if (!seen.has(recall.nhtsa_campaign_number)) {
      seen.add(recall.nhtsa_campaign_number)
      unique.push(recall)
    }
  }

  // Sort: park_it first, then by date descending
  return unique.sort((a, b) => {
    if (a.park_it && !b.park_it) return -1
    if (!a.park_it && b.park_it) return 1
    const dateA = a.report_received_date || ''
    const dateB = b.report_received_date || ''
    return dateB.localeCompare(dateA)
  })
}

export function BikeDetailTabs({
  motorcycle,
  documents,
  serviceIntervals,
  recalls = [],
}: BikeDetailTabsProps) {
  const wiringDocs = getWiringDocs(documents)
  const fluidItems = getFluidItems(motorcycle, serviceIntervals)
  const deduplicatedRecalls = getDeduplicatedRecalls(recalls)

  // Specs tab is always shown
  const tabs: TabDef[] = [{ id: 'specs', label: 'Specs' }]
  if (serviceIntervals.length > 0) tabs.push({ id: 'service', label: 'Service' })
  if (fluidItems.length > 0) tabs.push({ id: 'fluids', label: 'Fluids' })
  if (wiringDocs.length > 0) tabs.push({ id: 'wiring', label: 'Wiring' })
  if (deduplicatedRecalls.length > 0) tabs.push({ id: 'recalls', label: `Recalls (${deduplicatedRecalls.length})` })

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
      {displayTab === 'recalls' && (
        <RecallsContent recalls={deduplicatedRecalls} />
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

// --- Recalls Tab ---

function RecallsContent({ recalls }: { recalls: Recall[] }) {
  const hasParkIt = recalls.some((r) => r.park_it)

  return (
    <div className="space-y-4">
      {hasParkIt && (
        <div className="rounded-lg border border-red-500/50 bg-red-950/30 p-4">
          <p className="text-sm font-semibold text-red-400">
            One or more recalls advise you to stop driving this vehicle immediately.
            Contact your dealer for a free repair.
          </p>
        </div>
      )}
      {recalls.map((recall) => (
        <RecallCard key={recall.id} recall={recall} />
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
