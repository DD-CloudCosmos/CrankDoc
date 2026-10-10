'use client'
import { useEffect } from 'react'
import { trackHistoryPositions } from '@/lib/historyPositions'
export function HistoryPositions() {
 useEffect(()=>trackHistoryPositions(),[])
 return null
}
