// src/pages/index.tsx
'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { GOOGLE_SHEET_URL } from "@/lib/constants"
import { DataService } from '@/services/data-service'
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useCampaignData } from "@/contexts/campaign-data"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define available data sources with descriptions
const DATA_SOURCES = {
  daily: {
    title: 'Daily Data',
    description: 'Daily campaign performance metrics'
  },
  thirty_days: {
    title: '30 Day Data',
    description: 'Aggregated 30-day campaign performance'
  },
  hourly_today: {
    title: 'Today\'s Hourly',
    description: 'Hour-by-hour performance for today'
  },
  hourly_yesterday: {
    title: 'Yesterday\'s Hourly',
    description: 'Hour-by-hour performance for yesterday'
  },
  settings: {
    title: 'Campaign Settings',
    description: 'Campaign configuration and bid strategies'
  },
  products: {
    title: 'Product Data',
    description: 'Product-level performance metrics'
  },
  match_types: {
    title: 'Match Types',
    description: 'Performance by keyword match type'
  },
  search_terms: {
    title: 'Search Terms',
    description: 'Search query performance data'
  },
  channels: {
    title: 'Channels',
    description: 'Performance by advertising channel'
  },
  pmax: {
    title: 'Performance Max',
    description: 'Performance Max campaign data'
  }
} as const

type TabKey = keyof typeof DATA_SOURCES

interface FetchStatus {
  isLoading: boolean
  error?: string
  rowCount?: number
  lastUpdated?: string
}

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sheetUrl, setSheetUrl] = useState(GOOGLE_SHEET_URL)
  const [progress, setProgress] = useState(0)
  const [fetchStatus, setFetchStatus] = useState<Record<TabKey, FetchStatus>>({} as Record<TabKey, FetchStatus>)
  const { refreshData, lastUpdated } = useCampaignData()
  const { toast } = useToast()

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  useEffect(() => {
    const cachedData = DataService.loadData()
    if (cachedData) {
      // Update fetch status for each data type that exists in cache
      const newFetchStatus: Record<TabKey, FetchStatus> = {} as Record<TabKey, FetchStatus>
      Object.entries(DATA_SOURCES).forEach(([tab, _]) => {
        const tabKey = tab as TabKey
        const tabData = cachedData[tabKey]
        newFetchStatus[tabKey] = {
          isLoading: false,
          rowCount: Array.isArray(tabData) ? tabData.length : 0,
          lastUpdated: cachedData.timestamp
        }
      })
      setFetchStatus(newFetchStatus)

      // Auto-refresh if data is stale
      if (DataService.isDataStale()) {
        console.log('Data is stale, auto-refreshing...')
        fetchAllData()
      }
    }
  }, []) // Empty dependency array means this runs once on mount

  const fetchTab = async (tab: string) => {
    setFetchStatus(prev => ({
      ...prev,
      [tab]: { isLoading: true }
    }))

    const url = `${GOOGLE_SHEET_URL}?tab=${tab}`
    console.log(`Fetching ${tab} data from:`, url)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      setFetchStatus(prev => ({
        ...prev,
        [tab]: {
          isLoading: false,
          rowCount: Array.isArray(data) ? data.length : 0
        }
      }))

      return data
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error)
      setFetchStatus(prev => ({
        ...prev,
        [tab]: {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch'
        }
      }))
      throw error
    }
  }

  const fetchAllData = async () => {
    setIsLoading(true)
    setError(null)
    setProgress(0)

    const totalTabs = Object.keys(DATA_SOURCES).length
    let completedTabs = 0

    try {
      const existingData = DataService.loadData() || {}
      const updatedData: Record<string, any> = { ...existingData }

      for (const [tab, source] of Object.entries(DATA_SOURCES)) {
        try {
          const data = await fetchTab(tab)
          if (data) {
            updatedData[tab] = data
          }
          completedTabs++
          setProgress((completedTabs / totalTabs) * 100)
        } catch (error) {
          console.error(`Error fetching ${tab}:`, error)
        }
      }

      if (Object.keys(updatedData).length > 0) {
        updatedData.timestamp = new Date().toISOString()
        DataService.saveData(updatedData)
        refreshData()

        toast({
          title: "Data Updated",
          description: "Campaign data has been successfully refreshed.",
        })
      } else {
        throw new Error('No valid data received from any tab')
      }
    } catch (error) {
      console.error('Error in fetch process:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch data',
      })
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-2">Campaign Data Settings</h1>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
          {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleString()}`}
        </p>
        <p className="text-sm text-muted-foreground">
          Data automatically refreshes every 24 hours
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Google Sheets Integration</CardTitle>
          <CardDescription>
            Update campaign data from all sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-2">
              <Input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="Enter Google Sheets Web App URL"
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={fetchAllData}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Loading...' : 'Update All Data'}
              </Button>
            </div>
            {isLoading && (
              <Progress value={progress} className="w-full" />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(DATA_SOURCES).map(([tab, source]) => (
          <Card key={tab} className="relative">
            {fetchStatus[tab]?.isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {source.title}
                {fetchStatus[tab]?.error ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : fetchStatus[tab]?.rowCount ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : null}
              </CardTitle>
              <CardDescription>{source.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {fetchStatus[tab]?.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{fetchStatus[tab].error}</AlertDescription>
                </Alert>
              ) : fetchStatus[tab]?.rowCount ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {fetchStatus[tab].rowCount.toLocaleString()} rows loaded
                  </p>
                  {fetchStatus[tab].lastUpdated && (
                    <p className="text-xs text-muted-foreground">
                      Updated: {formatTimestamp(fetchStatus[tab].lastUpdated)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading...' : 'No data loaded'}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}