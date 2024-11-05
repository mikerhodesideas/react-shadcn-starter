import { STORAGE_KEYS } from '@/lib/constants'

export const DataService = {
  saveData(data: any) {
    const timestamp = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.CAMPAIGN_DATA, JSON.stringify({
      timestamp,
      daily: data,
      thirty_days: data
    }))
  },

  loadData() {
    const cached = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_DATA)
    if (!cached) return null
    return JSON.parse(cached)
  },

  clearData() {
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_DATA)
  },

  isDataStale() {
    const cached = this.loadData()
    if (!cached) return true
    
    const cacheAge = new Date().getTime() - new Date(cached.timestamp).getTime()
    return cacheAge > 24 * 60 * 60 * 1000 // 24 hours
  }
} 