"use client"

import { useState, useMemo, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts'
import { PageHeader, PageHeaderHeading } from "@/components/page-header"
import Papa from 'papaparse'
import { ChartThumbnail } from "@/components/chart-thumbnail"
import { HourCostHeatmap } from "@/components/hour-cost-heatmap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CampaignData {
  Campaign: string;
  Cost: number;
  ConvValue: number;
  Clicks: number;
  Conversions: number;
  ImprShare: number;      // Current impression share
  LostToBudget: number;   // IS lost to budget
  LostToRank: number;     // IS lost to rank
  Impressions: number;    // Current impressions
}

type ChartType = 'profit-curve' | 'incremental-profit' | 'profit-vs-roas' | 'marginal-roas';

interface VisualizationOptions {
    type: 'line' | 'bar' | 'area';
    xAxis: string;
    yAxis: string;
    normalized: boolean;
}

interface HourlyData {
  Hour: number;
  Campaign: string;
  Cost: number;
}

interface ProfitMetrics {
  revenue: number;
  cost: number;
  profit: number;
  cpa: number;
  convRate: number;
  roas: number;
}

interface OptimalZone {
  start: number;
  end: number;
  current: number;
  maxProfit: number;
}

interface CampaignMetrics {
  cost: number;
  convValue: number;
  roas: number;
  profit: number;
  sales: number;
  aov: number;
}

interface OptimalPoint {
  maxProfit: number;
  maxProfitCost: number;
  maxProfitROAS: number;
  maxProfitSales: number;
  maxProfitGrossProfit: number;
  minCost: number;
  maxCost: number;
  minROAS: number;
  maxROAS: number;
}

interface CampaignSummary {
  name: string;
  cost: number;
  revenue: number;
  profit: number;
  roas: number;
  minCost: number;
  maxCost: number;
  recommendation: 'increase' | 'decrease' | 'optimal';
  recommendationDetail: string;
}

interface CampaignProjection {
  name: string;
  currentCost: number;
  currentProfit: number;
  projectedCost: number;
  projectedProfit: number;
  percentChange: number;
  profitChange: number;
  currentIS: number;
  projectedIS: number;
  changeReason: string;
  budgetGain: number;
  rankGain: number;
}

// Update the BoxPlot component
const BoxPlot = ({ currentCost, minCost, maxCost }: { 
  currentCost: number;
  minCost: number;
  maxCost: number;
}) => {
  // Always use 0-100 range for positioning
  const currentPos = ((currentCost - minCost) / (maxCost - minCost)) * 100;

  return (
    <div className="relative w-[120px] h-4 bg-muted rounded overflow-hidden">
      {/* Optimal range - always show in middle 60% of plot */}
      <div 
        className="absolute h-full bg-green-500/20 dark:bg-green-500/40"
        style={{
          left: '20%',
          width: '60%'
        }}
      />
      {/* Current position */}
      <div 
        className="absolute h-full w-0.5 bg-foreground"
        style={{
          left: `${currentPos}%`,
          transform: 'translateX(-50%)'
        }}
      />
    </div>
  );
};

export default function Profit() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [cost, setCost] = useState(0);
  const [convValue, setConvValue] = useState(0);
  const [sales, setSales] = useState(0);
  const [cogsPercentage, setCogsPercentage] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<ChartType>('profit-curve');
  const [visualizationType, setVisualizationType] = useState<VisualizationOptions>({
    type: 'line',
    xAxis: 'Date',
    yAxis: 'Cost',
    normalized: false
  });
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [optimalZone, setOptimalZone] = useState<OptimalZone>({
    start: 0,
    end: 0,
    current: 0,
    maxProfit: 0
  });
  const [initialMetrics, setInitialMetrics] = useState<CampaignMetrics>({
    cost: 0,
    convValue: 0,
    sales: 0,
    roas: 0,
    profit: 0,
    aov: 0
  });

  // Initialize states with proper defaults
  const [isLoading, setIsLoading] = useState(true);

  // Add filter states
  const [includeFilter, setIncludeFilter] = useState('');
  const [excludeFilter, setExcludeFilter] = useState('');

  // Add state for row limit
  const [rowLimit, setRowLimit] = useState(10);

  // Debug loading state
  useEffect(() => {
    console.log('Loading state:', isLoading);
    console.log('Campaigns:', campaigns);
    console.log('Selected Campaign:', selectedCampaign);
    console.log('Error:', error);
  }, [isLoading, campaigns, selectedCampaign, error]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/30day.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        
        const result = Papa.parse(csvText, {
          header: true,
          transform: (value: string) => {
            if (!isNaN(Number(value))) return Number(value);
            return value;
          }
        });

        // Process campaign data
        const campaignData = result.data
          .filter((row: any) => 
            row.Campaign && 
            !isNaN(Number(row.Cost)) && 
            !isNaN(Number(row.ConvValue)) &&
            !isNaN(Number(row.Conversions)) &&
            !isNaN(Number(row.Clicks)) &&
            !isNaN(Number(row.ImprShare)) &&
            !isNaN(Number(row.LostToBudget)) &&
            !isNaN(Number(row.LostToRank)) &&
            !isNaN(Number(row.Impressions))
          )
          .map((row: any) => ({
            Campaign: row.Campaign,
            Cost: Number(row.Cost),
            ConvValue: Number(row.ConvValue),
            Clicks: Number(row.Clicks),
            Conversions: Number(row.Conversions),
            ImprShare: Number(row.ImprShare),
            LostToBudget: Number(row.LostToBudget),
            LostToRank: Number(row.LostToRank),
            Impressions: Number(row.Impressions)
          }))
          // Sort by Cost descending (highest first)
          .sort((a, b) => b.Cost - a.Cost);

        if (campaignData.length === 0) {
          throw new Error('No valid campaign data found in CSV');
        }

        // Set campaigns
        setCampaigns(campaignData);

        // Initialize with highest-cost campaign
        const topCampaign = campaignData[0];
        setSelectedCampaign(topCampaign.Campaign);
        setCost(topCampaign.Cost);
        setConvValue(topCampaign.ConvValue);
        setSales(topCampaign.Conversions);
        // COGS stays at default 30%

        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(`Error loading data: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Update cost and revenue when campaign changes
  useEffect(() => {
    const campaign = campaigns.find(c => c.Campaign === selectedCampaign)
    if (campaign) {
      setCost(campaign.Cost)
      setConvValue(campaign.ConvValue)
    }
  }, [selectedCampaign, campaigns])

  useEffect(() => {
    const loadHourlyData = async () => {
      try {
        const response = await fetch('/src/data/hourly.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch hourly CSV file');
        }

        const csvText = await response.text();
        
        const result = Papa.parse(csvText, {
          header: true,
          transform: (value: string) => {
            if (!isNaN(Number(value))) return Number(value);
            return value;
          }
        });

        if (result.errors.length > 0) {
          throw new Error('Error parsing hourly CSV: ' + result.errors[0].message);
        }

        // Process hourly data
        const processedHourlyData = result.data
          .filter((row: any) => row.Hour !== undefined && row.Campaign && row.Cost)
          .map((row: any) => ({
            Hour: Number(row.Hour),
            Campaign: row.Campaign,
            Cost: Number(row.Cost)
          }));

        setHourlyData(processedHourlyData);
      } catch (err) {
        console.error('Error loading hourly data:', err);
        // Don't set error state here to avoid overwriting main data error
      }
    };

    loadHourlyData();
  }, []); // Only load once on component mount

  // Calculate current metrics
  const currentMetrics = useMemo((): ProfitMetrics => {
    const selectedCampaignData = campaigns.find(c => c.Campaign === selectedCampaign);
    if (!selectedCampaignData) return {
      revenue: 0, cost: 0, profit: 0, cpa: 0, convRate: 0, roas: 0
    };

    const profit = convValue - cost - (convValue * cogsPercentage / 100);
    const cpa = cost / selectedCampaignData.Conversions;
    const convRate = (selectedCampaignData.Conversions / selectedCampaignData.Clicks) * 100;
    const roas = convValue / cost;

    return { revenue: convValue, cost, profit, cpa, convRate, roas };
  }, [campaigns, selectedCampaign, cost, cogsPercentage]);

  // Calculate profit data with ROAS focus
  const profitData = useMemo(() => {
    const data = [];
    const numPoints = 100;
    const maxCost = cost * 3;
    const minCost = cost * 0.1;
    const step = (maxCost - minCost) / (numPoints - 1);

    const campaign = campaigns.find(c => c.Campaign === selectedCampaign);
    if (!campaign) return [];

    const baseROAS = convValue / cost;
    const baseAOV = convValue / campaign.Conversions;

    for (let i = 0; i < numPoints; i++) {
      const currentCost = minCost + i * step;
      
      // Power function for diminishing returns (0.4 exponent)
      const scaleFactor = Math.pow(currentCost / cost, 0.4);
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

  // Calculate optimal profit point
  const optimalPoint = useMemo(() => {
    if (!profitData.length) return {
      maxProfit: 0,
      maxProfitCost: 0,
      maxProfitROAS: 0,
      maxProfitSales: 0,
      maxProfitGrossProfit: 0,
      minCost: 0,
      maxCost: 0,
      minROAS: 0,
      maxROAS: 0
    };

    const maxProfitPoint = profitData.reduce((max, point) => 
      point.profit > max.profit ? point : max, profitData[0]
    );

    const profitThreshold = maxProfitPoint.profit * 0.95;
    const profitRange = profitData.filter(point => point.profit >= profitThreshold);

    return {
      maxProfit: maxProfitPoint.profit,
      maxProfitCost: maxProfitPoint.cost,
      maxProfitROAS: maxProfitPoint.roas,
      maxProfitSales: maxProfitPoint.sales,
      maxProfitGrossProfit: maxProfitPoint.convValue * (1 - cogsPercentage / 100),
      minCost: Math.min(...profitRange.map(p => p.cost)),
      maxCost: Math.max(...profitRange.map(p => p.cost)),
      minROAS: Math.min(...profitRange.map(p => p.roas)),
      maxROAS: Math.max(...profitRange.map(p => p.roas))
    };
  }, [profitData, cogsPercentage]);

  // Update optimal zone whenever profitData changes
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

  // Calculate campaign summaries
  const calculateProfitData = (campaign: CampaignData) => {
    const data = [];
    const numPoints = 100;
    
    // Calculate current metrics
    const currentIS = campaign.ImprShare;           // e.g., 0.177 = 17.7%
    const lostToBudget = campaign.LostToBudget;    // e.g., 0.013 = 1.3%
    const lostToRank = campaign.LostToRank;        // e.g., 0.810 = 81.0%
    const maxPossibleIS = Math.min(0.9, currentIS + lostToBudget + lostToRank);
    
    // Calculate spend needed to capture IS lost to budget
    const spendForBudgetIS = campaign.Cost * (1 + lostToBudget / currentIS);
    
    // Calculate max possible spend (at 90% IS)
    const maxSpend = campaign.Cost * (0.9 / currentIS);
    
    // Set up spend range
    const minCost = campaign.Cost * 0.1;
    const maxCost = Math.min(maxSpend, campaign.Cost * 3);
    const step = (maxCost - minCost) / (numPoints - 1);

    const baseROAS = campaign.ConvValue / campaign.Cost;
    const baseAOV = campaign.ConvValue / campaign.Conversions;

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
        // Above budget-limited spend - use 0.25 exponent for rank-limited IS
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

      // Calculate current impression share
      let currentImprShare;
      if (currentCost <= campaign.Cost) {
        currentImprShare = currentIS * scaleFactor;
      } else if (currentCost <= spendForBudgetIS) {
        currentImprShare = currentIS + (currentCost - campaign.Cost) / (spendForBudgetIS - campaign.Cost) * lostToBudget;
      } else {
        const budgetIS = currentIS + lostToBudget;
        const extraIS = (currentCost - spendForBudgetIS) / (maxSpend - spendForBudgetIS) * lostToRank;
        currentImprShare = Math.min(0.9, budgetIS + extraIS);
      }

      data.push({
        cost: currentCost,
        sales: currentSales,
        convValue: currentConvValue,
        roas: currentROAS,
        profit: currentProfit,
        marginalROAS,
        aov: baseAOV,
        impressionShare: currentImprShare * 100  // Convert to percentage for display
      });
    }

    return data;
  };

  const campaignSummaries = useMemo((): CampaignSummary[] => {
    return campaigns.map(campaign => {
      const revenue = campaign.ConvValue;
      const cost = campaign.Cost;
      const grossRevenue = revenue * (1 - cogsPercentage / 100);
      const profit = grossRevenue - cost;
      const roas = revenue / cost;

      // Calculate optimal range for this campaign
      const data = calculateProfitData(campaign);
      const maxProfitPoint = data.reduce((max, point) => 
        point.profit > max.profit ? point : max, data[0]
      );
      const profitThreshold = maxProfitPoint.profit * 0.95;
      const profitRange = data.filter(point => point.profit >= profitThreshold);
      const minCost = Math.min(...profitRange.map(p => p.cost));
      const maxCost = Math.max(...profitRange.map(p => p.cost));

      // Ignore lost budget IS if less than 5%
      const significantLostBudget = campaign.LostToBudget > 0.05 ? campaign.LostToBudget : 0;
      const lostBudgetDollars = significantLostBudget > 0 ? 
        (significantLostBudget / campaign.ImprShare) * campaign.Cost : 0;

      // Determine recommendation based on both profit and impression share
      let recommendation: 'increase' | 'decrease' | 'optimal';
      let recommendationDetail: string;

      if (cost < minCost && significantLostBudget > 0) {
        recommendation = 'increase';
        recommendationDetail = `Increase spend to capture $${Math.round(lostBudgetDollars).toLocaleString()} in lost budget impression share. Current ROAS is ${roas.toFixed(1)}x.`;
      } else if (cost > maxCost) {
        recommendation = 'decrease';
        recommendationDetail = `Decrease spend as current cost ($${Math.round(cost).toLocaleString()}) is above optimal range. Max optimal spend is $${Math.round(maxCost).toLocaleString()}.`;
      } else if (cost < minCost) {
        recommendation = 'increase';
        recommendationDetail = `Increase spend to reach optimal range (minimum $${Math.round(minCost).toLocaleString()}). Current ROAS of ${roas.toFixed(1)}x suggests room for growth.`;
      } else if (roas < 1) {
        recommendation = 'decrease';
        recommendationDetail = `ROAS (${roas.toFixed(1)}x) is below 1.0 - reduce spend to improve profitability.`;
      } else {
        recommendation = 'optimal';
        recommendationDetail = `Current spend is within optimal range. ROAS is ${roas.toFixed(1)}x and profit is $${Math.round(profit).toLocaleString()}.`;
      }

      return {
        name: campaign.Campaign,
        cost,
        revenue,
        profit,
        roas,
        minCost,
        maxCost,
        recommendation,
        recommendationDetail
      };
    });
  }, [campaigns, cogsPercentage]);

  // Add projection size type and state
  const [decreasePercentage, setDecreasePercentage] = useState(5);
  const [increasePercentage, setIncreasePercentage] = useState(5);

  // Add filter logic to campaignSummaries FIRST
  const filteredCampaignSummaries = useMemo(() => {
    return campaignSummaries.filter(summary => {
      const name = summary.name.toLowerCase();
      const include = includeFilter.toLowerCase();
      const exclude = excludeFilter.toLowerCase();
      
      // If include filter is set, campaign must contain it
      if (include && !name.includes(include)) return false;
      
      // If exclude filter is set, campaign must not contain it
      if (exclude && name.includes(exclude)) return false;
      
      return true;
    });
  }, [campaignSummaries, includeFilter, excludeFilter]);

  // Add helper function for IS calculations
  const calculateImpressionShareMetrics = (campaign: CampaignData, projectedCost: number) => {
    // Calculate total available spend at current efficiency
    const totalAvailableSpend = (campaign.Cost / campaign.ImprShare) * 100;
    
    // Calculate new impression share based on projected spend
    const projectedIS = Math.min(
      90, // Cap at 90%
      (projectedCost / totalAvailableSpend) * 100
    );
    
    return {
      totalAvailableSpend: Math.round(totalAvailableSpend),
      projectedIS: Math.round(projectedIS * 10) / 10
    };
  };

  // Update the campaignProjections calculation
  const campaignProjections = useMemo((): CampaignProjection[] => {
    return filteredCampaignSummaries.map(summary => {
      const campaign = campaigns.find(c => c.Campaign === summary.name)!;
      const currentIS = campaign.ImprShare * 100;
      const totalAvailableSpend = (campaign.Cost / campaign.ImprShare);
      const maxPossibleSpend = totalAvailableSpend * 0.9;

      // Calculate lost budget dollars first
      const significantLostBudget = campaign.LostToBudget > 0.05 ? campaign.LostToBudget : 0;
      const lostBudgetDollars = significantLostBudget > 0 ? 
        (significantLostBudget / campaign.ImprShare) * campaign.Cost : 0;

      let budgetGain = 0;
      let rankGain = 0;
      let changeReason = '';

      // Use different percentages based on profitability
      const multiplier = summary.profit > 0 ? increasePercentage / 100 : decreasePercentage / 100;
      const direction = summary.profit > 0 ? 1 : -1;
      let projectedCost = summary.cost * (1 + (direction * multiplier));

      // If no change requested
      if ((summary.profit > 0 && increasePercentage === 0) || 
          (summary.profit <= 0 && decreasePercentage === 0)) {
        return {
          name: summary.name,
          currentCost: summary.cost,
          currentProfit: summary.profit,
          projectedCost: summary.cost,
          projectedProfit: summary.profit,
          percentChange: 0,
          profitChange: 0,
          currentIS: currentIS,
          projectedIS: currentIS,
          changeReason: 'No change requested',
          budgetGain: 0,
          rankGain: 0
        };
      }

      // Calculate projected metrics
      const scaleFactor = Math.pow(projectedCost / summary.cost, 0.4);
      const projectedRevenue = summary.revenue * scaleFactor;
      const projectedGrossRevenue = projectedRevenue * (1 - cogsPercentage / 100);
      const projectedProfit = projectedGrossRevenue - projectedCost;
      const projectedIS = Math.min(90, (projectedCost / totalAvailableSpend) * 100);

      // Set change reason based on direction and conditions
      if (direction < 0) {
        changeReason = `Reducing spend by ${decreasePercentage}% to improve profitability`;
      } else if (direction > 0 && significantLostBudget > 0) {
        const spendForBudgetIS = campaign.Cost * (1 + significantLostBudget / campaign.ImprShare);
        
        if (projectedCost <= spendForBudgetIS) {
          const percentageOfBudgetCaptured = (projectedCost - campaign.Cost) / lostBudgetDollars;
          budgetGain = lostBudgetDollars * percentageOfBudgetCaptured;
          changeReason = `Increasing spend by ${increasePercentage}% to capture ${(percentageOfBudgetCaptured * 100).toFixed(1)}% of available budget-limited IS`;
        } else {
          budgetGain = lostBudgetDollars;
          rankGain = projectedCost - spendForBudgetIS;
          changeReason = `Increasing spend by ${increasePercentage}% to capture all budget-limited IS plus some rank-limited IS`;
        }
      } else if (direction > 0) {
        changeReason = `Increasing spend by ${increasePercentage}% to test growth potential`;
      }

      return {
        name: summary.name,
        currentCost: summary.cost,
        currentProfit: summary.profit,
        projectedCost,
        projectedProfit: projectedProfit,
        percentChange: ((projectedCost - summary.cost) / summary.cost) * 100,
        profitChange: projectedProfit - summary.profit,
        currentIS: currentIS,
        projectedIS,
        changeReason,
        budgetGain,
        rankGain
      };
    });
  }, [filteredCampaignSummaries, campaigns, cogsPercentage, increasePercentage, decreasePercentage]);

  const renderActiveChart = () => {
    switch (activeChart) {
      case 'profit-curve':
        const campaign = campaigns.find(c => c.Campaign === selectedCampaign);
        if (!campaign) return null;

        const currentIS = campaign.ImprShare;
        const lostToBudget = campaign.LostToBudget;
        const spendForBudgetIS = campaign.Cost * (1 + lostToBudget / currentIS);
        const maxSpend = campaign.Cost * (0.9 / currentIS);

        return (
          <LineChart 
            data={profitData} 
            margin={{ top: 30, right: 30, bottom: 5, left: 20 }}
            className="text-foreground"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
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
            />
            
            {/* Add optimal zone shading */}
            <ReferenceArea
              x1={optimalZone.start}
              x2={optimalZone.end}
              fill="#22c55e"
              fillOpacity={0.1}
            />
            
            {/* Add boundary lines */}
            <ReferenceLine
              x={optimalZone.start}
              stroke="#22c55e"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              x={optimalZone.end}
              stroke="#22c55e"
              strokeDasharray="3 3"
            />
            
            {/* Current position line - full height black line */}
            <ReferenceLine
              x={cost}
              stroke="#000000"
              strokeWidth={2}
              isFront={true}
            />

            {/* Budget-limited IS point */}
            <ReferenceLine
              x={spendForBudgetIS}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{
                value: `Budget Limited (${(currentIS * 100 + lostToBudget * 100).toFixed(1)}% IS)`,
                position: 'top',
                fill: '#f59e0b'
              }}
            />

            {/* Max possible IS (90%) point */}
            <ReferenceLine
              x={maxSpend}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: '90% IS',
                position: 'top',
                fill: '#ef4444'
              }}
            />

            <Line type="monotone" dataKey="profit" stroke="#8884d8" dot={false} />

            {/* Add current profit label */}
            <text
              x="95%"
              y="20"
              textAnchor="end"
              className="fill-current text-foreground"
            >
              Profit: ${Math.round(currentMetrics.profit).toLocaleString()}
            </text>
          </LineChart>
        );

      case 'incremental-profit':
        return (
          <LineChart data={incrementalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="cost" 
              tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Incremental Profit']}
              labelFormatter={(label: number) => `Cost: $${label.toLocaleString()}`}
            />
            
            {/* Add zero line */}
            <ReferenceLine
              y={0}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ 
                value: 'Break Even', 
                position: 'right',
                fill: '#ef4444'
              }}
            />

            {/* Add current position line */}
            <ReferenceLine
              x={optimalZone.current}
              stroke="#ef4444"
              label={{ 
                value: 'Current', 
                angle: -90, 
                position: 'top',
                fill: '#ef4444'
              }}
            />

            <Line type="monotone" dataKey="incrementalProfit" stroke="#22c55e" dot={false} />
          </LineChart>
        );

      case 'profit-vs-roas':
        return (
          <LineChart data={profitData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="roas" 
              tickFormatter={(value) => `${value.toFixed(1)}x`}
            />
            <YAxis 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Profit']}
              labelFormatter={(label: number) => `ROAS: ${label.toFixed(1)}x`}
            />
            <Line type="monotone" dataKey="profit" stroke="#8b5cf6" dot={false} />
          </LineChart>
        );

      case 'marginal-roas':
        return (
          <LineChart data={profitData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="cost" 
              tickFormatter={(value) => `$${Math.round(value/1000)}k`}
            />
            <YAxis 
              tickFormatter={(value) => `${value.toFixed(1)}x`}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}x`, 'Marginal ROAS']}
              labelFormatter={(label: number) => `Cost: $${Math.round(label).toLocaleString()}`}
            />
            <Line type="monotone" dataKey="marginalROAS" stroke="#ef4444" dot={false} />
          </LineChart>
        );
    }
  };

  // Add debug output to render
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading campaign data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          {error}
          <pre className="mt-4 text-sm">
            Loading: {isLoading.toString()}
            Campaigns: {campaigns.length}
            Selected: {selectedCampaign}
          </pre>
        </div>
      </div>
    );
  }

  // Early return if no campaigns loaded
  if (!campaigns.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">No campaign data available</div>
      </div>
    )
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Profit Calculator</PageHeaderHeading>
      </PageHeader>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">Campaign Summary</TabsTrigger>
          <TabsTrigger value="analysis">Profit Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {/* Overall Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 gap-3">
                <div className="col-span-1">
                  <p className="text-sm font-medium">Total Cost</p>
                  <p className="text-xl font-bold">
                    ${Math.round(campaigns.reduce((sum, c) => sum + c.Cost, 0)).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-medium">Total Revenue</p>
                  <p className="text-xl font-bold">
                    ${Math.round(campaigns.reduce((sum, c) => sum + c.ConvValue, 0)).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-medium">Total Profit</p>
                  <p className="text-xl font-bold">
                    ${Math.round(campaigns.reduce((sum, c) => sum + (c.ConvValue * (1 - cogsPercentage/100) - c.Cost), 0)).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-medium">Avg CPA</p>
                  <p className="text-xl font-bold">
                    ${(campaigns.reduce((sum, c) => sum + c.Cost, 0) / campaigns.reduce((sum, c) => sum + c.Conversions, 0)).toFixed(2)}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-medium">Conv Rate</p>
                  <p className="text-xl font-bold">
                    {(campaigns.reduce((sum, c) => sum + c.Conversions, 0) / campaigns.reduce((sum, c) => sum + c.Clicks, 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-medium">ROAS</p>
                  <p className="text-xl font-bold">
                    {(campaigns.reduce((sum, c) => sum + c.ConvValue, 0) / 
                      campaigns.reduce((sum, c) => sum + c.Cost, 0)).toFixed(1)}x
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Breakeven: {(1 / (1 - cogsPercentage / 100)).toFixed(1)}x
                  </p>
                </div>
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

          {/* Campaign Filters - Moved outside cards */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Include Campaigns (contains)
              </label>
              <input
                type="text"
                value={includeFilter}
                onChange={(e) => setIncludeFilter(e.target.value)}
                placeholder="Enter text to filter..."
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Exclude Campaigns (contains)
              </label>
              <input
                type="text"
                value={excludeFilter}
                onChange={(e) => setExcludeFilter(e.target.value)}
                placeholder="Enter text to filter..."
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              />
            </div>
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Rows to Show
              </label>
              <Select value={rowLimit.toString()} onValueChange={(value) => setRowLimit(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campaign Performance Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-foreground">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2">Campaign</th>
                      <th className="px-4 py-2">Cost</th>
                      <th className="px-4 py-2">Revenue</th>
                      <th className="px-4 py-2">Profit</th>
                      <th className="px-4 py-2">ROAS</th>
                      <th className="px-4 py-2">Lost Budget IS%</th>
                      <th className="px-4 py-2">Optimal Range</th>
                      <th className="px-4 py-2">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaignSummaries.slice(0, rowLimit).map(summary => {
                      const campaign = campaigns.find(c => c.Campaign === summary.name);
                      return (
                        <tr key={summary.name} className="border-b border-border hover:bg-muted/50">
                          <td className="px-4 py-2">{summary.name}</td>
                          <td className="px-4 py-2">${Math.round(summary.cost).toLocaleString()}</td>
                          <td className="px-4 py-2">${Math.round(summary.revenue).toLocaleString()}</td>
                          <td className="px-4 py-2">${Math.round(summary.profit).toLocaleString()}</td>
                          <td className="px-4 py-2">{summary.roas.toFixed(1)}x</td>
                          <td className="px-4 py-2">
                            {(campaign?.LostToBudget > 0.05 ? campaign?.LostToBudget * 100 : 0).toFixed(1)}%
                          </td>
                          <td className="px-4 py-2">
                            ${Math.round(summary.minCost).toLocaleString()} - ${Math.round(summary.maxCost).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            <div>
                              <span className={
                                summary.recommendation === 'increase' ? 'text-green-500' :
                                summary.recommendation === 'decrease' ? 'text-red-500' :
                                'text-yellow-500'
                              }>
                                {summary.recommendation === 'increase' ? '↑ Increase' :
                                 summary.recommendation === 'decrease' ? '↓ Decrease' :
                                 '✓ Optimal'}
                              </span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {summary.recommendationDetail}
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 5% Budget Change Projections Table */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Change Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8 mb-6">
                <div className="flex-1">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-red-500">Decrease Loss-Making Campaigns</span>
                    <span className="text-sm font-medium">-{decreasePercentage}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[decreasePercentage]}
                    onValueChange={(value) => setDecreasePercentage(value[0])}
                    className="flex-grow"
                  />
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-green-500">Increase Profitable Campaigns</span>
                    <span className="text-sm font-medium">+{increasePercentage}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[increasePercentage]}
                    onValueChange={(value) => setIncreasePercentage(value[0])}
                    className="flex-grow"
                  />
                </div>
              </div>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2">Campaign</th>
                      <th className="px-4 py-2">Current Cost</th>
                      <th className="px-4 py-2">Current Profit</th>
                      <th className="px-4 py-2">Current IS%</th>
                      <th className="px-4 py-2">Lost Budget $</th>
                      <th className="px-4 py-2">Projected Cost</th>
                      <th className="px-4 py-2">Projected Profit</th>
                      <th className="px-4 py-2">Projected IS%</th>
                      <th className="px-4 py-2">Change</th>
                      <th className="px-4 py-2">Profit Impact</th>
                      <th className="px-4 py-2">Budget Gain</th>
                      <th className="px-4 py-2">Rank Gain</th>
                      <th className="px-4 py-2">Change Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignProjections.slice(0, rowLimit).map(projection => {
                      const campaign = campaigns.find(c => c.Campaign === projection.name)!;
                      // Only calculate lost budget dollars if over 5% threshold
                      const significantLostBudget = campaign.LostToBudget > 0.05 ? campaign.LostToBudget : 0;
                      const lostBudgetDollars = significantLostBudget > 0 ? 
                        (significantLostBudget / campaign.ImprShare) * campaign.Cost : 0;

                      return (
                        <tr key={projection.name} className="border-b">
                          <td className="px-4 py-2">{projection.name}</td>
                          <td className="px-4 py-2">${Math.round(projection.currentCost).toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <span className={projection.currentProfit < 0 ? 'text-red-500 font-bold' : ''}>
                              ${Math.round(projection.currentProfit).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-2">{projection.currentIS.toFixed(1)}%</td>
                          <td className="px-4 py-2">${Math.round(lostBudgetDollars).toLocaleString()}</td>
                          <td className="px-4 py-2">${Math.round(projection.projectedCost).toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <span className={projection.projectedProfit < 0 ? 'text-red-500 font-bold' : ''}>
                              ${Math.round(projection.projectedProfit).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-2">{projection.projectedIS.toFixed(1)}%</td>
                          <td className="px-4 py-2">
                            <span className={projection.percentChange < 0 ? 'text-red-500 font-bold' : ''}>
                              {projection.percentChange === 0 ? '-' : 
                               `${projection.percentChange > 0 ? '+' : ''}${projection.percentChange.toFixed(1)}%`}
                              </span>
                            </td>
                          <td className="px-4 py-2">
                            <span className={projection.profitChange < 0 ? 'text-red-500 font-bold' : 
                                              projection.profitChange > 0 ? 'text-green-500' : ''}>
                              {projection.profitChange === 0 ? '-' :
                               `${projection.profitChange > 0 ? '+' : ''}$${Math.round(Math.abs(projection.profitChange)).toLocaleString()}`}
                              </span>
                            </td>
                          <td className="px-4 py-2">
                            {projection.budgetGain > 0 && significantLostBudget > 0 ? 
                              `$${Math.round(projection.budgetGain).toLocaleString()}` : 
                              '-'}
                          </td>
                          <td className="px-4 py-2">
                            {projection.rankGain > 0 ? 
                              `$${Math.round(projection.rankGain).toLocaleString()}` : 
                              '-'}
                          </td>
                          <td className="px-4 py-2">{projection.changeReason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="space-y-6">
            {/* Campaign Selection, Sliders, Chart section */}
            <div className="flex gap-5">
              {/* Left Column - 30% width */}
              <div className="w-[30%] space-y-5">
                {/* Campaign Selection */}
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

                {/* Cost Slider */}
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

                {/* Revenue Slider */}
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
                      <ResponsiveContainer>
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
                      <ResponsiveContainer>
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
                      <ResponsiveContainer>
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
                      <ResponsiveContainer>
                        <LineChart data={profitData}>
                          <Line type="monotone" dataKey="marginalROAS" stroke="#ef4444" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartThumbnail>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profit Analysis Card */}
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
} 