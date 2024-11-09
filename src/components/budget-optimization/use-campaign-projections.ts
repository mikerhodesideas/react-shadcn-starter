// src/components/budget-optimization/use-campaign-projections.ts
import { useState, useMemo } from 'react';
import { Campaign } from '@/lib/profit-utils';
import { calculateProfitProjections, findOptimalZone, getRecommendation, projectMetrics } from '@/lib/profit-utils';
import { OptimizationMode, RowAdjustment, CampaignProjection } from './types';

export function useCampaignProjections(
  campaigns: Campaign[],
  cogsPercentage: number,
  optimizationMode: OptimizationMode,
  includeFilter: string,
  excludeFilter: string
) {
  const [rowAdjustments, setRowAdjustments] = useState<Record<string, RowAdjustment>>({});

  // Filter campaigns based on search criteria
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const name = campaign.Campaign?.toLowerCase() || '';
      const include = includeFilter?.toLowerCase() || '';
      const exclude = excludeFilter?.toLowerCase() || '';

      if (include && !name.includes(include)) return false;
      if (exclude && name.includes(exclude)) return false;

      return true;
    });
  }, [campaigns, includeFilter, excludeFilter]);

  // Calculate campaign projections
  const campaignProjections = useMemo((): CampaignProjection[] => {
    return filteredCampaigns.map(campaign => {
      // Calculate current profit curve
      const profitData = calculateProfitProjections({
        currentCost: campaign.Cost,
        currentRevenue: campaign.ConvValue,
        conversions: campaign.Conversions,
        cogsPercentage,
        impressionShare: campaign.ImprShare
      });

      // Find optimal zone
      const optimalZone = findOptimalZone(profitData, campaign.Cost);

      // Get recommendation
      const { recommendation, recommendationDetail, adjustmentPercent } = 
        getRecommendation(campaign, profitData, optimalZone);

      // Get or calculate adjustment percentage
      const currentAdjustment = rowAdjustments[campaign.Campaign]?.adjustment;
      const finalAdjustment = currentAdjustment !== undefined ? currentAdjustment : adjustmentPercent;

      // Project metrics based on adjustment
      const projectedMetrics = projectMetrics(campaign, finalAdjustment, cogsPercentage);

      return {
        name: campaign.Campaign,
        currentCost: campaign.Cost,
        currentProfit: campaign.ConvValue * (1 - cogsPercentage / 100) - campaign.Cost,
        projectedCost: projectedMetrics.projectedCost,
        projectedProfit: projectedMetrics.projectedProfit,
        percentChange: projectedMetrics.percentChange,
        profitChange: projectedMetrics.profitChange,
        currentIS: campaign.ImprShare * 100,
        projectedIS: projectedMetrics.projectedIS,
        changeReason: recommendationDetail,
        optimalMin: optimalZone.start,
        optimalMax: optimalZone.end,
        isHighIS: campaign.ImprShare >= 0.9
      };
    });
  }, [filteredCampaigns, cogsPercentage, rowAdjustments]);

  // Calculate overall projected metrics
  const projectedMetrics = useMemo(() => {
    const currentTotals = filteredCampaigns.reduce((acc, campaign) => ({
      cost: acc.cost + campaign.Cost,
      revenue: acc.revenue + campaign.ConvValue,
      profit: acc.profit + (campaign.ConvValue * (1 - cogsPercentage / 100) - campaign.Cost),
      conversions: acc.conversions + campaign.Conversions,
      impressions: acc.impressions + campaign.Impressions
    }), { cost: 0, revenue: 0, profit: 0, conversions: 0, impressions: 0 });

    const projectedTotals = campaignProjections.reduce((acc, proj) => ({
      cost: acc.cost + proj.projectedCost,
      revenue: acc.revenue + (proj.projectedCost * (proj.currentProfit / proj.currentCost)),
      profit: acc.profit + proj.projectedProfit,
      conversions: acc.conversions + (proj.projectedCost / (proj.currentCost / proj.currentProfit)),
      impressions: acc.impressions
    }), { cost: 0, revenue: 0, profit: 0, conversions: 0, impressions: 0 });

    return {
      current: currentTotals,
      projected: projectedTotals
    };
  }, [campaignProjections, filteredCampaigns, cogsPercentage]);

  return {
    campaignProjections,
    projectedMetrics,
    rowAdjustments,
    setRowAdjustments
  };
}