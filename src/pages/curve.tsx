// src/pages/curve.tsx

'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Label } from 'recharts';
import { ChartThumbnail } from "@/components/chart-thumbnail";
import { useCampaignData } from "@/contexts/campaign-data";

type ChartType = 'profit-curve' | 'incremental-profit' | 'profit-vs-roas' | 'marginal-roas';

export default function ProfitAnalysis() {
  const { data, isLoading, error } = useCampaignData();
  const thirtyDayData = data?.thirty_days || [];

  if (isLoading) return <div>Loading campaign data...</div>;
  if (error) return <div>Error loading data: {error}</div>;
  if (!thirtyDayData?.length) return <div>No campaign data available. Please load data in Settings.</div>;

  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [cost, setCost] = useState(0);
  const [convValue, setConvValue] = useState(0);
  const [cogsPercentage, setCogsPercentage] = useState(50);
  const [activeChart, setActiveChart] = useState<ChartType>('profit-curve');

  const campaigns = useMemo(() => {
    if (!thirtyDayData?.length) return [];

    const campaignMap = new Map();
    thirtyDayData.forEach(row => {
      if (!row?.Campaign) return;

      if (!campaignMap.has(row.Campaign)) {
        campaignMap.set(row.Campaign, {
          Campaign: row.Campaign,
          Cost: 0,
          ConvValue: 0,
          Clicks: 0,
          Conversions: 0,
          ImprShare: row.ImprShare || 0,
          LostToBudget: row.LostToBudget || 0,
          LostToRank: row.LostToRank || 0,
          Impressions: 0
        });
      }

      const campaign = campaignMap.get(row.Campaign);
      campaign.Cost += row.Cost || 0;
      campaign.ConvValue += row.ConvValue || 0;
      campaign.Clicks += row.Clicks || 0;
      campaign.Conversions += row.Conversions || 0;
      campaign.Impressions += row.Impressions || 0;
    });

    return Array.from(campaignMap.values())
      .filter(campaign => campaign.Cost > 0)
      .sort((a, b) => b.Cost - a.Cost);
  }, [thirtyDayData]);

  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      const firstCampaign = campaigns[0];
      setSelectedCampaign(firstCampaign.Campaign);
      setCost(firstCampaign.Cost);
      setConvValue(firstCampaign.ConvValue);
    }
  }, [campaigns, selectedCampaign]);

  useEffect(() => {
    const selectedCampaignData = campaigns.find(c => c.Campaign === selectedCampaign);
    if (selectedCampaignData) {
      setCost(selectedCampaignData.Cost);
      setConvValue(selectedCampaignData.ConvValue);
    }
  }, [selectedCampaign, campaigns]);

  const profitData = useMemo(() => {
    const data = [];
    const numPoints = 100;
    const campaign = campaigns.find(c => c.Campaign === selectedCampaign);
    if (!campaign) return [];

    const maxCost = cost * 2;      // Extend range to 2x current cost
    const minCost = cost * 0.1;    // Start from 10% of current cost
    const step = (maxCost - minCost) / (numPoints - 1);

    const baseAOV = campaign.Conversions > 0 ? convValue / campaign.Conversions : 0;

    for (let i = 0; i < numPoints; i++) {
      const currentCost = minCost + i * step;

      // handle zero/undefined values
      const salesRatio = cost > 0 ? Math.pow(currentCost / cost, 0.4) : 1;
      const currentSales = campaign.Conversions * salesRatio || 0;
      const currentConvValue = currentSales * (baseAOV || 0);

      const currentROAS = currentCost > 0 ? currentConvValue / currentCost : 0;
      const grossProfit = currentConvValue * (1 - cogsPercentage / 100);
      const currentProfit = grossProfit - currentCost;

      // Calculate marginal ROAS (incremental return)
      let marginalROAS = currentROAS;
      if (i > 0) {
        const prevData = data[i - 1];
        const additionalCost = currentCost - prevData.cost;
        const additionalConvValue = currentConvValue - prevData.convValue;
        marginalROAS = additionalCost > 0 ? additionalConvValue / additionalCost : 0;
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

  const currentMetrics = useMemo(() => {
    const selectedCampaignData = campaigns.find(c => c.Campaign === selectedCampaign);
    if (!selectedCampaignData) return {
      revenue: 0, cost: 0, profit: 0, cpa: 0, convRate: 0, roas: 0
    };

    const revenue = convValue;
    const grossProfit = revenue * (1 - cogsPercentage / 100);
    const profit = grossProfit - cost;
    const cpa = selectedCampaignData.Conversions ? cost / selectedCampaignData.Conversions : 0;
    const convRate = selectedCampaignData.Clicks ? (selectedCampaignData.Conversions / selectedCampaignData.Clicks) * 100 : 0;
    const roas = cost > 0 ? convValue / cost : 0;

    return { revenue, cost, profit, cpa, convRate, roas };
  }, [campaigns, selectedCampaign, cost, convValue, cogsPercentage]);

  const incrementalData = useMemo(() => {
    if (profitData.length < 2) return [];

    const data = [];
    for (let i = 1; i < profitData.length; i++) {
      const current = profitData[i];
      const prev = profitData[i - 1];
      const incrementalCost = current.cost - prev.cost;
      const incrementalConvValue = current.convValue - prev.convValue;

      data.push({
        cost: current.cost,
        incrementalProfit: (incrementalConvValue * (1 - cogsPercentage / 100)) - incrementalCost,
        incrementalSales: current.sales - prev.sales,
        incrementalROAS: incrementalCost > 0 ? incrementalConvValue / incrementalCost : 0
      });
    }
    return data;
  }, [profitData, cogsPercentage]);

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

// Common chart components and interfaces
interface ChartConfig {
  dataKey: string;
  stroke: string;
  yAxisFormatter: (value: number) => string;
  tooltipFormatter: (value: number) => [string, string];
  data: any[];
}

const renderCommonElements = (config: ChartConfig) => ({
  cartesianGrid: (
    <CartesianGrid
      strokeDasharray="3 3"
      vertical={false}
      stroke="currentColor"
      opacity={0.1}
    />
  ),
  xAxis: (
    <XAxis
      dataKey="cost"
      tickFormatter={(value) => `${Math.round(value / 1000)}k`}
      stroke="currentColor"
      domain={['dataMin', 'dataMax']}
      padding={{ left: 20, right: 20 }}
      style={{ fontSize: 9 }}
    />
  ),
  yAxis: (
    <YAxis
      tickFormatter={config.yAxisFormatter}
      stroke="currentColor"
      width={50}
      domain={['auto', 'auto']}
      allowDataOverflow={false}
      style={{ fontSize: 9 }}
    />
  ),
  tooltip: (
    <Tooltip
      formatter={config.tooltipFormatter}
      labelFormatter={(label: number) => `Cost: ${Math.round(label).toLocaleString()}`}
      contentStyle={{
        backgroundColor: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px'
      }}
    />
  ),
  profitArea: (
    <ReferenceArea
      x1={optimalZone.start}
      x2={optimalZone.end}
      fill="#22c55e"
      fillOpacity={0.1}
    />
  ),
  mainLine: (
    <Line
      type="monotone"
      dataKey={config.dataKey}
      stroke={config.stroke}
      dot={false}
      strokeWidth={2}
      animationDuration={300}
    />
  )
});

const renderProfitDisplay = (value: number) => (
  <text
    x="95%"
    y="5%"
    textAnchor="end"
    className={`font-semibold ${value > 0 ? 'fill-green-500' : 'fill-red-500'}`}
  >
    ${Math.round(value).toLocaleString()}
  </text>
);

const findNearestCostValue = (data: any[], targetCost: number): number => {
  if (!data?.length) return targetCost;
  
  return data.reduce((nearest, point) => {
    const currentDiff = Math.abs(point.cost - targetCost);
    const nearestDiff = Math.abs(nearest - targetCost);
    return currentDiff < nearestDiff ? point.cost : nearest;
  }, data[0].cost);
};

const renderReferenceLine = (data: any[]) => {
  const nearestCost = findNearestCostValue(data, cost);
  
  return (
    <ReferenceLine
      x={nearestCost}
      stroke="hsl(var(--foreground))"
      strokeWidth={2}
      strokeDasharray="3 3"
      label={{
        value: "Current Cost",
        position: "top",
        fill: "hsl(var(--foreground))",
        fontSize: 12,
      }}
      isFront={true}
    />
  );
};

const getChartConfig = (chartType: ChartType): ChartConfig => {
  switch (chartType) {
    case 'profit-curve':
      return {
        dataKey: 'profit',
        stroke: '#8884d8',
        data: profitData,
        yAxisFormatter: (value) => `${Math.round(value / 1000)}k`,
        tooltipFormatter: (value) => [`${Math.round(value).toLocaleString()}`, 'Profit']
      };
    case 'profit-vs-roas':
      return {
        dataKey: 'roas',
        stroke: '#8b5cf6',
        data: profitData,
        yAxisFormatter: (value) => `${value.toFixed(1)}x`,
        tooltipFormatter: (value) => [`${value.toFixed(2)}x`, 'ROAS']
      };
    case 'incremental-profit':
      return {
        dataKey: 'incrementalProfit',
        stroke: '#22c55e',
        data: incrementalData,
        yAxisFormatter: (value) => `${Math.round(value / 1000)}k`,
        tooltipFormatter: (value) => [`${Math.round(value).toLocaleString()}`, 'Incremental Profit']
      };
    case 'marginal-roas':
      return {
        dataKey: 'marginalROAS',
        stroke: '#ef4444',
        data: profitData,
        yAxisFormatter: (value) => `${value.toFixed(1)}x`,
        tooltipFormatter: (value) => [`${value.toFixed(2)}x`, 'Marginal ROAS']
      };
  }
};

const renderActiveChart = (): React.ReactElement => {
  if (!selectedCampaign) {
    return <div className="flex items-center justify-center h-full">Select a campaign</div>;
  }

  const chartConfig = getChartConfig(activeChart);
  const elements = renderCommonElements(chartConfig);
  const currentProfit = currentMetrics.profit;
  
  return (
    <LineChart
      data={chartConfig.data}
      margin={{ top: 20, right: 20, bottom: 5, left: 20 }}
      className="text-foreground"
    >
      {elements.cartesianGrid}
      {elements.xAxis}
      {elements.yAxis}
      {elements.tooltip}
      {elements.profitArea}
      {renderReferenceLine(chartConfig.data)} {/* Pass the data to renderReferenceLine */}
      {renderProfitDisplay(currentProfit)}
      {elements.mainLine}
    </LineChart>
  );
};

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {/* Left Column - Controls */}
        <div className="w-[30%] space-y-4">
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
                     <SelectItem 
                     key={campaign.Campaign} 
                     value={campaign.Campaign}
                     className="flex items-center"
                   >
                     <span className="text-sm font-medium min-w-[100px]">
                       ${Math.round(campaign.Cost).toLocaleString()}
                     </span>
                     <span className="truncate ml-2">
                       {campaign.Campaign}
                     </span>
                   </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Cost Slider */}
          <Card>
            <CardHeader>
              <CardTitle>Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                min={1}
                max={Math.max(...campaigns.map(c => c.Cost)) * 2}
                step={100}
                value={[Math.max(0, cost)]}
                onValueChange={(value) => setCost(Math.max(0, value[0]))}
              />
              <p className="text-center mt-2">${Math.round(cost).toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Revenue Slider */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                min={1}
                max={Math.max(...campaigns.map(c => c.ConvValue)) * 2}
                step={100}
                value={[Math.max(1, convValue)]}
                onValueChange={(value) => setConvValue(Math.max(1, value[0]))}
              />
              <p className="text-center mt-2">${Math.round(convValue).toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* COGS Slider */}
          <Card>
            <CardHeader>
              <CardTitle>COGS Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                min={1}
                max={99}
                step={1}
                value={[Math.min(99, Math.max(1, cogsPercentage))]}
                onValueChange={(value) => setCogsPercentage(Math.min(99, Math.max(1, value[0])))}
              />
              <p className="text-center mt-2">{cogsPercentage}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Charts */}
        <div className="w-[70%]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {activeChart === 'profit-curve' && 'Profit Curve (optimal profit zone shown in light green)'}
                {activeChart === 'incremental-profit' && 'Incremental Profit (optimal profit zone shown in light green)'}
                {activeChart === 'profit-vs-roas' && 'Profit vs ROAS (optimal profit zone shown in light green)'}
                {activeChart === 'marginal-roas' && 'Marginal ROAS (optimal profit zone shown in light green)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {renderActiveChart()}
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <ChartThumbnail
                  title="Profit Curve"
                  isActive={activeChart === 'profit-curve'}
                  onClick={() => setActiveChart('profit-curve')}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profitData}>
                      <Line type="monotone" dataKey="profit" stroke="#8884d8" dot={false} animationDuration={300} />
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
                      <Line type="monotone" dataKey="incrementalProfit" stroke="#22c55e" dot={false} animationDuration={300} />
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
                      <Line type="monotone" dataKey="roas" stroke="#8b5cf6" dot={false} animationDuration={300} />
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
                      <Line type="monotone" dataKey="marginalROAS" stroke="#ef4444" dot={false} animationDuration={300} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartThumbnail>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Profit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Profit Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Current Performance</h3>
              <ul className="space-y-2">
                <li>Cost: ${Math.round(cost).toLocaleString()}</li>
                <li>Revenue: ${Math.round(convValue).toLocaleString()}</li>
                <li>ROAS: {(convValue / cost).toFixed(1)}x</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Optimal Points</h3>
              <ul className="space-y-2">
                <li>Maximum Profit: ${Math.round(optimalZone.maxProfit).toLocaleString()}</li>
                <li>Optimal Cost: ${Math.round(optimalZone.current).toLocaleString()}</li>
                <li>Optimal ROAS: {(optimalZone.maxProfit / optimalZone.current).toFixed(1)}x</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Profitability Metrics</h3>
              <ul className="space-y-2">
                <li>Gross Margin: {(100 - cogsPercentage).toFixed(1)}%</li>
                <li>Break-even ROAS: {(100 / (100 - cogsPercentage)).toFixed(2)}x</li>
                <li>Profit Margin: {((optimalZone.maxProfit / convValue) * 100).toFixed(1)}%</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}