// src/contexts/campaign-data.tsx

'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { DataService } from '@/services/data-service'

interface CampaignDataContextType {
  dailyData: any[]
  thirtyDayData: any[]
  isLoading: boolean
  error: string | null
  refreshData: () => void
  lastUpdated: Date | null
}

const CampaignDataContext = createContext<CampaignDataContextType | undefined>(undefined)

export function CampaignDataProvider({ children }: { children: React.ReactNode }) {
  const [dailyData, setDailyData] = useState<any[]>([])
  const [thirtyDayData, setThirtyDayData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refreshData = () => {
    try {
      const data = DataService.loadData()
      if (!data?.daily || !data?.thirty_days) {
        throw new Error('Invalid data format')
      }

      setDailyData(data.daily)
      setThirtyDayData(data.thirty_days)
      setLastUpdated(new Date(data.timestamp))
      setError(null)
    } catch (err) {
      console.error('Error loading campaign data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setDailyData([])
      setThirtyDayData([])
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