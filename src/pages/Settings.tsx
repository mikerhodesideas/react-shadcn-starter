//settings.tsx
'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { GOOGLE_SHEET_URL, STORAGE_KEYS } from "@/lib/constants"

interface RawMetrics {
  Date: string
  Clicks: number
  LostToBudget: number
  ImprShare: number
  LostToRank: number
  ConvValue: number
  Conversions: number
  Cost: number
  Impressions: number
  'campaign.resourceName': string
  Campaign: string
  CampaignId: number
}

interface ProcessedMetrics {
  date: string
  campaign: string
  impr: number
  clicks: number
  cost: number
  conv: number
  value: number
  lostToBudget: number
  imprShare: number
  lostToRank: number
  campaignId: number
}

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false)
  const [sheetUrl, setSheetUrl] = useState(GOOGLE_SHEET_URL)
  const [data, setData] = useState<ProcessedMetrics[]>([])
  const { toast } = useToast()

  const processRawData = (rawData: RawMetrics[]): ProcessedMetrics[] => {
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

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(sheetUrl)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const rawData = await response.json()
      console.log("Raw data received:", rawData.slice(0, 2))

      const processedData = processRawData(rawData)
      
      // Just store in localStorage - that's all we need
      const timestamp = new Date().toISOString()
      localStorage.setItem(STORAGE_KEYS.CAMPAIGN_DATA, JSON.stringify({
        timestamp,
        daily: processedData,
        thirty_days: processedData
      }))

      setData(processedData)
      
      toast({
        title: "Success",
        description: `Loaded ${processedData.length} rows of data`
      })

    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load data"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Google Sheet URL</label>
            <div className="flex gap-2">
              <Input
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="Enter Google Sheet Web App URL"
              />
              <Button onClick={fetchData} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load Data
              </Button>
            </div>
          </div>

          {/* Data Preview */}
          {data.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Data Preview (First 3 Rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Campaign</th>
                      <th className="px-4 py-2 text-right">Impr</th>
                      <th className="px-4 py-2 text-right">Clicks</th>
                      <th className="px-4 py-2 text-right">Cost</th>
                      <th className="px-4 py-2 text-right">Conv</th>
                      <th className="px-4 py-2 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 3).map((row, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-4 py-2">{row.date}</td>
                        <td className="px-4 py-2">{row.campaign}</td>
                        <td className="px-4 py-2 text-right">{row.impr.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">{row.clicks.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">${row.cost.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{row.conv.toFixed(1)}</td>
                        <td className="px-4 py-2 text-right">${row.value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}