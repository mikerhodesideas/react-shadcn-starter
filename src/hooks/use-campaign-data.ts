import { useState } from 'react'
import { mockCampaigns } from '@/data/mock-campaigns'
import { mockProfitData } from '@/data/mock-profit-data'
import { type Campaign } from '@/types/metrics'

type MockProfitDataKey = keyof typeof mockProfitData

export function useCampaignData() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [cost, setCost] = useState(1.0)
  const [convValue, setConvValue] = useState(100)
  const [activeChart, setActiveChart] = useState('profit')

  const currentCampaignData = selectedCampaign 
    ? mockProfitData[selectedCampaign.id as MockProfitDataKey]
    : null

  return {
    campaigns: mockCampaigns,
    selectedCampaign,
    setSelectedCampaign,
    cost,
    setCost,
    convValue,
    setConvValue,
    activeChart,
    setActiveChart,
    profitData: currentCampaignData?.profitData || [],
    incrementalData: currentCampaignData?.incrementalData || [],
    optimalPoint: currentCampaignData?.optimalPoint || null,
    optimalZone: currentCampaignData?.optimalZone || null
  }
} 