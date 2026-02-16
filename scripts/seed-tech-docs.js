#!/usr/bin/env node

const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const { data: motos } = await supabase
    .from('motorcycles')
    .select('id, make, model, generation')

  function find(make, model, gen) {
    const m = motos.find(function (m) {
      if (m.make !== make || m.model !== model) return false
      if (gen) return m.generation === gen
      return true
    })
    return m ? m.id : null
  }

  const docs = [
    { motorcycle_id: find('Honda', 'CBR600RR', 'Gen 1 (2003-2004)'), title: 'CBR600RR Wiring Diagram', doc_type: 'wiring_diagram', description: 'Complete electrical wiring diagram. Covers ignition, charging, lighting, and ECU circuits.', file_url: '/docs/placeholder-wiring-cbr600rr.pdf', file_type: 'application/pdf', source_attribution: 'Honda Service Manual' },
    { motorcycle_id: find('Honda', 'CBR600RR', 'Gen 1 (2003-2004)'), title: 'CBR600RR Torque Specifications', doc_type: 'torque_chart', description: 'Engine, chassis, and suspension torque values for all major fasteners.', file_url: '/docs/placeholder-torque-cbr600rr.pdf', file_type: 'application/pdf', source_attribution: 'Honda Service Manual' },
    { motorcycle_id: find('Yamaha', 'MT-07'), title: 'MT-07 Wiring Diagram', doc_type: 'wiring_diagram', description: 'Full electrical schematic including EFI, instrument cluster, and lighting circuits.', file_url: '/docs/placeholder-wiring-mt07.pdf', file_type: 'application/pdf', source_attribution: 'Yamaha Service Manual' },
    { motorcycle_id: find('Yamaha', 'MT-07'), title: 'MT-07 Fluid Capacities', doc_type: 'fluid_chart', description: 'Engine oil, brake fluid, and fork oil specifications and capacities.', file_url: '/docs/placeholder-fluids-mt07.pdf', file_type: 'application/pdf', source_attribution: 'Yamaha Service Manual' },
    { motorcycle_id: find('Harley-Davidson', 'Sportster 883', 'EFI (2007-2022)'), title: 'Sportster 883 Wiring Diagram', doc_type: 'wiring_diagram', description: 'Electrical system schematic for EFI Sportster models.', file_url: '/docs/placeholder-wiring-sportster883.pdf', file_type: 'application/pdf', source_attribution: 'Harley-Davidson Service Manual' },
    { motorcycle_id: find('Harley-Davidson', 'Sportster 1200', 'EFI (2007-2022)'), title: 'Sportster 1200 Torque Specifications', doc_type: 'torque_chart', description: 'Engine, primary, and transmission torque values.', file_url: '/docs/placeholder-torque-sportster1200.pdf', file_type: 'application/pdf', source_attribution: 'Harley-Davidson Service Manual' },
    { motorcycle_id: find('Kawasaki', 'Ninja 400'), title: 'Ninja 400 Wiring Diagram', doc_type: 'wiring_diagram', description: 'Complete wiring diagram covering EFI, ABS, instrument cluster, and lighting.', file_url: '/docs/placeholder-wiring-ninja400.pdf', file_type: 'application/pdf', source_attribution: 'Kawasaki Service Manual' },
    { motorcycle_id: find('Kawasaki', 'Ninja 400'), title: 'Ninja 400 Torque Specifications', doc_type: 'torque_chart', description: 'All fastener torque values for engine, frame, and suspension.', file_url: '/docs/placeholder-torque-ninja400.pdf', file_type: 'application/pdf', source_attribution: 'Kawasaki Service Manual' },
    { motorcycle_id: find('BMW', 'R1250GS'), title: 'R1250GS Wiring Diagram', doc_type: 'wiring_diagram', description: 'Comprehensive electrical schematic including CAN bus, ShiftCam, and rider aids.', file_url: '/docs/placeholder-wiring-r1250gs.pdf', file_type: 'application/pdf', source_attribution: 'BMW Service Manual' },
    { motorcycle_id: find('BMW', 'R1250GS'), title: 'R1250GS Fluid Capacities', doc_type: 'fluid_chart', description: 'Engine oil, final drive oil, coolant, and brake fluid specifications.', file_url: '/docs/placeholder-fluids-r1250gs.pdf', file_type: 'application/pdf', source_attribution: 'BMW Service Manual' },
    // Kymco Agility 125
    { motorcycle_id: find('Kymco', 'Agility 125'), title: 'Agility 125 Torque Specifications', doc_type: 'torque_chart', description: 'Torque values for all critical fasteners.', file_url: '/docs/placeholder-torque-kymco-agility125.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'Agility 125'), title: 'Agility 125 Fluid Capacities', doc_type: 'fluid_chart', description: 'Engine oil, gear oil, and brake fluid specifications.', file_url: '/docs/placeholder-fluids-kymco-agility125.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'Agility 125'), title: 'Agility 125 Wiring Diagram', doc_type: 'wiring_diagram', description: 'Electrical system overview including CDI, charging, and lighting circuits.', file_url: '/docs/placeholder-wiring-kymco-agility125.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    // Kymco Like 125i
    { motorcycle_id: find('Kymco', 'Like 125i'), title: 'Like 125i Torque Specifications', doc_type: 'torque_chart', description: 'Torque values for all critical fasteners.', file_url: '/docs/placeholder-torque-kymco-like125i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'Like 125i'), title: 'Like 125i Fluid Capacities', doc_type: 'fluid_chart', description: 'Engine oil, gear oil, and brake fluid specifications.', file_url: '/docs/placeholder-fluids-kymco-like125i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'Like 125i'), title: 'Like 125i Wiring Diagram', doc_type: 'wiring_diagram', description: 'Electrical system overview including EFI, charging, and lighting circuits.', file_url: '/docs/placeholder-wiring-kymco-like125i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    // Kymco People S 125i
    { motorcycle_id: find('Kymco', 'People S 125i'), title: 'People S 125i Torque Specifications', doc_type: 'torque_chart', description: 'Torque values for all critical fasteners.', file_url: '/docs/placeholder-torque-kymco-peoples125i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'People S 125i'), title: 'People S 125i Fluid Capacities', doc_type: 'fluid_chart', description: 'Engine oil, gear oil, and brake fluid specifications.', file_url: '/docs/placeholder-fluids-kymco-peoples125i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'People S 125i'), title: 'People S 125i Wiring Diagram', doc_type: 'wiring_diagram', description: 'Electrical system overview including EFI, charging, and lighting circuits.', file_url: '/docs/placeholder-wiring-kymco-peoples125i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    // Kymco Downtown 125i
    { motorcycle_id: find('Kymco', 'Downtown 125i'), title: 'Downtown 125i Torque Specifications', doc_type: 'torque_chart', description: 'Torque values for all critical fasteners including coolant drain.', file_url: '/docs/placeholder-torque-kymco-downtown125i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'Downtown 125i'), title: 'Downtown 125i Fluid Capacities', doc_type: 'fluid_chart', description: 'Engine oil, gear oil, coolant, and brake fluid specifications.', file_url: '/docs/placeholder-fluids-kymco-downtown125i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'Downtown 125i'), title: 'Downtown 125i Wiring Diagram', doc_type: 'wiring_diagram', description: 'Electrical system overview including EFI, charging, and lighting circuits.', file_url: '/docs/placeholder-wiring-kymco-downtown125i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    // Kymco Downtown 300i
    { motorcycle_id: find('Kymco', 'Downtown 300i'), title: 'Downtown 300i Torque Specifications', doc_type: 'torque_chart', description: 'Torque values for all critical fasteners including coolant drain.', file_url: '/docs/placeholder-torque-kymco-downtown300i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'Downtown 300i'), title: 'Downtown 300i Fluid Capacities', doc_type: 'fluid_chart', description: 'Engine oil, gear oil, coolant, and brake fluid specifications.', file_url: '/docs/placeholder-fluids-kymco-downtown300i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'Downtown 300i'), title: 'Downtown 300i Wiring Diagram', doc_type: 'wiring_diagram', description: 'Electrical system overview including EFI, charging, and lighting circuits.', file_url: '/docs/placeholder-wiring-kymco-downtown300i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    // Kymco X-Town 300i
    { motorcycle_id: find('Kymco', 'X-Town 300i'), title: 'X-Town 300i Torque Specifications', doc_type: 'torque_chart', description: 'Torque values for all critical fasteners including coolant drain.', file_url: '/docs/placeholder-torque-kymco-xtown300i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'X-Town 300i'), title: 'X-Town 300i Fluid Capacities', doc_type: 'fluid_chart', description: 'Engine oil, gear oil, coolant, and brake fluid specifications.', file_url: '/docs/placeholder-fluids-kymco-xtown300i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'X-Town 300i'), title: 'X-Town 300i Wiring Diagram', doc_type: 'wiring_diagram', description: 'Electrical system overview including EFI, charging, and lighting circuits.', file_url: '/docs/placeholder-wiring-kymco-xtown300i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    // Kymco AK 550i
    { motorcycle_id: find('Kymco', 'AK 550i'), title: 'AK 550i Torque Specifications', doc_type: 'torque_chart', description: 'Torque values for all critical fasteners including coolant drain.', file_url: '/docs/placeholder-torque-kymco-ak550i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'AK 550i'), title: 'AK 550i Fluid Capacities', doc_type: 'fluid_chart', description: 'Engine oil, gear oil, coolant, and brake fluid specifications.', file_url: '/docs/placeholder-fluids-kymco-ak550i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
    { motorcycle_id: find('Kymco', 'AK 550i'), title: 'AK 550i Wiring Diagram', doc_type: 'wiring_diagram', description: 'Electrical system overview including dual-cylinder EFI, charging, and lighting.', file_url: '/docs/placeholder-wiring-kymco-ak550i.pdf', file_type: 'application/pdf', source_attribution: 'Kymco Service Manual' },
  ]

  const { error } = await supabase.from('technical_documents').insert(docs)
  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
  console.log('Inserted ' + docs.length + ' technical documents')

  const { count } = await supabase
    .from('technical_documents')
    .select('*', { count: 'exact', head: true })
  console.log('Total technical documents:', count)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
