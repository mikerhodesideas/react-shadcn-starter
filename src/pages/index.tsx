'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { useToast } from "@/components/ui/use-toast"
import { GOOGLE_SHEET_URL } from "@/lib/constants"
import { DataService } from "@/services/data-service"
import { Loader2 } from "lucide-react"
import { type SheetData } from "@/types/metrics"

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false)
  const [sheetUrl, setSheetUrl] = useState(GOOGLE_SHEET_URL)
  const [data, setData] = useState<SheetData[]>([])
  const { toast } = useToast()

  const fetchSheetData = async () => {
    console.log("Fetching data from:", sheetUrl)
    
    if (!sheetUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a Google Sheets Web App URL",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(sheetUrl)
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const jsonData = await response.json()
      console.log("Raw data received:", jsonData)
      
      // Validate and transform data
      if (!Array.isArray(jsonData)) {
        throw new Error('Invalid data format: Expected an array')
      }

      // Store data in localStorage with timestamp
      const storageData = {
        timestamp: new Date().toISOString(),
        data: jsonData
      }
      localStorage.setItem('campaignData', JSON.stringify(storageData))
      console.log("Data stored in localStorage")

      setData(jsonData)
      toast({
        title: "Success",
        description: `Loaded ${jsonData.length} rows of data`,
      })

      // Log sample data for debugging
      console.log("Sample data (first 3 rows):", jsonData.slice(0, 3))
      console.log("Data structure of first row:", Object.keys(jsonData[0]))
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: error instanceof Error ? error.message : "Failed to fetch data",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check for cached data on component mount
  useEffect(() => {
    const cachedData = localStorage.getItem('campaignData')
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData)
      const cacheAge = new Date().getTime() - new Date(timestamp).getTime()
      const cacheAgeHours = cacheAge / (1000 * 60 * 60)
      
      console.log("Found cached data from:", timestamp)
      console.log("Cache age (hours):", cacheAgeHours)

      // Use cached data if less than 24 hours old
      if (cacheAgeHours < 24) {
        console.log("Using cached data")
        setData(data)
      } else {
        console.log("Cache expired, will need to fetch fresh data")
        localStorage.removeItem('campaignData')
      }
    }
  }, [])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Campaign Data Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Integration</CardTitle>
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
                onClick={fetchSheetData}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Loading...' : 'Fetch Data'}
              </Button>
            </div>

            {data.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Preview (First 3 Rows):</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(data[0]).map((header) => (
                          <th
                            key={header}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.slice(0, 3).map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                              {value?.toString()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total rows loaded: {data.length}</p>
              <p>Last updated: {new Date().toLocaleString()}</p>
              <p>Available metrics: {Object.keys(data[0]).join(', ')}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 