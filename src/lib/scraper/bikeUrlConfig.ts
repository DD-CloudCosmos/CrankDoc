/**
 * Bike URL Configuration
 *
 * Static mapping of all target motorcycles to their public data sources.
 * Wikipedia (CC-BY-SA licensed) is the primary source. motorcyclespecs.co.za
 * provides structured spec tables as a secondary source.
 */

import type { BikeConfig } from './scraper.types'

export const BIKE_CONFIGS: BikeConfig[] = [
  // -------------------------------------------------------------------------
  // Core 5 motorcycles
  // -------------------------------------------------------------------------
  {
    make: 'Honda',
    model: 'CBR600RR',
    yearStart: 2003,
    yearEnd: 2024,
    category: 'sport',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Honda_CBR600RR',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Honda CBR600RR',
        wikiPageTitle: 'Honda_CBR600RR',
      },
      {
        url: 'https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600rr_04.html',
        sourceType: 'spec_database',
        label: 'MotorcycleSpecs - Honda CBR600RR',
        parserId: 'motorcyclespecs',
      },
      {
        url: 'https://powersports.honda.com/motorcycle/supersport/cbr600rr',
        sourceType: 'manufacturer',
        label: 'Honda - CBR600RR',
        parserId: 'honda',
      },
    ],
  },
  {
    make: 'Yamaha',
    model: 'MT-07',
    yearStart: 2014,
    yearEnd: null,
    category: 'naked',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Yamaha_MT-07',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Yamaha MT-07',
        wikiPageTitle: 'Yamaha_MT-07',
      },
      {
        url: 'https://www.motorcyclespecs.co.za/model/yamaha/yamaha_mt%2007_21.html',
        sourceType: 'spec_database',
        label: 'MotorcycleSpecs - Yamaha MT-07',
        parserId: 'motorcyclespecs',
      },
      {
        url: 'https://www.yamahamotorsports.com/sport/models/mt-07',
        sourceType: 'manufacturer',
        label: 'Yamaha - MT-07',
        parserId: 'yamaha',
      },
    ],
  },
  {
    make: 'Harley-Davidson',
    model: 'Sportster 883',
    yearStart: 1986,
    yearEnd: 2022,
    category: 'cruiser',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Harley-Davidson_Sportster',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Harley-Davidson Sportster',
        wikiPageTitle: 'Harley-Davidson_Sportster',
      },
      {
        url: 'https://www.motorcyclespecs.co.za/model/h-d/harley_davidson_sporter_883_iron_20.html',
        sourceType: 'spec_database',
        label: 'MotorcycleSpecs - Harley-Davidson Sportster 883',
        parserId: 'motorcyclespecs',
      },
      {
        url: 'https://www.harley-davidson.com/us/en/motorcycles/sportster.html',
        sourceType: 'manufacturer',
        label: 'Harley-Davidson - Sportster',
        parserId: 'harley',
      },
    ],
  },
  {
    make: 'Kawasaki',
    model: 'Ninja 400',
    yearStart: 2018,
    yearEnd: null,
    category: 'sport',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Kawasaki_Ninja_400',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Kawasaki Ninja 400',
        wikiPageTitle: 'Kawasaki_Ninja_400',
      },
      {
        url: 'https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_ninja_400_23.html',
        sourceType: 'spec_database',
        label: 'MotorcycleSpecs - Kawasaki Ninja 400',
        parserId: 'motorcyclespecs',
      },
      {
        url: 'https://www.kawasaki.com/en-us/motorcycle/ninja/sport/ninja-400',
        sourceType: 'manufacturer',
        label: 'Kawasaki - Ninja 400',
        parserId: 'kawasaki',
      },
    ],
  },
  {
    make: 'BMW',
    model: 'R1250GS',
    yearStart: 2019,
    yearEnd: null,
    category: 'adventure',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/BMW_R1250GS',
        sourceType: 'wikipedia',
        label: 'Wikipedia - BMW R1250GS',
        wikiPageTitle: 'BMW_R1250GS',
      },
      {
        url: 'https://www.motorcyclespecs.co.za/model/bmw/bmw-r1250gs-19.html',
        sourceType: 'spec_database',
        label: 'MotorcycleSpecs - BMW R1250GS',
        parserId: 'motorcyclespecs',
      },
      {
        url: 'https://www.bmw-motorrad.com/en/models/adventure/r1250gs.html',
        sourceType: 'manufacturer',
        label: 'BMW Motorrad - R1250GS',
        parserId: 'bmw',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Kymco scooters
  // -------------------------------------------------------------------------
  {
    make: 'Kymco',
    model: 'Agility 125',
    yearStart: 2006,
    yearEnd: null,
    category: 'scooter',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Kymco_Agility',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Kymco Agility',
        wikiPageTitle: 'Kymco_Agility',
      },
    ],
  },
  {
    make: 'Kymco',
    model: 'Like 125i',
    yearStart: 2017,
    yearEnd: null,
    category: 'scooter',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Kymco_Like',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Kymco Like',
        wikiPageTitle: 'Kymco_Like',
      },
    ],
  },
  {
    make: 'Kymco',
    model: 'People S 125i',
    yearStart: 2018,
    yearEnd: null,
    category: 'scooter',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Kymco_People',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Kymco People',
        wikiPageTitle: 'Kymco_People',
      },
    ],
  },
  {
    make: 'Kymco',
    model: 'Downtown 125i',
    yearStart: 2009,
    yearEnd: null,
    category: 'scooter',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Kymco_Downtown',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Kymco Downtown',
        wikiPageTitle: 'Kymco_Downtown',
      },
    ],
  },
  {
    make: 'Kymco',
    model: 'Downtown 300i',
    yearStart: 2009,
    yearEnd: null,
    category: 'scooter',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Kymco_Downtown',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Kymco Downtown',
        wikiPageTitle: 'Kymco_Downtown',
      },
    ],
  },
  {
    make: 'Kymco',
    model: 'X-Town 300i',
    yearStart: 2016,
    yearEnd: null,
    category: 'scooter',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Kymco_X-Town',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Kymco X-Town',
        wikiPageTitle: 'Kymco_X-Town',
      },
    ],
  },
  {
    make: 'Kymco',
    model: 'AK 550i',
    yearStart: 2017,
    yearEnd: null,
    category: 'scooter',
    sources: [
      {
        url: 'https://en.wikipedia.org/wiki/Kymco_AK_550',
        sourceType: 'wikipedia',
        label: 'Wikipedia - Kymco AK 550',
        wikiPageTitle: 'Kymco_AK_550',
      },
    ],
  },
]

/**
 * Generates a URL-safe slug from a bike config.
 * Format: "make-model" lowercase with spaces replaced by hyphens.
 *
 * Examples:
 * - Honda CBR600RR → "honda-cbr600rr"
 * - Harley-Davidson Sportster 883 → "harley-davidson-sportster-883"
 * - Kymco AK 550i → "kymco-ak-550i"
 */
export function getBikeSlug(bike: BikeConfig): string {
  return `${bike.make}-${bike.model}`
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/**
 * Filters bikes by slugs. Pass ['all'] or an empty array to get all bikes.
 * Returns only bikes whose slug matches one of the provided values.
 */
export function filterBikes(slugs: string[]): BikeConfig[] {
  if (slugs.length === 0 || (slugs.length === 1 && slugs[0] === 'all')) {
    return BIKE_CONFIGS
  }

  const slugSet = new Set(slugs.map((s) => s.toLowerCase()))
  return BIKE_CONFIGS.filter((bike) => slugSet.has(getBikeSlug(bike)))
}
