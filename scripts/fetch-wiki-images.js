#!/usr/bin/env node

/**
 * Fetches image metadata from Wikimedia Commons for motorcycle photos.
 * Outputs URL, size, license, and author for each candidate.
 */

const files = [
  'File:Honda CBR600RR 2006 WSS.jpg',
  'File:Blue 2007 Honda CBR600RR left front.jpg',
  'File:2021 Black Yamaha MT-07.jpg',
  'File:Harley Davidson 883 Sportster 1997 (14122005799).jpg',
  'File:Harley Davidson XL 883 Sporster 2013 (14122046290).jpg',
  'File:Harley Davidson XL 1200.JPG',
  'File:Harley Davidson 1200 Forty Eight (16529970242).jpg',
  'File:Kawasaki Ninja 400.jpg',
  'File:BMW R 1250 GS (1).jpg',
]

async function main() {
  const titles = files.join('|')
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(titles) +
    '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1200&format=json'
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CrankDoc/1.0 (motorcycle diagnostic app)' },
  })
  const data = await res.json()

  for (const [id, page] of Object.entries(data.query.pages)) {
    if (!page.imageinfo) continue
    const info = page.imageinfo[0]
    const meta = info.extmetadata || {}
    const license = meta.LicenseShortName
      ? meta.LicenseShortName.value
      : 'unknown'
    const author = meta.Artist
      ? meta.Artist.value.replace(/<[^>]*>/g, '').trim().substring(0, 80)
      : 'unknown'
    const w = info.width
    const h = info.height
    const thumbUrl = info.thumburl || info.url

    console.log(page.title)
    console.log(`  Size: ${w}x${h}  License: ${license}`)
    console.log(`  Author: ${author}`)
    console.log(`  Thumb: ${thumbUrl}`)
    console.log(`  Full: ${info.url}`)
    console.log()
  }
}

main().catch((err) => console.error(err))
