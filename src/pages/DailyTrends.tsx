import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import Papa from 'papaparse'

interface DailyData {
  Date: string
  Campaign: string
  Cost: number
  Clicks: number
  Impressions: number
  Conversions: number
  ConvValue: number
}

interface Metric {
  key: keyof Omit<DailyData, 'Date' | 'Campaign'>
  label: string
  format: (value: number) => string
  color: string
}

const metrics: Metric[] = [
  { 
    key: 'Cost', 
    label: 'Cost', 
    format: (v) => `$${Math.round(v).toLocaleString()}`,
    color: '#0ea5e9' // sky-500
  },
  { 
    key: 'Clicks', 
    label: 'Clicks', 
    format: (v) => Math.round(v).toLocaleString(),
    color: '#22c55e' // green-500
  },
  { 
    key: 'Impressions', 
    label: 'Impressions', 
    format: (v) => Math.round(v).toLocaleString(),
    color: '#f97316' // orange-500
  },
  { 
    key: 'Conversions', 
    label: 'Conversions', 
    format: (v) => Math.round(v).toLocaleString(),
    color: '#8b5cf6' // violet-500
  },
  { 
    key: 'ConvValue', 
    label: 'Conv. Value', 
    format: (v) => `$${Math.round(v).toLocaleString()}`,
    color: '#ef4444' // red-500
  }
]

export default function DailyTrends() {
  const [data, setData] = useState<DailyData[]>([])
  const [campaigns, setCampaigns] = useState<string[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [selectedMetrics, setSelectedMetrics] = useState<Metric['key'][]>([])
  const [error, setError] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/daily.csv')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const csvText = await response.text()
        const result = Papa.parse<DailyData>(csvText, {
          header: true,
          transform: (value: string) => {
            if (!isNaN(Number(value))) return Number(value)
            return value
          }
        })

        const validData = result.data.filter(row => 
          row.Date && row.Campaign && !isNaN(row.Cost)
        )

        setData(validData)
        
        // Get unique campaigns
        const uniqueCampaigns = Array.from(new Set(validData.map(row => row.Campaign)))
        setCampaigns(uniqueCampaigns)
        
        // Set first campaign as default
        if (uniqueCampaigns.length > 0) {
          setSelectedCampaign(uniqueCampaigns[0])
        }

      } catch (err) {
        console.error('Error loading data:', err)
        setError(`Error loading data: ${err}`)
      }
    }

    loadData()
  }, [])

  // Filter data for selected campaign
  const filteredData = useMemo(() => {
    if (!selectedCampaign) return []
    return data.filter(row => row.Campaign === selectedCampaign)
  }, [data, selectedCampaign])

  // Calculate totals for scorecards
  const totals = useMemo(() => {
    return metrics.reduce((acc, metric) => {
      acc[metric.key] = filteredData.reduce((sum, row) => sum + row[metric.key], 0)
      return acc
    }, {} as Record<Metric['key'], number>)
  }, [filteredData])

  const toggleMetric = (metric: Metric['key']) => {
    setSelectedMetrics(current => {
      if (current.includes(metric)) {
        return current.filter(m => m !== metric)
      }
      if (current.length < 2) {
        return [...current, metric]
      }
      return [current[1], metric] // Remove oldest, add new
    })
  }

  return (
    <div className="space-y-6">
      {/* Campaign Selector */}
      <Card>
        <CardContent className="pt-6">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger>
              <SelectValue placeholder="Select a campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map(campaign => (
                <SelectItem key={campaign} value={campaign}>
                  {campaign}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Metric Scorecards */}
      <div className="grid grid-cols-5 gap-4">
        {metrics.map(metric => (
          <Card 
            key={metric.key}
            className={`cursor-pointer transition-colors ${
              selectedMetrics.includes(metric.key) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => toggleMetric(metric.key)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.format(totals[metric.key])}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <XAxis 
                  dataKey="Date" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                
                {/* Left Y-Axis */}
                {selectedMetrics[0] && (
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => {
                      const metric = metrics.find(m => m.key === selectedMetrics[0])
                      return metric?.format(value) || value
                    }}
                  />
                )}
                
                {/* Right Y-Axis */}
                {selectedMetrics[1] && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => {
                      const metric = metrics.find(m => m.key === selectedMetrics[1])
                      return metric?.format(value) || value
                    }}
                  />
                )}
                
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const metric = metrics.find(m => m.key === name)
                    return [metric?.format(value) || value, metric?.label || name]
                  }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                
                <Legend />
                
                {selectedMetrics.map((metricKey, index) => {
                  const metric = metrics.find(m => m.key === metricKey)
                  if (!metric) return null
                  
                  return (
                    <Line
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      yAxisId={index === 0 ? "left" : "right"}
                      name={metric.label}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 