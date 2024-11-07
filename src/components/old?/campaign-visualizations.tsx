'use client'

import { Card } from "@/components/ui/card"
import { type SheetData } from "@/types/metrics"

interface CampaignVisualizationsProps {
  data: SheetData[]
}

export function CampaignVisualizations({ data }: CampaignVisualizationsProps) {
  if (!data?.length) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">No data available</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      {/* Add your visualization components here */}
      <p>Data loaded: {data.length} rows</p>
    </Card>
  )
} 