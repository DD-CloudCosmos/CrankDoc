import { createServerClient } from '@/lib/supabase/server'
import type { Motorcycle, MotorcycleImage } from '@/types/database.types'
import type { GarageBikeOption } from '@/lib/garage'

export interface GarageBikeData {
  bikes: GarageBikeOption[]
  /** Guides with no motorcycle_id (they apply to every bike) */
  universalTreeCount: number
}

/**
 * Load every motorcycle with its primary photo and guide count, shaped for
 * the garage picker and home page. Never throws: if Supabase is unavailable
 * the page still renders, just without bikes.
 */
export async function getGarageBikeData(): Promise<GarageBikeData> {
  try {
    const supabase = createServerClient()
    const [bikesResult, imagesResult, treesResult] = await Promise.all([
      supabase.from('motorcycles').select('*').order('make').order('model'),
      supabase.from('motorcycle_images').select('*').eq('is_primary', true),
      supabase.from('diagnostic_trees').select('id, motorcycle_id'),
    ])

    const motorcycles = (bikesResult.data ?? []) as Motorcycle[]
    const images = (imagesResult.data ?? []) as MotorcycleImage[]
    const trees = (treesResult.data ?? []) as Array<{ id: string; motorcycle_id: string | null }>

    const imageByBike = new Map(images.map((image) => [image.motorcycle_id, image]))
    const treeCounts = new Map<string, number>()
    let universalTreeCount = 0
    for (const tree of trees) {
      if (tree.motorcycle_id) {
        treeCounts.set(tree.motorcycle_id, (treeCounts.get(tree.motorcycle_id) ?? 0) + 1)
      } else {
        universalTreeCount += 1
      }
    }

    const bikes = motorcycles.map((moto) => {
      const image = imageByBike.get(moto.id)
      return {
        id: moto.id,
        make: moto.make,
        model: moto.model,
        imageUrl: image?.image_url ?? null,
        imageAlt: image?.alt_text ?? null,
        treeCount: treeCounts.get(moto.id) ?? 0,
      }
    })

    return { bikes, universalTreeCount }
  } catch (error) {
    console.error('Error loading garage bikes:', error)
    return { bikes: [], universalTreeCount: 0 }
  }
}
