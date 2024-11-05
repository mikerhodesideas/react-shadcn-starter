import { RawDailyData, ProcessedDailyData, CachedData } from '@/types/raw-data'

const CACHE_KEY = 'campaignData'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export class DataService {
  static transformRawData(rawData: RawDailyData[]): ProcessedDailyData[] {
    console.log('Transforming raw data:', rawData.slice(0, 2))
    
    return rawData.map(row => ({
      date: new Date(row.Date).toISOString().split('T')[0],
      campaign: row.Campaign,
      impr: row.Impressions,
      clicks: row.Clicks,
      cost: row.Cost,
      conv: row.Conversions,
      value: row.ConvValue,
      lostToBudget: row.LostToBudget,
      imprShare: row.ImprShare,
      lostToRank: row.LostToRank,
      campaignId: row.CampaignId
    }))
  }

  static validateRawData(data: any): data is RawDailyData[] {
    console.log('Validating raw data structure')
    if (!Array.isArray(data)) {
      console.error('Data is not an array')
      return false
    }

    const requiredFields = [
      'Date', 'Clicks', 'LostToBudget', 'ImprShare', 'LostToRank',
      'ConvValue', 'Conversions', 'Cost', 'Impressions', 'Campaign', 'CampaignId'
    ]
    
    const firstRow = data[0]
    if (!firstRow) {
      console.error('Data array is empty')
      return false
    }

    const hasAllFields = requiredFields.every(field => field in firstRow)
    if (!hasAllFields) {
      console.error('Missing required fields. Found:', Object.keys(firstRow))
      console.error('Required:', requiredFields)
      return false
    }

    return true
  }

  static async fetchData(url: string) {
    console.log('Fetching data from:', url)
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Raw data received:', data.slice(0, 2))
    return data
  }

  static saveToCache(data: CachedData) {
    console.log('Saving data to cache')
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  }

  static loadFromCache(): CachedData | null {
    console.log('Loading data from cache')
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) {
      console.log('No cached data found')
      return null
    }

    const data = JSON.parse(cached) as CachedData
    const cacheAge = new Date().getTime() - new Date(data.timestamp).getTime()
    
    console.log('Cache age (hours):', cacheAge / (60 * 60 * 1000))
    
    if (cacheAge > CACHE_DURATION) {
      console.log('Cache expired')
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return data
  }

  // For development/testing - save sample data
  static saveSampleData() {
    const sampleData: CachedData = {
      timestamp: new Date().toISOString(),
      daily: [
        // Add your sample daily data here
      ],
      thirty_days: [
        // Add your sample 30-day data here
      ]
    }
    this.saveToCache(sampleData)
  }
} 