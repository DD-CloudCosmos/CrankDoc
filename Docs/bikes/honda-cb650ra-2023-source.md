# Honda CB650RA, 2023 European ABS reference

Scope: the 2023 CB650R marketing model, catalogued as CB650RA (ABS). The unrestricted European launch engine is 70 kW at 12,000 rpm and 63 N·m at 9,500 rpm. A2-restricted bikes differ. No 2024 redesign or E-Clutch data is used.

The existing searchable reference and fluid components now accept a model’s data. CB1000R retains its own sections, fluids and schedule notes. Other bikes retain their previous tables.

## Authoritative sources

Honda European owner’s manual, document 32MKYH100, 2023 model: https://www.hondamotopub.com/om/HMEE/CB650R/2023. Internal downloaded PDF has 138 pages. Public site links to Honda’s publication; it does not redistribute the PDF or rendered pages.

Schedule: printed pages 69–70 (PDF pages 73–74), including the graphical inspect/replace markers and annual-check column. Chain inspection: 94; clutch cable/free play: 95; throttle free play: 98; specifications: 131–133 (PDF pages 135–137).

Honda 23YM model press release, 25 October 2022: https://hondanews.eu/eu/en/motorcycles/media/pressreleases/418411/23ym-honda-cb650r-40. Used for rated power/torque, suspension, assist/slipper clutch and ABS disc sizes. Mechanical horsepower is calculated from 70 kW and rounded to 93.9 hp.

The owner’s manual gives 2,120 mm overall length and 203 kg European curb weight. The press sheet instead gives 2,130 mm and 202.5 kg. Display uses the manual and explicitly notes the discrepancy. Dry weight is left null. The owner’s manual gives 2.3 L oil after draining, 2.6 L with filter, 3.0 L after disassembly; these take priority over the press sheet’s generic 2.7 L entry.

## Schedule transcription

There are 30 entries: one-off first oil/filter service at 1,000 km (600 miles), 28 periodic inspection/replacement entries, and one combined pre-ride checklist. First service is not shown as recurring. Oil is 12,000 km (8,000 miles) or annually; filter replacement is 24,000 km after first service, with no annual replacement marker. Valve checks are 36,000 km. Air cleaner replacement and secondary-air/evaporative-system inspection are 24,000 km. Spark plugs are inspected at 24,000 km and replaced at 48,000 km; inspection description preserves that alternating pattern.

Coolant replacement is time-only, three years. Brake-fluid replacement is time-only, two years. Chain inspection/lubrication is every 1,000 km and pre-ride. Chain slider inspection is 12,000 km with no annual-check marker. Other inspection entries carry annual checks only where marked in the manual. Printed miles are retained rather than calculated conversions. Evaporative inspection is labelled for ED types only. Dealer-only technical entries and intermediate-work notes are retained.

Valve-clearance values, workshop torques, fork-fluid quantities and factory wiring diagrams remain unavailable. They are not inferred from another bike or model year. Clutch is cable-operated, so no clutch-fluid entry exists.

## Illustration and import

Transparent catalogue illustration is AI-generated, guided by Honda’s 2023 photograph (image 418371), with the round headlamp, four headers and conventional two-sided swingarm. It is labelled a reference illustration, not a workshop diagram. Asset: `public/images/bikes/honda-cb650ra-2023.png`, 1450 × 1085 RGBA.

`scripts/add-cb650r.ts` defaults to a read-only preview. With placeholder credentials it shows an offline empty-catalogue preview. `--apply` requires real credentials. It targets exact 2023 CB650R/CB650RA records, preserves existing populated values and primary images, fills missing known fields, and deduplicates intervals by service name. It does not run the destructive reseed. No live database writes were made during onboarding because local credentials still contain placeholders.
