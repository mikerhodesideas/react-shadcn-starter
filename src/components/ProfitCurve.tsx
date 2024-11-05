'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Campaign, type Metrics } from "@/types/metrics"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ProfitCurveProps {
  selectedCampaign: Campaign | null
  setSelectedCampaign: (campaign: Campaign | null) => void
  cost: number
  setCost: (value: number) => void
  convValue: number
  setConvValue: (value: number) => void
  campaigns: Campaign[]
  currentMetrics: Metrics
  profitData: Array<{ spend: number; profit: number; revenue: number }>
  optimalPoint: { x: number; y: number } | null
  optimalZone: { start: number; end: number } | null
  activeChart: string
  setActiveChart: (chart: string) => void
  incrementalData: Array<{ spend: number; cpa: number; cvr: number }>
  cogsPercentage: number
}

export function ProfitCurve({
  selectedCampaign,
  setSelectedCampaign,
  cost,
  setCost,
  convValue,
  setConvValue,
  campaigns,
  currentMetrics,
  profitData,
  optimalPoint,
  optimalZone,
  activeChart,
  setActiveChart,
  incrementalData,
  cogsPercentage
}: ProfitCurveProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Selection & Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedCampaign?.id || ''}
            onValueChange={(value) => {
              const campaign = campaigns.find(c => c.id === value)
              setSelectedCampaign(campaign || null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cost per Click (€)</label>
            <Slider
              value={[cost]}
              onValueChange={(values) => setCost(values[0])}
              min={0}
              max={2}
              step={0.01}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">
              Current: €{cost.toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Conversion Value (€)</label>
            <Slider
              value={[convValue]}
              onValueChange={(values) => setConvValue(values[0])}
              min={0}
              max={200}
              step={1}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">
              Current: €{convValue.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeChart} onValueChange={setActiveChart}>
            <TabsList className="w-full">
              <TabsTrigger value="profit">Profit Curve</TabsTrigger>
              <TabsTrigger value="incremental">Incremental Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profit" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="spend" 
                    label={{ value: 'Daily Spend (€)', position: 'bottom' }}
                  />
                  <YAxis 
                    label={{ value: 'Profit (€)', angle: -90, position: 'left' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#2563eb" 
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#16a34a" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="incremental" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incrementalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="spend" 
                    label={{ value: 'Daily Spend (€)', position: 'bottom' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    label={{ value: 'CPA (€)', angle: -90, position: 'left' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'CVR (%)', angle: 90, position: 'right' }}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="cpa" 
                    stroke="#2563eb" 
                    yAxisId="left"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cvr" 
                    stroke="#16a34a" 
                    yAxisId="right"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>

          {optimalPoint && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-900">Optimal Point</h4>
              <p className="text-sm text-blue-700">
                Optimal daily spend: €{optimalPoint.x.toFixed(2)} for maximum profit of €{optimalPoint.y.toFixed(2)}
              </p>
              {optimalZone && (
                <p className="text-sm text-blue-700 mt-1">
                  Profitable zone: €{optimalZone.start.toFixed(2)} - €{optimalZone.end.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 