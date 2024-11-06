// src/services/data-service.ts

import { STORAGE_KEYS, CACHE_DURATION } from '@/lib/constants'
import type { DailyData, ThirtyDayData, StorageData } from '@/types/metrics'

function aggregateForThirtyDays(dailyData: DailyData[]): ThirtyDayData[] {
  const campaignMap = new Map<string, ThirtyDayData>()

  dailyData.forEach(row => {
    const campaignId = row.CampaignId.toString()
    if (!campaignMap.has(campaignId)) {
      campaignMap.set(campaignId, {
        Campaign: row.Campaign,
        CampaignId: row.CampaignId.toString(),
        Clicks: 0,
        Impressions: 0,
        Cost: 0,
        Conversions: 0,
        ConvValue: 0,
        ImprShare: row.ImprShare,
        LostToBudget: row.LostToBudget,
        LostToRank: row.LostToRank
      })
    }

    const campaign = campaignMap.get(campaignId)!
    campaign.Clicks += row.Clicks
    campaign.Impressions += row.Impressions
    campaign.Cost += row.Cost
    campaign.Conversions += row.Conversions
    campaign.ConvValue += row.ConvValue
  })

  return Array.from(campaignMap.values())
}

export const DataService = {
  saveData: (data: any) => {
    try {
      // Ensure data exists before processing
      if (!data?.daily || !Array.isArray(data.daily)) {
        console.error('Invalid daily data format:', data?.daily)
        return false
      }

      const timestamp = new Date().toISOString()
      const processedData = {
        daily: data.daily,
        thirty_days: data.thirty_days || [],
        hourly_today: data.hourly_today || [],
        hourly_yesterday: data.hourly_yesterday || [],
        settings: data.settings || [],
        products: data.products || [],
        // match_types temporarily removed due to size
        search_terms: data.search_terms || [],
        channels: data.channels || [],
        pmax: data.pmax || [],
        timestamp
      }

      try {
        localStorage.setItem(STORAGE_KEYS.CAMPAIGN_DATA, JSON.stringify(processedData))
        return true
      } catch (storageError) {
        // If storage fails, try removing search_terms as it's the next largest dataset
        console.warn('Storage failed, attempting without search_terms:', storageError)
        const reducedData = {
          ...processedData,
          search_terms: [] // Clear search terms if storage fails
        }
        localStorage.setItem(STORAGE_KEYS.CAMPAIGN_DATA, JSON.stringify(reducedData))
        return true
      }
    } catch (error) {
      console.error('Error saving data:', error)
      return false
    }
  },

  loadData: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_DATA)
      if (!data) return null

      const parsedData = JSON.parse(data)
      
      // Ensure all expected arrays exist
      return {
        daily: parsedData.daily || [],
        thirty_days: parsedData.thirty_days || [],
        hourly_today: parsedData.hourly_today || [],
        hourly_yesterday: parsedData.hourly_yesterday || [],
        settings: parsedData.settings || [],
        products: parsedData.products || [],
        search_terms: parsedData.search_terms || [],
        channels: parsedData.channels || [],
        pmax: parsedData.pmax || [],
        timestamp: parsedData.timestamp
      }
    } catch (error) {
      console.error('Error loading data:', error)
      return null
    }
  },

  clearData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_DATA)
    } catch (error) {
      console.error('Error clearing data:', error)
    }
  },

  isDataStale() {
    const cached = this.loadData()
    if (!cached) return true
    
    const cacheAge = new Date().getTime() - new Date(cached.timestamp).getTime()
    return cacheAge > CACHE_DURATION
  }
}