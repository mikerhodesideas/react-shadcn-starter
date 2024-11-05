'use client'

import { useCampaignData } from "@/contexts/campaign-data"
import { useState, useEffect, useMemo } from 'react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts'
import { ChartThumbnail } from "@/components/chart-thumbnail"

type ChartType = 'profit-curve' | 'incremental-profit' | 'profit-vs-roas' | 'marginal-roas';

export default function ProfitAnalysis() {
  const { thirtyDayData: data, isLoading, error } = useCampaignData()
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [cost, setCost] = useState(0)
  const [convValue, setConvValue] = useState(0)
  const [cogsPercentage, setCogsPercentage] = useState(50)
  const [activeChart, setActiveChart] = useState<ChartType>('profit-curve')

  // Get unique campaigns and their metrics
  const campaigns = useMemo(() => {
    if (!data.length) return []
    
    const campaignMap = new Map()
    data.forEach(row => {
      if (!campaignMap.has(row.campaign)) {
        campaignMap.set(row.campaign, {
          Campaign: row.campaign,
          Cost: 0,
          ConvValue: 0,
          Clicks: 0,
          Conversions: 0,
          ImprShare: 0,
          LostToBudget: 0,
          LostToRank: 0,
          Impressions: 0
        })
      }
      
      const campaign = campaignMap.get(row.campaign)
      campaign.Cost += row.cost
      campaign.ConvValue += row.value
      campaign.Clicks += row.clicks
      campaign.Conversions += row.conv
      campaign.Impressions += row.impr
    })

    return Array.from(campaignMap.values())
  }, [data])

  // Set initial campaign when data loads
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0].Campaign)
      setCost(campaigns[0].Cost)
      setConvValue(campaigns[0].ConvValue)
    }
  }, [campaigns, selectedCampaign])

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

  // Calculate current metrics
  const currentMetrics = useMemo(() => {
    const selectedCampaignData = campaigns.find(c => c.Campaign === selectedCampaign);
    if (!selectedCampaignData) return {
      revenue: 0, cost: 0, profit: 0, cpa: 0, convRate: 0, roas: 0
    };

    const profit = convValue - cost - (convValue * cogsPercentage / 100);
    const cpa = cost / selectedCampaignData.Conversions;
    const convRate = (selectedCampaignData.Conversions / selectedCampaignData.Clicks) * 100;
    const roas = convValue / cost;

    return { revenue: convValue, cost, profit, cpa, convRate, roas };
  }, [campaigns, selectedCampaign, cost, convValue, cogsPercentage]);

  // Calculate profit data
  const profitData = useMemo(() => {
    const data = [];
    const numPoints = 100;
    const maxCost = cost * 3;
    const minCost = cost * 0.1;
    const step = (maxCost - minCost) / (numPoints - 1);

    const campaign = campaigns.find(c => c.Campaign === selectedCampaign);
    if (!campaign) return [];

    const currentIS = campaign.ImprShare;
    const lostToBudget = campaign.LostToBudget;
    const lostToRank = campaign.LostToRank;
    
    // Calculate spend needed to capture IS lost to budget
    const spendForBudgetIS = campaign.Cost * (1 + lostToBudget / currentIS);
    
    // Calculate max possible spend (at 90% IS)
    const maxSpend = campaign.Cost * (0.9 / currentIS);
    
    const baseROAS = convValue / cost;
    const baseAOV = convValue / campaign.Conversions;

    for (let i = 0; i < numPoints; i++) {
      const currentCost = minCost + i * step;
      let scaleFactor;

      // Different scaling based on where we are in the spend range
      if (currentCost <= campaign.Cost) {
        // Below current spend - use 0.4 exponent
        scaleFactor = Math.pow(currentCost / campaign.Cost, 0.4);
      } else if (currentCost <= spendForBudgetIS) {
        // Between current spend and budget-limited spend - linear scaling
        const baseScale = 1; // Current performance
        const extraSpend = currentCost - campaign.Cost;
        const extraScale = (extraSpend / (spendForBudgetIS - campaign.Cost)) * (lostToBudget / currentIS);
        scaleFactor = baseScale + extraScale;
      } else {
        // Above budget-limited spend - use 0.4 exponent for additional spend
        const budgetLimitedScale = 1 + (lostToBudget / currentIS);
        const rankLimitedSpend = currentCost - spendForBudgetIS;
        const maxRankLimitedSpend = maxSpend - spendForBudgetIS;
        const extraScale = Math.pow(rankLimitedSpend / maxRankLimitedSpend, 0.25) * (lostToRank / currentIS);
        scaleFactor = budgetLimitedScale + extraScale;
      }

      // Calculate metrics
      const currentSales = campaign.Conversions * scaleFactor;
      const currentConvValue = currentSales * baseAOV;
      const currentROAS = currentConvValue / currentCost;
      
      // Calculate profit using COGS
      const grossProfit = currentConvValue * (1 - cogsPercentage / 100);
      const currentProfit = grossProfit - currentCost;

      // Calculate marginal metrics
      let marginalROAS = currentROAS;
      if (i > 0) {
        const prevData = data[i - 1];
        const additionalCost = currentCost - prevData.cost;
        const additionalConvValue = currentConvValue - prevData.convValue;
        marginalROAS = additionalConvValue / additionalCost;
      }

      data.push({
        cost: currentCost,
        sales: currentSales,
        convValue: currentConvValue,
        roas: currentROAS,
        profit: currentProfit,
        marginalROAS,
        aov: baseAOV
      });
    }

    return data;
  }, [campaigns, selectedCampaign, cost, convValue, cogsPercentage]);

  // Calculate incremental data
  const incrementalData = useMemo(() => {
    return profitData.slice(1).map((point, i) => ({
      cost: point.cost,
      incrementalProfit: point.profit - profitData[i].profit,
      incrementalSales: point.sales - profitData[i].sales,
      incrementalROAS: point.marginalROAS
    }));
  }, [profitData]);

  // Calculate optimal zone
  const [optimalZone, setOptimalZone] = useState({
    start: 0,
    end: 0,
    current: 0,
    maxProfit: 0
  });

  useEffect(() => {
    if (profitData.length > 0) {
      const maxProfitPoint = profitData.reduce((max, point) => 
        point.profit > max.profit ? point : max, profitData[0]
      );

      const profitThreshold = maxProfitPoint.profit * 0.95;
      const profitRange = profitData.filter(point => point.profit >= profitThreshold);

      setOptimalZone({
        start: Math.min(...profitRange.map(p => p.cost)),
        end: Math.max(...profitRange.map(p => p.cost)),
        current: cost,
        maxProfit: maxProfitPoint.profit
      });
    }
  }, [profitData, cost]);

  // Render active chart
  const renderActiveChart = (): React.ReactElement => {
    switch (activeChart) {
      case 'profit-curve': {
        const campaign = campaigns.find(c => c.Campaign === selectedCampaign);
        if (!campaign) {
          return <div className="flex items-center justify-center h-full">Select a campaign</div>;
        }

        const currentIS = campaign.ImprShare;
        const lostToBudget = campaign.LostToBudget;
        const spendForBudgetIS = campaign.Cost * (1 + lostToBudget / currentIS);
        const maxSpend = campaign.Cost * (0.9 / currentIS);

        return (
          <LineChart 
            data={profitData}
            margin={{ top: 20, right: 30, bottom: 5, left: 20 }}
            className="text-foreground"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="currentColor" 
              opacity={0.1} 
            />
            <XAxis 
              dataKey="cost" 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
              stroke="currentColor"
            />
            <YAxis 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
              stroke="currentColor"
            />
            <Tooltip 
              formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Profit']}
              labelFormatter={(label: number) => `Cost: $${Math.round(label).toLocaleString()}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            
            <ReferenceArea
              x1={optimalZone.start}
              x2={optimalZone.end}
              fill="#22c55e"
              fillOpacity={0.1}
            />
            
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#8884d8" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        );
      }
      case 'incremental-profit':
        return (
          <LineChart 
            data={incrementalData}
            margin={{ top: 20, right: 30, bottom: 5, left: 20 }}
            className="text-foreground"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="currentColor" 
              opacity={0.1} 
            />
            <XAxis 
              dataKey="cost" 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
              stroke="currentColor"
            />
            <YAxis 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
              stroke="currentColor"
            />
            <Tooltip 
              formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Profit']}
              labelFormatter={(label: number) => `Cost: $${Math.round(label).toLocaleString()}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            
            <ReferenceArea
              x1={optimalZone.start}
              x2={optimalZone.end}
              fill="#22c55e"
              fillOpacity={0.1}
            />
            
            <Line 
              type="monotone" 
              dataKey="incrementalProfit" 
              stroke="#22c55e" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        );
      case 'profit-vs-roas':
        return (
          <LineChart 
            data={profitData}
            margin={{ top: 20, right: 30, bottom: 5, left: 20 }}
            className="text-foreground"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="currentColor" 
              opacity={0.1} 
            />
            <XAxis 
              dataKey="cost" 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
              stroke="currentColor"
            />
            <YAxis 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
              stroke="currentColor"
            />
            <Tooltip 
              formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Profit']}
              labelFormatter={(label: number) => `Cost: $${Math.round(label).toLocaleString()}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            
            <ReferenceArea
              x1={optimalZone.start}
              x2={optimalZone.end}
              fill="#22c55e"
              fillOpacity={0.1}
            />
            
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#8b5cf6" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        );
      case 'marginal-roas':
        return (
          <LineChart 
            data={profitData}
            margin={{ top: 20, right: 30, bottom: 5, left: 20 }}
            className="text-foreground"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="currentColor" 
              opacity={0.1} 
            />
            <XAxis 
              dataKey="cost" 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
              stroke="currentColor"
            />
            <YAxis 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
              stroke="currentColor"
            />
            <Tooltip 
              formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Profit']}
              labelFormatter={(label: number) => `Cost: $${Math.round(label).toLocaleString()}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            
            <ReferenceArea
              x1={optimalZone.start}
              x2={optimalZone.end}
              fill="#22c55e"
              fillOpacity={0.1}
            />
            
            <Line 
              type="monotone" 
              dataKey="marginalROAS" 
              stroke="#ef4444" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        );
      default:
        return <div>Select a chart type</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-5">
        {/* Left Column - 30% width */}
        <div className="w-[30%] space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.Campaign} value={campaign.Campaign}>
                      {campaign.Campaign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                min={0}
                max={Math.max(...campaigns.map(c => c.Cost)) * 1.5}
                step={100}
                value={[cost]}
                onValueChange={(value) => setCost(value[0])}
              />
              <p className="text-center mt-2">${Math.round(cost).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                min={0}
                max={Math.max(...campaigns.map(c => c.ConvValue)) * 1.5}
                step={100}
                value={[convValue]}
                onValueChange={(value) => setConvValue(value[0])}
              />
              <p className="text-center mt-2">${Math.round(convValue).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 65% width */}
        <Card className="w-[65%]">
          <CardHeader>
            <CardTitle>
              {activeChart === 'profit-curve' && 'Profit Curve'}
              {activeChart === 'incremental-profit' && 'Incremental Profit'}
              {activeChart === 'profit-vs-roas' && 'Profit vs ROAS'}
              {activeChart === 'marginal-roas' && 'Marginal ROAS'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {profitData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {renderActiveChart()}
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  Loading data...
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <ChartThumbnail
                title="Profit Curve"
                isActive={activeChart === 'profit-curve'}
                onClick={() => setActiveChart('profit-curve')}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitData}>
                    <Line type="monotone" dataKey="profit" stroke="#8884d8" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartThumbnail>
              <ChartThumbnail
                title="Incremental Profit"
                isActive={activeChart === 'incremental-profit'}
                onClick={() => setActiveChart('incremental-profit')}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={incrementalData}>
                    <Line type="monotone" dataKey="incrementalProfit" stroke="#22c55e" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartThumbnail>
              <ChartThumbnail
                title="Profit vs ROAS"
                isActive={activeChart === 'profit-vs-roas'}
                onClick={() => setActiveChart('profit-vs-roas')}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitData}>
                    <Line type="monotone" dataKey="profit" stroke="#8b5cf6" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartThumbnail>
              <ChartThumbnail
                title="Marginal ROAS"
                isActive={activeChart === 'marginal-roas'}
                onClick={() => setActiveChart('marginal-roas')}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitData}>
                    <Line type="monotone" dataKey="marginalROAS" stroke="#ef4444" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartThumbnail>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>Maximum Profit: ${Math.round(optimalZone.maxProfit).toLocaleString()}</li>
            <li>Optimal Cost: ${Math.round(optimalZone.current).toLocaleString()}</li>
            <li>Optimal ROAS: {(optimalZone.maxProfit / Number(optimalZone.current)).toFixed(1)}x</li>
            <li>Expected Sales: {Math.round(optimalZone.maxProfit / optimalZone.current * optimalZone.current).toLocaleString()}</li>
            <li>Gross Profit: ${Math.round(optimalZone.maxProfit).toLocaleString()}</li>
            <li>COGS: {cogsPercentage}%</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 