# Motorcycle data sources for a mechanic troubleshooting app

**The most important finding: a fully free, structured motorcycle troubleshooting knowledge base does not yet exist — but an effective one can be assembled from roughly a dozen open sources.** The NHTSA suite of free APIs (VIN decoding, recalls, complaints) forms the strongest foundation, supplemented by community Q&A data from StackExchange (CC-BY-SA 4.0) and Reddit's r/Fixxit, specification datasets from Kaggle and API Ninjas, and free service manual archives. No single source covers everything a junior mechanic needs, but the combination below provides global coverage across specs, diagnostics, and repair knowledge — mostly at zero cost.

---

## Motorcycle specification databases and APIs

Structured spec data is the most accessible category, with several viable options ranging from fully free to freemium.

**NHTSA vPIC API** is the top free option for vehicle identification. It decodes VINs into **130+ attributes** including make, model, year, engine displacement, fuel type, motorcycle chassis type, and suspension type. The REST API at `https://vpic.nhtsa.dot.gov/api/` requires no authentication, returns JSON/XML/CSV, and covers all US-market vehicles from 1981 onward. A standalone downloadable database (SQL Server and PostgreSQL) enables offline VIN decoding. The Python wrapper `vpic-api` on PyPI simplifies integration. Limitations: no performance data (torque curves, top speed) and US-market only.

**API Ninjas Motorcycles API** (`https://api-ninjas.com/api/motorcycles`) offers the richest free spec data — **30+ fields per model** including displacement, horsepower, torque, compression ratio, bore/stroke, fuel system, and weight across tens of thousands of models. The free tier returns up to 30 results per query in JSON but lacks pagination and is restricted to non-commercial use. Paid plans start at $39/month. For prototyping a troubleshooting app, this is the fastest path to comprehensive specs.

**Motorcycle Specs Database on RapidAPI** (`https://rapidapi.com/makingdatameaningful/api/motorcycle-specs-database`) covers **40,000+ models from 1900 to present** with 20+ technical fields and one image per model. It offers endpoints for searching by year, make, model, and category. The freemium tier on RapidAPI provides limited monthly calls (typically 500–1,000). The same provider offers the data on Apify for scraping workflows.

**Kaggle's Motorcycle Technical Specifications Dataset (1970–2022)** at `https://www.kaggle.com/datasets/emmanuelfwerr/motorcycle-technical-specifications-19702022` is the best bulk download option — a free CSV covering engine specs, dimensions, and performance data across decades. It's static (not live-updated) but ideal for seeding an app database. Additional Kaggle datasets cover 2023 models and India-market bikes specifically.

For a downloadable relational database, **Car2DB** (`https://moto.car2db.com/`) provides motorcycle specs since 1879 in MySQL and CSV formats with an API and PHP SDK, though only a 2-brand demo is free. The **Teoalida/Bikez database** is the most comprehensive static dataset available: **42,565 models across 607 brands with 88 columns** of specifications (displacement completion: 96.7%, engine details: 99.9%, power: 61%, torque: 52%). It's commercial but offers a free sample.

Several GitHub repositories provide lightweight open alternatives:
- **arthurkao/vehicle-make-model-data** — 19,722+ models in MySQL/JSON/CSV (year/make/model only, no specs)
- **uxigene/Cars-Motorcycles-DataBase-JSON** — Brand and model listings in JSON (20 stars)
- **ejcenteno/motorcycle-data-repo** — JSON collection with specs (small-scale, 1 star)

The **UK DVLA Vehicle Enquiry API** (`https://developer-portal.driver-vehicle-licensing.api.gov.uk/`) returns make, engine capacity, fuel type, and tax/MOT status for any UK registration number — free with API key registration under the Open Government Licence.

---

## Troubleshooting and repair knowledge bases

This is where the biggest gap exists. No open, structured diagnostic decision-tree database for motorcycles is publicly available — creating one would be a genuine contribution to the field.

**NHTSA's Complaints, Recalls, and TSB APIs** represent the single most valuable free structured source for identifying common failure modes. The complaints endpoint (`https://api.nhtsa.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}`) returns consumer-reported defect descriptions searchable by make/model/year. The recalls endpoint provides detailed defect descriptions, affected models, and remedies. Full flat-file downloads in CSV are available at `https://static.nhtsa.gov/odi/ffdd/`. All endpoints are free, require no authentication, and return JSON. Coverage spans decades of motorcycle brands including Honda, Harley-Davidson, BMW, Kawasaki, KTM, Ducati, Suzuki, and Yamaha.

**iFixit** (`https://www.ifixit.com/Device/Motorcycle`) provides step-by-step repair guides with annotated photos, organized by brand. Its public API (`https://www.ifixit.com/api/2.0`) returns JSON data for guides, categories, tools lists, and wiki content. Content is licensed **CC BY-NC-SA 3.0**, making it legally reusable with attribution. The limitation is thin motorcycle coverage — perhaps a few dozen guides — but the Q&A forum has broader content.

For **service manuals**, several free archives exist:
- **CarlSalter.com** (`https://www.carlsalter.com/motorcycle-manuals.asp`) — the largest free collection, with PDF service manuals for 30+ brands including Aprilia, BMW, Ducati, Harley-Davidson, Honda, Kawasaki, KTM, Suzuki, Triumph, and Yamaha
- **Motorcycle-Manual.com** (`https://www.motorcycle-manual.com/`) — PDF manuals, wiring diagrams, schematics, microfiches, and DTC error code lists organized by manufacturer
- **4-Stroke.net** (`https://4-stroke.net/download.html`) — Official Honda workshop manuals and wiring schematics
- **LowBrow Customs** — extensive Harley-Davidson service manuals and troubleshooting guides (1959–2024)

These PDF manuals contain the richest diagnostic information available but require OCR/parsing to extract structured data.

**Torque specifications and service intervals** have limited free structured sources. **MaintenanceSchedule.com** offers curated maintenance schedules with torque specs, valve clearances, and tire pressures for Ducati, Honda, Harley-Davidson, Yamaha, BMW, KTM, Royal Enfield, and Triumph — but only as HTML pages requiring scraping. **TightTorque.com** provides a growing torque database sourced from manufacturer workshop manuals with verified/unverified indicators. **Cyclepedia** (`https://www.cyclepedia.com/motorcycle-specification-database/`) has hundreds of thousands of specs (torque values, fluid capacities, valve clearances, DTCs) but is subscription-only.

For **wiring diagrams**, Dan's Motorcycle (`http://www.dansmc.com/wiring_diagram.htm`) and CycleTerminal.com offer free collections for select models. **Autodata Group** provides standardized wiring diagrams, DTCs, and DLC locations across manufacturers but costs $48/month after a $1 trial.

**Diagnostic trouble codes** are fragmented for motorcycles since most (especially older ones) don't use standard OBD-II. DTCSearch.com provides free OBD-II code lookup. Klavkarr.com lists ~11,000 standardized OBD-II DTCs. The UTI blog (`https://www.uti.edu/blog/motorcycle/trouble-codes`) publishes a comprehensive Harley-Davidson DTC reference. The commercial **MOTOR** product offers an OEM-sourced DTC library with repair guidance available via API, but pricing is not public.

**Parts interchange data** remains the most fragmented area. OEM-Bike-Parts.com and Partzilla.com offer free browsing of exploded-view parts catalogs with cross-reference features for Honda, Yamaha, Kawasaki, Suzuki, KTM, and Ducati — but no API access.

---

## Community Q&A data for training and knowledge extraction

Two sources stand out as both high-quality and legally accessible for building a knowledge base.

**Motor Vehicle Maintenance & Repair StackExchange** (`https://mechanics.stackexchange.com`) is the cleanest data source available. Its ~62.5MB data dump contains structured XML files (Posts, Users, Votes, Comments, Tags) with expert-moderated Q&A content licensed under **CC-BY-SA 4.0** — explicitly designed for reuse including commercial applications with attribution. The dump is available on the Internet Archive at `https://archive.org/details/stackexchange`. The **EleutherAI/stackexchange-dataset** tool on GitHub processes these dumps directly into Q&A text pairs ready for LLM training with a single command: `python3 main.py --names mechanics.stackexchange`. Motorcycle content can be filtered by tags.

**Reddit's r/Fixxit** (~17,300 subscribers) is uniquely valuable because rules require posts to include year, make, and model in the title — creating naturally structured troubleshooting data. The **Arctic Shift** project (`https://github.com/ArthurHeitmann/arctic_shift`, 349+ stars) provides free downloadable archives of entire subreddit histories in JSON/NDJSON format via `https://arctic-shift.photon-reddit.com/download-tool`. Monthly releases are available through December 2025. Additional relevant subreddits include r/motorcycles (~784K subscribers), r/MechanicAdvice (~900K+ subscribers), and brand-specific communities.

A critical legal distinction: StackExchange data has clear CC-BY-SA 4.0 licensing for commercial reuse. Reddit data access via Arctic Shift is technically feasible but **Reddit's 2024 Public Content Policy requires contracts for commercial data use**. For a commercial app, Reddit data should be used cautiously — potentially as training input rather than directly reproduced content.

Traditional motorcycle forums like **ADVrider** and **ThumperTalk** contain deep technical knowledge but have no APIs and their terms of service typically prohibit scraping. These are best treated as reference sources rather than data pipeline candidates.

---

## Government APIs, VIN decoders, and recall databases

Government sources provide the most reliable, legally unambiguous data available — all free and public domain.

The **NHTSA API suite** offers four complementary endpoints, none requiring authentication:

- **vPIC VIN Decoder**: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{VIN}?format=json` — 130+ decoded attributes per motorcycle, batch decoding supported
- **Recalls**: `https://api.nhtsa.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}` — all safety recalls with campaign details and remedies
- **Complaints**: `https://api.nhtsa.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}` — consumer-reported defect descriptions
- **FARS Crash Data**: `https://crashviewer.nhtsa.dot.gov/CrashAPI` — fatal crash census data from 1975+ filterable by motorcycle body type, with 170+ coded elements per crash

**Transport Canada's VRDB** provides Canadian vehicle recalls via API at `http://data.tc.gc.ca/v1.3/api/eng/vehicle-recall-database/recall?format=json` (free API key registration required) and monthly CSV/XML bulk downloads under the Open Government Licence. **Australia's Vehicle Recalls Database** (`https://www.vehiclerecalls.gov.au/`) covers motorcycles but offers web search only — no API. The **EU Safety Gate** (formerly RAPEX) publishes weekly recall data as downloadable Excel files, with an OpenDataSoft API mirror available.

The **EPA publishes motorcycle emissions certification data** as downloadable XLSX files at `https://www.epa.gov/compliance-and-fuel-economy-data/annual-certification-data-vehicles-engines-and-equipment`, covering model years 1982–present with manufacturer, engine family, displacement, and emission test results. Certified electric motorcycle data is tracked separately from 2015 onward.

For commercial VIN decoding with broader international coverage, **Vincario** (`https://vincario.com/motorcycle-vin-decoder/`) is strong for European markets with free sign-up reports, and **CarsXE** (`https://api.carsxe.com/`) offers a 7-day free trial covering motorcycles and RVs.

Insurance classification data is largely locked behind commercial licensing. **Thatcham Research** in the UK maintains the industry-standard dataset with 100+ data points per vehicle (including motorcycles), but access requires a commercial license. No equivalent open dataset exists globally.

---

## Open-source projects worth leveraging

Several open-source projects provide reusable code, database schemas, and architectural patterns.

**LubeLogger** (`https://github.com/hargata/lubelog`) is the most mature option — a self-hosted vehicle maintenance tracker with **2,000+ GitHub stars**, 1,740+ commits, MIT license, and active development. Built with ASP.NET Core and deployable via Docker, it provides a production-ready database schema for service records, fuel tracking, and document management. Its architecture offers a solid foundation for a maintenance-tracking component.

**Moto-Mecanico** (`https://github.com/ramblenride/moto-mecanico`) is the only motorcycle-specific maintenance app found — a Flutter/Dart mobile app for tracking maintenance tasks, built from real long-distance riding experience. Licensed under MPL-2.0 with 7 stars. Small but directly relevant for motorcycle-specific task definitions and mobile UI patterns.

**Bike MD** (`https://github.com/bike-md/bike_md`) is a Python/Django/PostgreSQL web app designed for browsing common motorcycle problems and solutions by model — conceptually closest to the troubleshooting app described. It's a student project needing refactoring but demonstrates a viable data model for symptom-to-fix mapping.

For diagnostic tool integration, **AndrOBD** (`https://github.com/fr3ts0n/AndrOBD`) and **pyOBD** (`https://github.com/barracuda-fsh/pyobd`) provide open-source OBD-II communication code, DTC databases, and PID definitions. More specialized projects include a Honda K-Line diagnostics interface and a Suzuki SV650 ESP32-based diagnostic monitor — both demonstrating motorcycle-specific ECU communication.

**GarageBuddy** (`https://github.com/dimitar-grigorov/GarageBuddy`, MIT, 32 stars) offers a garage management system with service tracking, parts inventory, and customer management workflows in ASP.NET Core — useful if the app needs shop-facing features.

---

## Recommended architecture for assembling the data

The optimal strategy combines free structured APIs for real-time lookups with bulk datasets for the core database, layered with community knowledge for troubleshooting intelligence.

The **foundation layer** should use the Kaggle motorcycle specs dataset (1970–2022) as the seed database, enriched by API Ninjas for newer models and gaps. NHTSA vPIC handles VIN-based identification at zero cost. This gives global spec coverage for the most common service-age motorcycles.

The **diagnostic intelligence layer** draws from NHTSA complaints and recalls (structured failure-mode data by make/model/year), StackExchange Mechanics data dumps (expert Q&A with CC-BY-SA licensing), and r/Fixxit archives (year/make/model-tagged troubleshooting threads). These three sources together create a searchable knowledge base mapping symptoms to known issues and fixes.

The **reference layer** consists of parsed service manual PDFs from CarlSalter.com and Motorcycle-Manual.com, torque specs from MaintenanceSchedule.com, and wiring diagrams from the free archives. These require more processing (OCR, HTML scraping) but contain the deepest technical content.

The **biggest opportunity** is that no open, structured motorcycle diagnostic decision tree exists today. Building one — even starting with the most common 50 motorcycle models and their top 20 failure modes extracted from NHTSA complaint data and community forums — would be a genuinely novel contribution that could anchor the entire app's value proposition.

## Conclusion

The motorcycle data landscape is fragmented but workable. Government APIs (especially the NHTSA suite) provide the most reliable and legally clean foundation — free, public domain, and requiring no authentication. Community Q&A data from StackExchange offers the clearest legal path for reusable troubleshooting content, while Reddit's r/Fixxit provides the most targeted motorcycle troubleshooting corpus if licensing can be navigated. Specification data is well-served by the combination of Kaggle's free bulk dataset and API Ninjas' real-time API. The critical gap remains structured diagnostic logic: no source provides ready-made symptom-to-fix decision trees for motorcycles. This gap is the app's opportunity — by programmatically mining NHTSA complaint patterns and community Q&A data, a novel diagnostic knowledge base can be constructed that doesn't exist anywhere else today.