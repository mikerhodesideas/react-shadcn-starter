//analysis.tsx
"use client"

import { useState, useMemo, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { useCampaignData } from "@/contexts/campaign-data"

// Move interfaces outside component
interface CampaignData {
  Campaign: string;
  Cost: number;
  ConvValue: number;
  Clicks: number;
  Conversions: number;
  ImprShare: number;
  LostToBudget: number;
  LostToRank: number;
  Impressions: number;
}

interface OptimalZone {
  start: number;
  end: number;
  current: number;
  maxProfit: number;
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

type SortField = 'cost' | 'revenue' | 'profit' | 'roas' | 'lostBudget' | 'currentCost' | 'currentProfit' | 'projectedCost' | 'projectedProfit' | 'percentChange' | 'profitChange';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

// Add sortable header component
const SortableHeader = ({
  field,
  label,
  sortState,
  setSortState
}: {
  field: SortField;
  label: string;
  sortState: SortState;
  setSortState: (state: SortState) => void;
}) => (
  <th
    className="px-4 py-2 cursor-pointer hover:bg-muted/50"
    onClick={() => setSortState({
      field,
      direction: sortState.field === field && sortState.direction === 'desc' ? 'asc' : 'desc'
    })}
  >
    {label} {sortState.field === field && (sortState.direction === 'desc' ? '↓' : '↑')}
  </th>
);


const calculateSimpleProfitProjections = (
  campaign: CampaignData | undefined,
  selectedCost: number,
  selectedConvValue: number,
  selectedCogsPercentage: number
) => {
  if (!campaign) return [];

  const data = [];
  const numPoints = 100;
  const maxCost = selectedCost * 3;
  const minCost = selectedCost * 0.1;
  const step = (maxCost - minCost) / (numPoints - 1);

  const baseROAS = selectedConvValue / selectedCost;
  const baseAOV = selectedConvValue / campaign.Conversions;

  for (let i = 0; i < numPoints; i++) {
    const currentCost = minCost + i * step;
    const scaleFactor = Math.pow(currentCost / selectedCost, 0.4);
    const currentSales = campaign.Conversions * scaleFactor;
    const currentConvValue = currentSales * baseAOV;
    const currentROAS = currentConvValue / currentCost;

    const grossProfit = currentConvValue * (1 - selectedCogsPercentage / 100);
    const currentProfit = grossProfit - currentCost;

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
};


export default function Analysis() {
  const { data, isLoading, error } = useCampaignData()

  // 1. Group all useState declarations together at the top
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '7d'>('30d')
  const [cogsPercentage, setCogsPercentage] = useState(50)
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [cost, setCost] = useState(0)
  const [convValue, setConvValue] = useState(0)
  const [includeFilter, setIncludeFilter] = useState('')
  const [excludeFilter, setExcludeFilter] = useState('')
  const [rowLimit, setRowLimit] = useState(10)
  const [decreasePercentage, setDecreasePercentage] = useState(5)
  const [increasePercentage, setIncreasePercentage] = useState(5)
  const [sortState, setSortState] = useState<SortState>({ field: 'cost', direction: 'desc' })
  const [projectionsSortState, setProjectionsSortState] = useState<SortState>({ field: 'currentCost', direction: 'desc' })
  const [optimalZone, setOptimalZone] = useState<OptimalZone | null>(null)

  // 2. Extract data arrays with fallbacks
  const dataArrays = useMemo(() => ({
    thirtyDayData: Array.isArray(data?.thirty_days) ? data.thirty_days : [],
    previousThirtyDays: Array.isArray(data?.previous_thirty_days) ? data.previous_thirty_days : [],
    sevenDayData: Array.isArray(data?.seven_days) ? data.seven_days : [],
    previousSevenDays: Array.isArray(data?.previous_seven_days) ? data.previous_seven_days : [],
    hourlyToday: Array.isArray(data?.hourly_today) ? data.hourly_today : [],
    hourlyYesterday: Array.isArray(data?.hourly_yesterday) ? data.hourly_yesterday : [],
    settings: Array.isArray(data?.settings) ? data.settings : [],
    products: Array.isArray(data?.products) ? data.products : [],
    matchTypes: Array.isArray(data?.match_types) ? data.match_types : [],
    searchTerms: Array.isArray(data?.search_terms) ? data.search_terms : [],
    channels: Array.isArray(data?.channels) ? data.channels : [],
    pmax: Array.isArray(data?.pmax) ? data.pmax : []
  }), [data])

  // 3. Calculate campaigns with proper dependencies
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
          PreviousConversions: 0,
          CostChange: 0,
          ConvValueChange: 0,
          ConversionsChange: 0
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

    // Process previous data
    previousData.forEach(row => {
      if (!row?.Campaign || !campaignMap.has(row.Campaign)) return

      const campaign = campaignMap.get(row.Campaign)
      campaign.PreviousCost += row.Cost || 0
      campaign.PreviousConvValue += row.ConvValue || 0
      campaign.PreviousConversions += row.Conversions || 0
    })

    // Calculate changes
    campaignMap.forEach(campaign => {
      campaign.CostChange = campaign.PreviousCost ?
        ((campaign.Cost - campaign.PreviousCost) / campaign.PreviousCost) * 100 : 0
      campaign.ConvValueChange = campaign.PreviousConvValue ?
        ((campaign.ConvValue - campaign.PreviousConvValue) / campaign.PreviousConvValue) * 100 : 0
      campaign.ConversionsChange = campaign.PreviousConversions ?
        ((campaign.Conversions - campaign.PreviousConversions) / campaign.PreviousConversions) * 100 : 0
    })

    return Array.from(campaignMap.values())
  }, [selectedPeriod, dataArrays])

  // 4. useEffect with proper dependencies
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0].Campaign)
      setCost(campaigns[0].Cost)
      setConvValue(campaigns[0].ConvValue)
    }
  }, [campaigns, selectedCampaign])

  // Profit data calculation
  const profitData = useMemo(() => {
    const selectedCampaignData = campaigns.find(c => c.Campaign === selectedCampaign)
    return calculateSimpleProfitProjections(selectedCampaignData, cost, convValue, cogsPercentage)
  }, [campaigns, selectedCampaign, cost, convValue, cogsPercentage])

  // Optimal zone effect
  useEffect(() => {
    if (profitData.length > 0) {
      const maxProfitPoint = profitData.reduce((max, point) =>
        point.profit > max.profit ? point : max, profitData[0]
      )
      const profitThreshold = maxProfitPoint.profit * 0.95
      const profitRange = profitData.filter(point => point.profit >= profitThreshold)

      setOptimalZone({
        start: Math.min(...profitRange.map(p => p.cost)),
        end: Math.max(...profitRange.map(p => p.cost)),
        current: cost,
        maxProfit: maxProfitPoint.profit
      })
    }
  }, [profitData, cost])

  // Calculate campaign summaries
  const calculateCampaignProfitWithIS = (campaign: CampaignData) => {
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

  // Campaign summaries calculation
  const campaignSummaries = useMemo((): CampaignSummary[] => {
    if (!campaigns?.length) return [];
  
    return campaigns.map(campaign => {
      if (!campaign?.Campaign) return null;
  
      const revenue = campaign.ConvValue || 0;
      const campaignCost = campaign.Cost || 0;
      const grossRevenue = revenue * (1 - cogsPercentage / 100);
      const profit = grossRevenue - campaignCost;
      const roas = campaignCost > 0 ? revenue / campaignCost : 0;
  
      // Calculate optimal range for this campaign
      const data = calculateCampaignProfitWithIS(campaign);
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
  
      // Determine recommendation
      let recommendation: 'increase' | 'decrease' | 'optimal';
      let recommendationDetail: string;
  
      if (campaignCost < minCost && significantLostBudget > 0) {
        recommendation = 'increase';
        recommendationDetail = `Increase spend to capture ${Math.round(lostBudgetDollars).toLocaleString()} in lost budget impression share. Current ROAS is ${roas.toFixed(1)}x.`;
      } else if (campaignCost > maxCost) {
        recommendation = 'decrease';
        recommendationDetail = `Decrease spend as current cost (${Math.round(campaignCost).toLocaleString()}) is above optimal range. Max optimal spend is ${Math.round(maxCost).toLocaleString()}.`;
      } else if (campaignCost < minCost) {
        recommendation = 'increase';
        recommendationDetail = `Increase spend to reach optimal range (minimum ${Math.round(minCost).toLocaleString()}). Current ROAS of ${roas.toFixed(1)}x suggests room for growth.`;
      } else if (roas < 1) {
        recommendation = 'decrease';
        recommendationDetail = `ROAS (${roas.toFixed(1)}x) is below 1.0 - reduce spend to improve profitability.`;
      } else {
        recommendation = 'optimal';
        recommendationDetail = `Current spend is within optimal range. ROAS is ${roas.toFixed(1)}x and profit is ${Math.round(profit).toLocaleString()}.`;
      }
  
      return {
        name: campaign.Campaign,
        cost: campaignCost,
        revenue,
        profit,
        roas,
        minCost,
        maxCost,
        recommendation,
        recommendationDetail
      };
    }).filter(Boolean) as CampaignSummary[]; // Remove any null entries
  }, [campaigns, cogsPercentage]);

  // Filtered summaries
  const filteredCampaignSummaries = useMemo(() => {
    if (!campaignSummaries?.length) return []

    return campaignSummaries.filter(summary => {
      const name = summary.name?.toLowerCase() || ''
      const include = includeFilter?.toLowerCase() || ''
      const exclude = excludeFilter?.toLowerCase() || ''

      if (include && !name.includes(include)) return false
      if (exclude && name.includes(exclude)) return false

      return true
    })
  }, [campaignSummaries, includeFilter, excludeFilter])

  // Campaign projections calculation
  const campaignProjections = useMemo((): CampaignProjection[] => {
    return filteredCampaignSummaries.map(summary => {
      const campaign = campaigns.find(c => c.Campaign === summary.name)!;
      const currentIS = campaign.ImprShare * 100;
      const totalAvailableSpend = (campaign.Cost / campaign.ImprShare);
      const maxPossibleSpend = totalAvailableSpend * 0.9;  // Cap at 90% impression share
  
      let budgetGain = 0;
      let rankGain = 0;
      let changeReason = '';
  
      // Use different percentages based on profitability
      const multiplier = summary.profit > 0 ? increasePercentage / 100 : decreasePercentage / 100;
      const direction = summary.profit > 0 ? 1 : -1;
      
      // Calculate initial projected cost
      let projectedCost = summary.cost * (1 + (direction * multiplier));
      
      // If we're increasing and would exceed optimal range
      if (direction > 0 && projectedCost > summary.maxCost) {
        const actualIncreasePercent = ((summary.maxCost - summary.cost) / summary.cost * 100).toFixed(1);
        projectedCost = summary.maxCost;
        changeReason = `Increasing by ${actualIncreasePercent}% to reach optimal range maximum (${Math.round(summary.maxCost).toLocaleString()})`;
      } else if (direction < 0) {
        changeReason = `Reducing spend by ${decreasePercentage}% to improve profitability`;
      } else if (direction > 0) {
        changeReason = `Increasing spend by ${increasePercentage}% to test growth potential`;
      }
  
      // Calculate potential impression share gains
      if (direction > 0) {
        const additionalSpend = projectedCost - summary.cost;
        const currentLostBudget = campaign.LostToBudget;
        const currentLostRank = campaign.LostToRank;
        
        // Calculate how much of the additional spend goes to budget vs rank
        if (currentLostBudget > 0.05) {  // Only consider significant lost budget
          const spendToCaptureBudget = (campaign.Cost * currentLostBudget) / campaign.ImprShare;
          if (additionalSpend <= spendToCaptureBudget) {
            // All additional spend goes to capturing budget IS
            budgetGain = (additionalSpend / spendToCaptureBudget) * (currentLostBudget * 100);
          } else {
            // Some spend goes to budget, some to rank
            budgetGain = currentLostBudget * 100;
            const remainingSpend = additionalSpend - spendToCaptureBudget;
            const spendToFullRank = (campaign.Cost * currentLostRank) / campaign.ImprShare;
            rankGain = Math.min(
              currentLostRank * 100,
              (remainingSpend / spendToFullRank) * (currentLostRank * 100)
            );
          }
        } else if (currentLostRank > 0) {
          // All additional spend goes to capturing rank IS
          const spendToFullRank = (campaign.Cost * currentLostRank) / campaign.ImprShare;
          rankGain = Math.min(
            currentLostRank * 100,
            (additionalSpend / spendToFullRank) * (currentLostRank * 100)
          );
        }
      }
  
      // Calculate projected metrics using diminishing returns model
      const scaleFactor = Math.pow(projectedCost / summary.cost, 0.4); // Use 0.4 power for diminishing returns
      const projectedRevenue = summary.revenue * scaleFactor;
      const projectedGrossRevenue = projectedRevenue * (1 - cogsPercentage / 100);
      const projectedProfit = projectedGrossRevenue - projectedCost;
      
      // Calculate projected impression share
      let projectedIS = currentIS;
      if (projectedCost > summary.cost) {
        // For increases, add budget and rank gains
        projectedIS = Math.min(90, currentIS + budgetGain + rankGain);
      } else {
        // For decreases, scale down proportionally
        projectedIS = Math.max(1, currentIS * (projectedCost / summary.cost));
      }
  
      return {
        name: summary.name,
        currentCost: summary.cost,
        currentProfit: summary.profit,
        projectedCost,
        projectedProfit,
        percentChange: ((projectedCost - summary.cost) / summary.cost) * 100,
        profitChange: projectedProfit - summary.profit,
        currentIS,
        projectedIS,
        changeReason,
        budgetGain: Math.round(budgetGain * 10) / 10,  // Round to 1 decimal
        rankGain: Math.round(rankGain * 10) / 10       // Round to 1 decimal
      };
    });
  }, [
    filteredCampaignSummaries, 
    campaigns, 
    cogsPercentage, 
    increasePercentage, 
    decreasePercentage
  ]);


  //--------------

  const performanceMetrics = useMemo(() => {
    const currentData = selectedPeriod === '30d' ? dataArrays.thirtyDayData : dataArrays.sevenDayData;
    const previousData = selectedPeriod === '30d' ? dataArrays.previousThirtyDays : dataArrays.previousSevenDays;

    // Calculate current period totals
    const currentTotals = currentData.reduce((acc, row) => ({
      cost: acc.cost + (row.Cost || 0),
      revenue: acc.revenue + (row.ConvValue || 0),
      conversions: acc.conversions + (row.Conversions || 0),
      clicks: acc.clicks + (row.Clicks || 0)
    }), { cost: 0, revenue: 0, conversions: 0, clicks: 0 });

    // Calculate previous period totals
    const previousTotals = previousData.reduce((acc, row) => ({
      cost: acc.cost + (row.Cost || 0),
      revenue: acc.revenue + (row.ConvValue || 0),
      conversions: acc.conversions + (row.Conversions || 0),
      clicks: acc.clicks + (row.Clicks || 0)
    }), { cost: 0, revenue: 0, conversions: 0, clicks: 0 });

    // Helper for percentage change
    const getChange = (current: number, previous: number) =>
      previous ? ((current - previous) / previous * 100).toFixed(1) : 0;

    const profit = currentTotals.revenue * (1 - cogsPercentage / 100) - currentTotals.cost;
    const previousProfit = previousTotals.revenue * (1 - cogsPercentage / 100) - previousTotals.cost;

    return [
      {
        label: "Total Cost",
        value: `${Math.round(currentTotals.cost).toLocaleString()}`,
        change: getChange(currentTotals.cost, previousTotals.cost),
        inverse: true
      },
      {
        label: "Total Revenue",
        value: `${Math.round(currentTotals.revenue).toLocaleString()}`,
        change: getChange(currentTotals.revenue, previousTotals.revenue)
      },
      {
        label: "Total Profit",
        value: `${Math.round(profit).toLocaleString()}`,
        change: getChange(profit, previousProfit)
      },
      {
        label: "Avg CPA",
        value: `${(currentTotals.cost / currentTotals.conversions).toFixed(2)}`,
        change: getChange(
          currentTotals.cost / currentTotals.conversions,
          previousTotals.cost / previousTotals.conversions
        ),
        inverse: true
      },
      {
        label: "Conv Rate",
        value: `${(currentTotals.conversions / currentTotals.clicks * 100).toFixed(1)}%`,
        change: getChange(
          currentTotals.conversions / currentTotals.clicks,
          previousTotals.conversions / previousTotals.clicks
        )
      },
      {
        label: "ROAS",
        value: `${(currentTotals.revenue / currentTotals.cost).toFixed(1)}x`,
        change: getChange(
          currentTotals.revenue / currentTotals.cost,
          previousTotals.revenue / previousTotals.cost
        )
      }
    ];
  }, [selectedPeriod, dataArrays, cogsPercentage])

  // Add sorting function
  const sortData = (data: any[], field: SortField, direction: SortDirection) => {
    return [...data].sort((a, b) => {
      let aValue = field === 'lostBudget' ?
        (campaigns.find(c => c.Campaign === a.name)?.LostToBudget ?? 0) :
        a[field];
      let bValue = field === 'lostBudget' ?
        (campaigns.find(c => c.Campaign === b.name)?.LostToBudget ?? 0) :
        b[field];

      return direction === 'asc' ?
        aValue - bValue :
        bValue - aValue;
    });
  };

  // Early returns
  if (!data && isLoading) return <div>Loading campaign data...</div>
  if (error) return <div>Error loading data: {error}</div>
  if (!dataArrays.thirtyDayData?.length && !dataArrays.sevenDayData?.length) {
    return <div>No campaign data available. Please load data in Settings.</div>
  }

  // -------------

  return (
    <>
      <Card>
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
            <Select
              value={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value)}
            >
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

      <Tabs defaultValue="summary" className="mt-8">
        <TabsList>
          <TabsTrigger value="summary">Campaign Summary</TabsTrigger>
          <TabsTrigger value="projections">Budget Projections</TabsTrigger>
        </TabsList>

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

            <Select
              value={rowLimit.toString()}
              onValueChange={(value) => setRowLimit(Number(value))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Show rows" />
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
                      <th className="px-4 py-2">Campaign</th>
                      <SortableHeader field="cost" label="Cost" sortState={sortState} setSortState={setSortState} />
                      <SortableHeader field="revenue" label="Revenue" sortState={sortState} setSortState={setSortState} />
                      <SortableHeader field="profit" label="Profit" sortState={sortState} setSortState={setSortState} />
                      <SortableHeader field="roas" label="ROAS" sortState={sortState} setSortState={setSortState} />
                      <SortableHeader field="lostBudget" label="Lost Budget IS%" sortState={sortState} setSortState={setSortState} />
                      <th className="px-4 py-2">Optimal Range</th>
                      <th className="px-4 py-2">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortData(filteredCampaignSummaries, sortState.field, sortState.direction)
                      .slice(0, rowLimit)
                      .map(summary => {
                        const campaign = campaigns.find(c => c.Campaign === summary.name);
                        return (
                          <tr key={summary.name} className="border-b border-border hover:bg-muted/50">
                            <td className="px-4 py-2">{summary.name}</td>
                            <td className="px-4 py-2">${Math.round(summary.cost).toLocaleString()}</td>
                            <td className="px-4 py-2">${Math.round(summary.revenue).toLocaleString()}</td>
                            <td className="px-4 py-2">${Math.round(summary.profit).toLocaleString()}</td>
                            <td className="px-4 py-2">{summary.roas.toFixed(1)}x</td>
                            <td className="px-4 py-2">
                              {campaign ? (campaign.LostToBudget > 0.05 ? (campaign.LostToBudget * 100).toFixed(1) : '0.0') : '0.0'}%
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
        </TabsContent>

        <TabsContent value="projections">
          <Card>
            <CardHeader>
              <CardTitle>Budget Change Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8 mb-6">
                <div className="flex-1">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-red-500">Decrease Loss-Making Campaigns</span>
                    <span className="text-sm font-medium">-{100 - decreasePercentage}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[decreasePercentage]}
                    onValueChange={(value) => setDecreasePercentage(value[0])}
                    className="flex-grow [&_[role=slider]]:rotate-180 [&_[data-orientation=horizontal]>.bg-primary]:bg-muted [&_[data-orientation=horizontal]>div:last-child]:bg-foreground"
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
                      <SortableHeader field="currentCost" label="Current Cost" sortState={projectionsSortState} setSortState={setProjectionsSortState} />
                      <SortableHeader field="currentProfit" label="Current Profit" sortState={projectionsSortState} setSortState={setProjectionsSortState} />
                      <th className="px-4 py-2">Current IS%</th>
                      <th className="px-4 py-2">Lost Budget $</th>
                      <th className="px-4 py-2">Projected Cost</th>
                      <th className="px-4 py-2">Projected Profit</th>
                      <th className="px-4 py-2">Projected IS%</th>
                      <SortableHeader field="percentChange" label="Change" sortState={projectionsSortState} setSortState={setProjectionsSortState} />
                      <SortableHeader field="profitChange" label="Profit Impact" sortState={projectionsSortState} setSortState={setProjectionsSortState} />
                      <th className="px-4 py-2">Budget IS Gain</th>
                      <th className="px-4 py-2">Rank IS Gain</th>
                      <th className="px-4 py-2">Change Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignProjections.slice(0, rowLimit).map(projection => {
                      const campaign = campaigns.find(c => c.Campaign === projection.name)!;
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
                                `${projection.profitChange > 0 ? '+' : ''}${Math.round(Math.abs(projection.profitChange)).toLocaleString()}`}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {projection.budgetGain > 0 && significantLostBudget > 0 ?
                              `${Math.round(projection.budgetGain).toLocaleString()}` :
                              '-'}
                          </td>
                          <td className="px-4 py-2">
                            {projection.rankGain > 0 ?
                              `${Math.round(projection.rankGain).toLocaleString()}` :
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
      </Tabs>
    </>
  );
}
