# Honda CB1000R SC60 onboarding sources

The reference is for the supplied April 2008 CB1000R/CB1000RA manual. It does not decode the owner's motorcycle's model year or confirm its ABS equipment. The owner's certificate lists 77 kW; unrestricted catalogue performance is separate. No full frame number, registration details or personal photographs are published.

## Specifications and service

The unchanged uploaded manual is packaged at `public/manuals/honda-cb1000r-2008.pdf` (660 pages). SHA-256: `ecd31305e2fdaa5ab2c61dfe80a0c8b6639535e0335489ff51b0b4a7bfcb4609`. It matches the upload byte for byte.

| Data | Honda manual pages |
|---|---|
| Engine, dimensions, transmission and curb weights | 1-5 |
| Oil quantities/specification, idle, throttle free play, coolant | 1-6 |
| Valve clearances and clutch fluid | 1-7 |
| Tyres, chain, fork quantities and suspension settings | 1-9 |
| Brake fluid/discs, battery, alternator and plugs | 1-10 |
| Headlight and fuses | 1-11 |
| Selected oil/plug/sprocket torques | 1-12 |
| Complete maintenance schedule and footnotes | 3-4 (PDF page 80) |
| Spark plug handling/torque | 3-10 |
| Valve inspection below 35°C | 3-11 |
| Chain measurement conditions and holder pinch torque | 3-21 |
| Wiring, non-ABS / ABS | 22-3 / 22-4 |

The first service is explicitly labelled one-off. Other service rows repeat. Spark plug inspection and replacement are distinct; air cleaner replacement is conditional, not a made-up fixed interval. Note 4 sets coolant, brake and clutch fluid replacement to two years or the stated distance, whichever comes first. Service data is displayed as reference tables; this application does not calculate recurring reminders from these records.

The U type is Australia/New Zealand per the manual's opening type-code table. The manual's Section 16 identifies the CB1000RA anti-lock/combined brake systems. Engine valve counts and head/camshaft layout support the 16-valve, double-overhead-camshaft description.

Power and torque are cross-checked against Honda's [2020 press release](https://hondanews.eu/gb/en/motorcycles/media/pressreleases/196743/2020-honda-cb1000r-6), sections 2 and 3.2. Honda explicitly identifies the previous model as 2008–2017 and gives its 92 kW at 10,000 rpm and 99 N·m at 7,750 rpm. The search index returned this passage; direct page requests returned a gateway error during verification. The [2013 Honda press pack](https://hondanews.eu/es/es/cars/media/pressreleases/121415/cb1000rcb1000r-abs-press-pack) independently gives the same unrestricted ratings. Only these performance figures are taken from those releases, not later-model dimensions or fluid quantities. 92 kW converts to 123.4 mechanical horsepower, approximately 125 metric PS. Whole-bike dry weight remains unknown; 217/222 kg are curb weights. The 65.8 kg engine dry weight is not used as motorcycle weight.

## Photograph

`public/images/bikes/honda-cb1000r-sc60.jpg` is an unchanged photograph of an early SC60 by Addvisor, photographed 4 July 2013. It is a representative motorcycle, not a claim about model year, colour, accessories or the owner's exact bike. The original round position lamp, angular headlight, inline-four engine and single-sided swingarm match the early SC60 layout.

[Original file and author](https://commons.wikimedia.org/wiki/File:Honda_CB_1000R_P7040106_01.JPG), [CC BY-SA 3.0 licence](https://creativecommons.org/licenses/by-sa/3.0/). Original resolution: 1,984 × 1,488. SHA-1: `c414762582f62d7db089b840afbf554383095152`, matching the Commons original. Author, licence and source links are visible on the reference page and in its source notes. No mechanical elements or background were generated or altered.

## Import and limits

`npx tsx scripts/add-cb1000r.ts` previews a complete onboarding plan without database access. `--apply` imports the targeted bike, three documents, photograph and 29 service rows into existing tables. It fills missing supported specs on an exact 2008 match, preserves populated fields, and preserves an existing primary photo. It does not infer unrestricted torque for a motorcycle with a different populated power rating. It reads all supporting records before writing and skips already-present records on retry. No migrations or destructive reseed are used.

Database credentials are absent in both the isolated worktree and main checkout, so the live import remains pending. The catalogue package and standalone reference page are available locally. Diagnostic trees and full-bike clickable circuit tracing are outside this specifications/image onboarding change. Both original full-bike wiring sheets and the accepted brake-light lesson remain available.
