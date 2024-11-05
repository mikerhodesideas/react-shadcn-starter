import { useCampaignData } from "@/contexts/campaign-data"

export function useSafeCampaignData() {
  const { dailyData, thirtyDayData, isLoading, error, refreshData, lastUpdated } = useCampaignData()

  // Ensure data is in expected format
  const safeData = {
    dailyData: Array.isArray(dailyData) ? dailyData : [],
    thirtyDayData: Array.isArray(thirtyDayData) ? thirtyDayData : [],
    isLoading,
    error: error || ((!dailyData?.length || !thirtyDayData?.length) && !isLoading ? 'No data available' : null),
    refreshData,
    lastUpdated
  }

  return safeData
} 