// src/pages/analysis.tsx
"use client"

import { useState, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { useCampaignData } from "@/contexts/campaign-data"
import { BudgetOptimization } from '@/components/budget-optimization/budget-optimization'

interface PerformanceMetric {
  label: string;
  value: string | number;
  change: number;
  inverse?: boolean;
}

export default function Analysis() {
  const { data, isLoading, error } = useCampaignData()

  // State management
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '7d'>('30d')
  const [cogsPercentage, setCogsPercentage] = useState(50)
  const [includeFilter, setIncludeFilter] = useState('')
  const [excludeFilter, setExcludeFilter] = useState('')
  const [rowLimit, setRowLimit] = useState(10)

  // Extract data arrays with fallbacks
  const dataArrays = useMemo(() => ({
    thirtyDayData: Array.isArray(data?.thirty_days) ? data.thirty_days : [],
    previousThirtyDays: Array.isArray(data?.previous_thirty_days) ? data.previous_thirty_days : [],
    sevenDayData: Array.isArray(data?.seven_days) ? data.seven_days : [],
    previousSevenDays: Array.isArray(data?.previous_seven_days) ? data.previous_seven_days : []
  }), [data])

  // Calculate campaigns with proper dependencies
  const campaigns = useMemo(() => {
    if (!data) return []

    const campaignMap = new Map()
    const currentData = selectedPeriod === '30d' ? dataArrays.thirtyDayData : dataArrays.sevenDayData
    const previousData = selectedPeriod === '30d' ? dataArrays.previousThirtyDays : dataArrays.previousSevenDays

    // Process current data
    currentData.forEach(row => {
      if (!row?.Campaign) return

      if (!campaignMap.has(row.Campaign)) {
        campaignMap.set(row.Campaign, {
          Campaign: row.Campaign,
          Cost: row.Cost || 0,
          ConvValue: row.ConvValue || 0,
          Clicks: row.Clicks || 0,
          Conversions: row.Conversions || 0,
          ImprShare: row.ImprShare || 0,
          LostToBudget: row.LostToBudget || 0,
          LostToRank: row.LostToRank || 0,
          Impressions: row.Impressions || 0,
          PreviousCost: 0,
          PreviousConvValue: 0,
          PreviousConversions: 0
        })
      } else {
        const campaign = campaignMap.get(row.Campaign)
        campaign.Cost += row.Cost || 0
        campaign.ConvValue += row.ConvValue || 0
        campaign.Clicks += row.Clicks || 0
        campaign.Conversions += row.Conversions || 0
        campaign.Impressions += row.Impressions || 0
        campaign.ImprShare = row.ImprShare || campaign.ImprShare
        campaign.LostToBudget = row.LostToBudget || campaign.LostToBudget
        campaign.LostToRank = row.LostToRank || campaign.LostToRank
      }
    })

    // Process previous data and calculate changes
    previousData.forEach(row => {
      if (!row?.Campaign || !campaignMap.has(row.Campaign)) return
      const campaign = campaignMap.get(row.Campaign)
      campaign.PreviousCost = row.Cost || 0
      campaign.PreviousConvValue = row.ConvValue || 0
      campaign.PreviousConversions = row.Conversions || 0
    })

    return Array.from(campaignMap.values())
  }, [selectedPeriod, dataArrays])

// Performance metrics calculation
  const performanceMetrics = useMemo(() => {
    const currentData = selectedPeriod === '30d' ? dataArrays.thirtyDayData : dataArrays.sevenDayData
    const previousData = selectedPeriod === '30d' ? dataArrays.previousThirtyDays : dataArrays.previousSevenDays

    const calculate = (data: any[]) => data.reduce((acc, row) => ({
      cost: acc.cost + (row.Cost || 0),
      revenue: acc.revenue + (row.ConvValue || 0),
      conversions: acc.conversions + (row.Conversions || 0),
      clicks: acc.clicks + (row.Clicks || 0)
    }), { cost: 0, revenue: 0, conversions: 0, clicks: 0 })

    const current = calculate(currentData)
    const previous = calculate(previousData)

    const getChange = (curr: number, prev: number) =>
      prev ? ((curr - prev) / prev * 100) : 0

    const profit = current.revenue * (1 - cogsPercentage / 100) - current.cost
    const previousProfit = previous.revenue * (1 - cogsPercentage / 100) - previous.cost

    return [
      {
        label: "Total Cost",
        value: Math.round(current.cost).toLocaleString(),
        change: getChange(current.cost, previous.cost),
        inverse: true
      },
      {
        label: "Total Revenue",
        value: Math.round(current.revenue).toLocaleString(),
        change: getChange(current.revenue, previous.revenue)
      },
      {
        label: "Total Profit",
        value: Math.round(profit).toLocaleString(),
        change: getChange(profit, previousProfit)
      },
      {
        label: "Avg CPA",
        value: (current.cost / current.conversions).toFixed(2),
        change: getChange(
          current.cost / current.conversions,
          previous.cost / previous.conversions
        ),
        inverse: true
      },
      {
        label: "Conv Rate",
        value: `${(current.conversions / current.clicks * 100).toFixed(1)}%`,
        change: getChange(
          current.conversions / current.clicks,
          previous.conversions / previous.clicks
        )
      },
      {
        label: "ROAS",
        value: `${(current.revenue / current.cost).toFixed(1)}x`,
        change: getChange(
          current.revenue / current.cost,
          previous.revenue / previous.cost
        )
      }
    ]
  }, [selectedPeriod, dataArrays, cogsPercentage])

  // Early returns
  if (!data && isLoading) return <div>Loading campaign data...</div>
  if (error) return <div>Error loading data: {error}</div>
  if (!dataArrays.thirtyDayData?.length && !dataArrays.sevenDayData?.length) {
    return <div>No campaign data available. Please load data in Settings.</div>
  }

  return (
    <>
      {/* Performance Overview Card */}
      <Card className="w-full max-w-[1800px] mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle>Overall Performance</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Metrics compared to previous {selectedPeriod === '30d' ? '30' : '7'} day period</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-3">
            {performanceMetrics.map(({ label, value, change, inverse }) => (
              <div key={label} className="col-span-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xl font-bold">{value}</p>
                <div className="text-xs">
                  <span className={change > 0 === !inverse ? 'text-green-500' : 'text-red-500'}>
                    {change > 0 ? '↑' : '↓'} {Math.abs(Math.round(change))}%
                  </span>
                </div>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-sm font-medium mb-1">COGS %</p>
              <div className="flex items-center gap-2">
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[cogsPercentage]}
                  onValueChange={(value) => setCogsPercentage(value[0])}
                  className="flex-grow"
                />
                <span className="text-xl font-bold w-16 text-right">{cogsPercentage}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <div className="my-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium whitespace-nowrap">Include:</span>
            <input
              type="text"
              value={includeFilter}
              onChange={(e) => setIncludeFilter(e.target.value)}
              placeholder="Filter campaigns..."
              className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium whitespace-nowrap">Exclude:</span>
            <input
              type="text"
              value={excludeFilter}
              onChange={(e) => setExcludeFilter(e.target.value)}
              placeholder="Exclude campaigns..."
              className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <Select value={rowLimit.toString()} onValueChange={(value) => setRowLimit(Number(value))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Show rows" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50, 100].map(value => (
                <SelectItem key={value} value={value.toString()}>{value} rows</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs and Budget Optimization */}
      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Campaign Summary</TabsTrigger>
          <TabsTrigger value="projections">Budget Optimization</TabsTrigger>
        </TabsList>

        {/* Add this inside the Tabs component in analysis.tsx, after the TabsList */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-foreground">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left">Campaign</th>
                      <th className="px-4 py-2 text-left">Cost</th>
                      <th className="px-4 py-2 text-left">Revenue</th>
                      <th className="px-4 py-2 text-left">Profit</th>
                      <th className="px-4 py-2 text-left">ROAS</th>
                      <th className="px-4 py-2 text-left">Impression Share</th>
                      <th className="px-4 py-2 text-left">Lost to Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns
                      .filter(campaign => {
                        const name = campaign.Campaign?.toLowerCase() || '';
                        const include = includeFilter?.toLowerCase() || '';
                        const exclude = excludeFilter?.toLowerCase() || '';
                        
                        if (include && !name.includes(include)) return false;
                        if (exclude && name.includes(exclude)) return false;
                        return true;
                      })
                      .slice(0, rowLimit)
                      .map(campaign => {
                        const revenue = campaign.ConvValue;
                        const cost = campaign.Cost;
                        const grossRevenue = revenue * (1 - cogsPercentage / 100);
                        const profit = grossRevenue - cost;
                        const roas = cost > 0 ? revenue / cost : 0;
                        const impressionShare = campaign.ImprShare * 100;
                        const lostToBudget = campaign.LostToBudget * 100;

                        return (
                          <tr key={campaign.Campaign} className="border-b border-border hover:bg-muted/50">
                            <td className="px-4 py-2">{campaign.Campaign}</td>
                            <td className="px-4 py-2">${Math.round(cost).toLocaleString()}</td>
                            <td className="px-4 py-2">${Math.round(revenue).toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <span className={profit < 0 ? 'text-red-500' : 'text-green-500'}>
                                ${Math.round(profit).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-2">{roas.toFixed(1)}x</td>
                            <td className="px-4 py-2">{impressionShare.toFixed(1)}%</td>
                            <td className="px-4 py-2">{lostToBudget.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections">
          <BudgetOptimization
            campaigns={campaigns}
            cogsPercentage={cogsPercentage}
            includeFilter={includeFilter}
            excludeFilter={excludeFilter}
            rowLimit={rowLimit}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}