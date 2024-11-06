// src/lib/storage-utils.ts
import { STORAGE_KEYS, CACHE_DURATION } from './constants'

export interface StorageData {
  timestamp: string
  daily: any[]
  thirty_days: any[]
}

export function loadStorageData(): StorageData | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_DATA)
    if (!cached) return null
    
    const parsed = JSON.parse(cached)
    
    // Validate structure
    if (!parsed.timestamp || !Array.isArray(parsed.daily) || !Array.isArray(parsed.thirty_days)) {
      throw new Error('Invalid data structure')
    }
    
    // Check if cache is expired
    const cacheAge = new Date().getTime() - new Date(parsed.timestamp).getTime()
    if (cacheAge > CACHE_DURATION) {
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_DATA)
      return null
    }
    
    return parsed
  } catch (error) {
    console.error('Error loading cached data:', error)
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_DATA)
    return null
  }
}

export function saveStorageData(data: any[]): StorageData {
  const storageData: StorageData = {
    timestamp: new Date().toISOString(),
    daily: data,
    thirty_days: data // For now using same data as specified in Settings
  }
  
  localStorage.setItem(STORAGE_KEYS.CAMPAIGN_DATA, JSON.stringify(storageData))
  return storageData
}