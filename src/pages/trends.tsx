// src/pages/trends.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { useCampaignData } from "@/contexts/campaign-data"
import type { DailyData } from '@/types/metrics'

interface Metric {
  key: keyof Pick<DailyData, 'Impressions' | 'Clicks' | 'Cost' | 'Conversions' | 'ConvValue'>
  label: string
  format: (value: number) => string
  color: string
}

const metrics: Metric[] = [
  { 
    key: 'Impressions', 
    label: 'Impressions', 
    format: (v) => `${v.toFixed(0)}`,
    color: '#f97316'
  },
  { 
    key: 'Clicks', 
    label: 'Clicks', 
    format: (v) => `${v.toFixed(0)}`,
    color: '#22c55e'
  },
  { 
    key: 'Cost', 
    label: 'Cost', 
    format: (v) => `${v.toFixed(0)}`,
    color: '#0ea5e9'
  },
  { 
    key: 'Conversions', 
    label: 'Conversions', 
    format: (v) => v.toFixed(1),
    color: '#8b5cf6'
  },
  { 
    key: 'ConvValue', 
    label: 'Value', 
    format: (v) => `${v.toFixed(0)}`,
    color: '#ef4444'
  }
]

export default function Trends() {
  const { dailyData, isLoading, error } = useCampaignData()
  console.log('Daily data:', dailyData)

  // Early returns for data issues
  if (isLoading) {
    return <div>Loading campaign data...</div>
  }

  if (error) {
    return <div>Error loading data: {error}</div>
  }

  if (!dailyData?.length) {
    return <div>No daily data available. Please load data in Settings.</div>
  }

  // State declarations
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [selectedMetrics, setSelectedMetrics] = useState<Metric['key'][]>([])

  // Get unique campaigns
  const campaigns = useMemo(() => {
    return dailyData?.length ? Array.from(new Set(dailyData.map(row => row.Campaign))) : []
  }, [dailyData])

  // Set first campaign as default when data loads
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0])
    }
  }, [campaigns, selectedCampaign])

  // Filter and format data
  const filteredData = useMemo(() => {
    if (!selectedCampaign) return []
    
    return dailyData
      .filter(row => row.Campaign === selectedCampaign)
      .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
  }, [dailyData, selectedCampaign])

  // Calculate totals for scorecards
  const totals = useMemo(() => {
    return metrics.reduce((acc, metric) => {
      acc[metric.key] = filteredData.reduce((sum, row) => sum + (row[metric.key] || 0), 0)
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
      {/* Debug info */}
      <div className="text-sm text-muted-foreground">
          Dates available: {Array.from(new Set(filteredData.map(d => d.date))).join(', ')}
      </div>
        
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
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    const day = date.getDate()
                    const month = date.toLocaleString('en-US', { month: 'short' })
                    return `${day} ${month}`
                  }}
                />
                
                {selectedMetrics[0] && (
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => {
                      const metric = metrics.find(m => m.key === selectedMetrics[0])
                      return metric?.format(value) || value
                    }}
                    label={{ 
                      value: metrics.find(m => m.key === selectedMetrics[0])?.label,
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                )}
                
                {selectedMetrics[1] && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => {
                      const metric = metrics.find(m => m.key === selectedMetrics[1])
                      return metric?.format(value) || value
                    }}
                    label={{ 
                      value: metrics.find(m => m.key === selectedMetrics[1])?.label,
                      angle: 90,
                      position: 'insideRight',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                )}
                
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const metric = metrics.find(m => m.key === name)
                    return [metric?.format(value) || value, metric?.label || name]
                  }}
                  labelFormatter={(label) => {
                    const date = new Date(label)
                    return date.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  }}
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
                      dot={false}
                      activeDot={false}
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