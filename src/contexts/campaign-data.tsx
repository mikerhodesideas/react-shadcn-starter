// src/contexts/campaign-data.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { DataService } from '@/services/data-service'
import type { DailyData, ThirtyDayData } from '@/types/metrics'

interface CampaignDataContextType {
  dailyData: DailyData[]
  thirtyDayData: ThirtyDayData[]
  hourlyTodayData: any[]
  hourlyYesterdayData: any[]
  settings: any[]
  products: any[]
  matchTypes: any[]
  searchTerms: any[]
  channels: any[]
  pmax: any[]
  isLoading: boolean
  error: string | null
  refreshData: () => void
  lastUpdated: Date | null
  campaigns: string[]
}

const CampaignDataContext = createContext<CampaignDataContextType | undefined>(undefined)

export function CampaignDataProvider({ children }: { children: React.ReactNode }) {
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [thirtyDayData, setThirtyDayData] = useState<ThirtyDayData[]>([])
  const [hourlyTodayData, setHourlyTodayData] = useState<any[]>([])
  const [hourlyYesterdayData, setHourlyYesterdayData] = useState<any[]>([])
  const [settings, setSettings] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [matchTypes, setMatchTypes] = useState<any[]>([])
  const [searchTerms, setSearchTerms] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [pmax, setPmax] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refreshData = () => {
    try {
      const data = DataService.loadData()
      if (!data) {
        setDailyData([])
        setThirtyDayData([])
        setCampaigns([])
        setLastUpdated(null)
        setError(null)
        return
      }

      // Update all data states
      setDailyData(data.daily || [])
      setThirtyDayData(data.thirty_days || [])
      setHourlyTodayData(data.hourly_today || [])
      setHourlyYesterdayData(data.hourly_yesterday || [])
      setSettings(data.settings || [])
      setProducts(data.products || [])
      setMatchTypes(data.match_types || [])
      setSearchTerms(data.search_terms || [])
      setChannels(data.channels || [])
      setPmax(data.pmax || [])
      
      // Extract unique campaign names from daily data
      const uniqueCampaigns = Array.from(new Set(data.daily?.map(row => row.Campaign) || []))
      setCampaigns(uniqueCampaigns)
      
      setLastUpdated(new Date(data.timestamp))
      setError(null)
      
      console.log('Context refreshed:', {
        dailyDataLength: data.daily?.length,
        thirtyDayDataLength: data.thirty_days?.length,
        campaignsLength: uniqueCampaigns.length
      })
    } catch (err) {
      console.error('Error loading campaign data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  return (
    <CampaignDataContext.Provider value={{
      dailyData,
      thirtyDayData,
      hourlyTodayData,
      hourlyYesterdayData,
      settings,
      products,
      matchTypes,
      searchTerms,
      channels,
      pmax,
      campaigns,
      isLoading,
      error,
      refreshData,
      lastUpdated
    }}>
      {children}
    </CampaignDataContext.Provider>
  )
}

export function useCampaignData() {
  const context = useContext(CampaignDataContext)
  if (!context) {
    throw new Error('useCampaignData must be used within CampaignDataProvider')
  }
  return context
}