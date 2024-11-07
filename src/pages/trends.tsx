// src/pages/trends.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { subDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { useCampaignData } from "@/contexts/campaign-data"
import { DailyData } from '@/types/metrics'

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
    format: (v) => v.toLocaleString(),
    color: '#f97316'
  },
  { 
    key: 'Clicks',
    label: 'Clicks',
    format: (v) => v.toLocaleString(),
    color: '#22c55e'
  },
  { 
    key: 'Cost',
    label: 'Cost',
    format: (v) => `$${v.toLocaleString()}`,
    color: '#0ea5e9'
  },
  { 
    key: 'Conversions',
    label: 'Conversions',
    format: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 }),
    color: '#8b5cf6'
  },
  { 
    key: 'ConvValue',
    label: 'Value',
    format: (v) => `$${v.toLocaleString()}`,
    color: '#ef4444'
  }
]

export default function TrendsPage() {
  const { data, isLoading, error } = useCampaignData()
  const dailyData = data?.daily || []
  
  // States
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [selectedMetrics, setSelectedMetrics] = useState<Metric['key'][]>([])
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  // Handle loading and error states
  if (isLoading) {
    return <div className="p-6">Loading campaign data...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading data: {error}</div>
  }

  if (!dailyData?.length) {
    return <div className="p-6">No data available. Please check Settings to load data.</div>
  }

  // Get unique campaigns
  const campaigns = useMemo(() => {
    return Array.from(new Set(dailyData.map((row: DailyData) => row.Campaign)))
  }, [dailyData])

  // Set default campaign
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0] as string)
    }
  }, [campaigns, selectedCampaign])

  // Filter data based on selection
  const filteredData = useMemo(() => {
    if (!selectedCampaign || !dateRange?.from || !dateRange?.to) return []
    
    return dailyData
      .filter((row: DailyData) => {
        const rowDate = new Date(row.Date)
        if (!(dateRange.from instanceof Date) || !(dateRange.to instanceof Date)) return false
        return row.Campaign === selectedCampaign && 
               rowDate >= dateRange.from && 
               rowDate <= dateRange.to
      })
      .sort((a: DailyData, b: DailyData) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
  }, [dailyData, selectedCampaign, dateRange])

  // Calculate date range summary
  const dateRangeSummary = useMemo(() => {
    if (!filteredData.length) return 'No dates available'
    
    const dates = filteredData.map((d: DailyData) => new Date(d.Date))
    const startDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
    const endDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())))
    
    return `Showing data from ${startDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })} to ${endDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}`
  }, [filteredData])

  // Calculate totals
  const totals = useMemo(() => {
    return metrics.reduce((acc, metric) => {
      acc[metric.key] = filteredData.reduce((sum: number, row: DailyData) => sum + (row[metric.key] || 0), 0)
      return acc
    }, {} as Record<Metric['key'], number>)
  }, [filteredData])

  const toggleMetric = (metricKey: Metric['key']) => {
    setSelectedMetrics(current => {
      if (current.includes(metricKey)) {
        return current.filter(m => m !== metricKey)
      }
      if (current.length < 2) {
        return [...current, metricKey]
      }
      return [current[1], metricKey] // Remove oldest, add new
    })
  }

 return (
   <div className="space-y-6 p-6">
     {/* Date range summary */}
     <div className="text-sm text-muted-foreground">
       {dateRangeSummary}
     </div>

     {/* Controls */}
     <div className="grid grid-cols-2 gap-4">
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

       <Card>
         <CardContent className="pt-6">
           <DateRangePicker
             value={dateRange}
             onChange={(date: DateRange) => setDateRange(date)}
           />
         </CardContent>
       </Card>
     </div>

     {/* Metric Cards */}
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
               {metric.format(totals[metric.key] || 0)}
             </div>
           </CardContent>
         </Card>
       ))}
     </div>

     {/* Chart */}
     <Card>
       <CardContent className="pt-6">
         <div className="h-96">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={filteredData}>
               <XAxis 
                 dataKey="Date" 
                 angle={-45}
                 textAnchor="end"
                 height={60}
                 tickFormatter={(value) => {
                   const date = new Date(value)
                   return date.toLocaleDateString('en-GB', {
                     day: '2-digit',
                     month: 'short'
                   })
                 }}
               />
               
               {selectedMetrics.map((metricKey, index) => {
                 const metric = metrics.find(m => m.key === metricKey)
                 if (!metric) return null
                 
                 return (
                   <YAxis
                     key={metric.key}
                     yAxisId={index}
                     orientation={index === 0 ? "left" : "right"}
                     tickFormatter={metric.format}
                     label={{ 
                       value: metric.label,
                       angle: index === 0 ? -90 : 90,
                       position: 'insideLeft',
                       style: { textAnchor: 'middle' }
                     }}
                   />
                 )
               })}
               
               <Tooltip
                 formatter={(value: number, name: string) => {
                   const metric = metrics.find(m => m.key === name)
                   return [metric?.format(value) || value, metric?.label || name]
                 }}
                 labelFormatter={(label: string) => new Date(label).toLocaleDateString('en-GB', {
                   day: '2-digit',
                   month: 'short',
                   year: 'numeric'
                 })}
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
                     yAxisId={index}
                     name={metric.label}
                     dot={false}
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