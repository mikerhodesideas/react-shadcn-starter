// src/lib/storage-utils.ts
import { STORAGE_KEYS, CACHE_DURATION } from './constants'

export interface StorageData {
  timestamp: string
  daily: any[]
  thirty_days: any[]
  previous_thirty_days: any[]
  seven_days: any[]
  previous_seven_days: any[]
  hourly_today: any[]
  hourly_yesterday: any[]
  settings: any[]
  products: any[]
  channels: any[]
  pmax: any[]
}

const REQUIRED_KEYS: (keyof StorageData)[] = [
  'timestamp',
  'daily',
  'thirty_days',
  'previous_thirty_days',
  'seven_days',
  'previous_seven_days',
  'hourly_today',
  'hourly_yesterday',
  'settings',
  'products',
  'channels',
  'pmax'
];

export function loadStorageData(): StorageData | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_DATA)
    if (!cached) return null
    
    const parsed = JSON.parse(cached)
    
    // Validate structure
    const hasAllKeys = REQUIRED_KEYS.every(key => {
      if (key === 'timestamp') return typeof parsed[key] === 'string';
      return Array.isArray(parsed[key]);
    });

    if (!hasAllKeys) {
      throw new Error('Invalid data structure');
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
    thirty_days: data,
    previous_thirty_days: data,
    seven_days: data,
    previous_seven_days: data,
    hourly_today: data,
    hourly_yesterday: data,
    settings: data,
    products: data,
    channels: data,
    pmax: data
  }
  
  localStorage.setItem(STORAGE_KEYS.CAMPAIGN_DATA, JSON.stringify(storageData))
  return storageData
}