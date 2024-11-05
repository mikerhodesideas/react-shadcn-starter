'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useCampaignData } from "@/contexts/campaign-data"

interface Metric {
  key: 'impr' | 'clicks' | 'cost' | 'conv' | 'value'
  label: string
  format: (value: number) => string
  color: string
}

const metrics: Metric[] = [
  { 
    key: 'impr', 
    label: 'Impressions', 
    format: (v) => Math.round(v).toLocaleString(),
    color: '#f97316'
  },
  { 
    key: 'clicks', 
    label: 'Clicks', 
    format: (v) => Math.round(v).toLocaleString(),
    color: '#22c55e'
  },
  { 
    key: 'cost', 
    label: 'Cost', 
    format: (v) => `€${v.toFixed(2)}`,
    color: '#0ea5e9'
  },
  { 
    key: 'conv', 
    label: 'Conversions', 
    format: (v) => v.toFixed(1),
    color: '#8b5cf6'
  },
  { 
    key: 'value', 
    label: 'Value', 
    format: (v) => `€${v.toFixed(2)}`,
    color: '#ef4444'
  }
]

export default function DailyTrends() {
  const { dailyData, isLoading, error } = useCampaignData()
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [selectedMetrics, setSelectedMetrics] = useState<Metric['key'][]>([])

  // Get unique campaigns
  const campaigns = useMemo(() => {
    return Array.from(new Set(dailyData.map(row => row.campaign)))
  }, [dailyData])

  // Set first campaign as default when data loads
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0])
    }
  }, [campaigns, selectedCampaign])

  // Filter data for selected campaign
  const filteredData = useMemo(() => {
    if (!selectedCampaign) return []
    return dailyData.filter(row => row.campaign === selectedCampaign)
  }, [dailyData, selectedCampaign])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

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