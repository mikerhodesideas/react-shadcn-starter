'use client'

import { ProfitCurve } from "@/components/ProfitCurve"
import { useCampaignData } from "@/hooks/use-campaign-data"

export default function CampaignAnalysis() {
  const campaignData = useCampaignData()
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Campaign Analysis</h1>
      <ProfitCurve
        {...campaignData}
        currentMetrics={campaignData.selectedCampaign?.metrics || {
          impr: 0,
          clicks: 0,
          cost: 0,
          conv: 0,
          value: 0
        }}
        cogsPercentage={30}
      />
    </div>
  )
} 