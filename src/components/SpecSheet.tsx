import React from 'react'
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table'
import type { Motorcycle } from '@/types/database.types'

interface SpecSheetProps {
  motorcycle: Motorcycle
}

interface SpecRow {
  label: string
  value: string
}

interface SpecSection {
  title: string
  rows: SpecRow[]
}

function _formatSpec(value: number | string | null, unit: string): string | null {
  if (value === null) return null
  if (typeof value === 'string') return value
  return `${value}${unit}`
}

function buildSections(motorcycle: Motorcycle): SpecSection[] {
  const sections: SpecSection[] = []

  // Engine section
  const engineRows: SpecRow[] = []
  if (motorcycle.engine_type) engineRows.push({ label: 'Engine Type', value: motorcycle.engine_type })
  if (motorcycle.displacement_cc !== null) engineRows.push({ label: 'Displacement', value: `${motorcycle.displacement_cc}cc` })
  if (motorcycle.fuel_system) engineRows.push({ label: 'Fuel System', value: motorcycle.fuel_system })
  if (motorcycle.horsepower !== null) engineRows.push({ label: 'Horsepower', value: `${motorcycle.horsepower} hp` })
  if (motorcycle.torque_nm !== null) engineRows.push({ label: 'Torque', value: `${motorcycle.torque_nm} Nm` })
  if (engineRows.length > 0) sections.push({ title: 'Engine', rows: engineRows })

  // Maintenance section
  const maintenanceRows: SpecRow[] = []
  if (motorcycle.valve_clearance_intake) maintenanceRows.push({ label: 'Valve Clearance (Intake)', value: motorcycle.valve_clearance_intake })
  if (motorcycle.valve_clearance_exhaust) maintenanceRows.push({ label: 'Valve Clearance (Exhaust)', value: motorcycle.valve_clearance_exhaust })
  if (motorcycle.spark_plug) maintenanceRows.push({ label: 'Spark Plug', value: motorcycle.spark_plug })
  if (maintenanceRows.length > 0) sections.push({ title: 'Maintenance', rows: maintenanceRows })

  // Chassis section
  const chassisRows: SpecRow[] = []
  if (motorcycle.dry_weight_kg !== null) chassisRows.push({ label: 'Dry Weight', value: `${motorcycle.dry_weight_kg} kg` })
  if (motorcycle.tire_front) chassisRows.push({ label: 'Front Tire', value: motorcycle.tire_front })
  if (motorcycle.tire_rear) chassisRows.push({ label: 'Rear Tire', value: motorcycle.tire_rear })
  if (chassisRows.length > 0) sections.push({ title: 'Chassis', rows: chassisRows })

  return sections
}

export function SpecSheet({ motorcycle }: SpecSheetProps) {
  const sections = buildSections(motorcycle)

  if (sections.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No specifications available for this motorcycle.
      </p>
    )
  }

  return (
    <Table>
      <TableBody>
        {sections.map((section) => (
          <React.Fragment key={section.title}>
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={2}
                className="pt-4 pb-2 text-sm font-semibold text-foreground first:pt-0"
              >
                {section.title}
              </TableCell>
            </TableRow>
            {section.rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="text-muted-foreground">{row.label}</TableCell>
                <TableCell className="text-right font-medium text-foreground">{row.value}</TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  )
}
