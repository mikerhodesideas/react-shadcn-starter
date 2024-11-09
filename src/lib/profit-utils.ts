// src/lib/profit-utils.ts

export interface Campaign {
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
  
  export interface OptimalZone {
    start: number;
    end: number;
    current: number;
    maxProfit: number;
  }
  
  export interface ProfitDataPoint {
    cost: number;
    sales: number;
    convValue: number;
    roas: number;
    profit: number;
    marginalROAS: number;
    aov: number;
  }
  
  export interface ProjectionConfig {
    currentCost: number;
    currentRevenue: number;
    conversions: number;
    cogsPercentage: number;
    impressionShare: number;
    scalingFactor?: number; // Default 0.4
  }
  
  /**
   * Calculates profit projections across a range of costs
   */
  export function calculateProfitProjections(config: ProjectionConfig): ProfitDataPoint[] {
    const {
      currentCost,
      currentRevenue,
      conversions,
      cogsPercentage,
      impressionShare,
      scalingFactor = 0.4
    } = config;
  
    const data: ProfitDataPoint[] = [];
    const numPoints = 100;
    const maxCost = currentCost * 3;
    const minCost = currentCost * 0.1;
    const step = (maxCost - minCost) / (numPoints - 1);
    
    // Calculate base metrics
    const baseAOV = conversions > 0 ? currentRevenue / conversions : 0;
  
    for (let i = 0; i < numPoints; i++) {
      const cost = minCost + i * step;
      
      // Scale sales based on cost using diminishing returns
      const scaleFactor = Math.pow(cost / currentCost, scalingFactor);
      const sales = conversions * scaleFactor;
      const convValue = sales * baseAOV;
      const roas = cost > 0 ? convValue / cost : 0;
      
      // Calculate profit
      const grossProfit = convValue * (1 - cogsPercentage / 100);
      const profit = grossProfit - cost;
  
      // Calculate marginal ROAS
      let marginalROAS = roas;
      if (i > 0) {
        const prevData = data[i - 1];
        const additionalCost = cost - prevData.cost;
        const additionalConvValue = convValue - prevData.convValue;
        marginalROAS = additionalCost > 0 ? additionalConvValue / additionalCost : 0;
      }
  
      data.push({
        cost,
        sales,
        convValue,
        roas,
        profit,
        marginalROAS,
        aov: baseAOV
      });
    }
  
    return data;
  }
  
  /**
   * Finds the optimal profit zone based on profit projections
   */
  export function findOptimalZone(profitData: ProfitDataPoint[], currentCost: number): OptimalZone {
    if (!profitData.length) {
      return { start: 0, end: 0, current: currentCost, maxProfit: 0 };
    }
  
    const maxProfitPoint = profitData.reduce((max, point) =>
      point.profit > max.profit ? point : max, profitData[0]
    );
  
    // Find range within 95% of max profit
    const profitThreshold = maxProfitPoint.profit * 0.95;
    const profitRange = profitData.filter(point => point.profit >= profitThreshold);
  
    return {
      start: Math.min(...profitRange.map(p => p.cost)),
      end: Math.max(...profitRange.map(p => p.cost)),
      current: currentCost,
      maxProfit: maxProfitPoint.profit
    };
  }
  
  /**
   * Determines the recommended budget change for a campaign
   */
  export function getRecommendation(campaign: Campaign, profitData: ProfitDataPoint[], optimalZone: OptimalZone) {
    const isHighIS = campaign.ImprShare >= 0.9;
    const currentProfit = profitData.find(p => Math.abs(p.cost - campaign.Cost) < 0.01)?.profit || 0;
    const significantLostBudget = campaign.LostToBudget > 0.05 ? campaign.LostToBudget : 0;
    const lostBudgetDollars = significantLostBudget > 0 ?
      (significantLostBudget / campaign.ImprShare) * campaign.Cost : 0;
  
    // Early return for high impression share campaigns
    if (isHighIS) {
      return {
        recommendation: 'optimal' as const,
        recommendationDetail: `Campaign already at ${(campaign.ImprShare * 100).toFixed(0)}% impression share. Maintaining current spend level.`,
        adjustmentPercent: 0
      };
    }
  
    // Calculate recommended adjustment
    let adjustmentPercent = 0;
    let recommendation: 'increase' | 'decrease' | 'optimal';
    let recommendationDetail: string;
  
    if (optimalZone.start === 0 && optimalZone.end === 0) {
      recommendation = 'decrease';
      recommendationDetail = 'Reduce spend to 0 as this campaign is not predicted to be profitable at any level of spend';
      adjustmentPercent = -100;
    } else if (campaign.Cost < optimalZone.start && currentProfit > 0) {
      recommendation = 'increase';
      if (significantLostBudget > 0) {
        recommendationDetail = `Increase spend to capture ${Math.round(lostBudgetDollars).toLocaleString()} in lost budget impression share. ` +
          `Current ROAS is ${(campaign.ConvValue / campaign.Cost).toFixed(1)}x with profit of ${Math.round(currentProfit).toLocaleString()}.`;
        adjustmentPercent = Math.min(100, (lostBudgetDollars / campaign.Cost) * 100);
      } else {
        recommendationDetail = `Increase spend to reach optimal range (minimum ${Math.round(optimalZone.start).toLocaleString()}). ` +
          `Current ROAS of ${(campaign.ConvValue / campaign.Cost).toFixed(1)}x with profit of ${Math.round(currentProfit).toLocaleString()} suggests room for growth.`;
        adjustmentPercent = Math.min(100, ((optimalZone.start - campaign.Cost) / campaign.Cost) * 100);
      }
    } else if (campaign.Cost > optimalZone.end) {
      recommendation = 'decrease';
      recommendationDetail = `Reduce spend to optimal maximum ($${Math.round(optimalZone.end).toLocaleString()}). ` +
        `Current spend of $${Math.round(campaign.Cost).toLocaleString()} exceeds profit-maximizing range.`;
      adjustmentPercent = Math.max(-100, ((optimalZone.end - campaign.Cost) / campaign.Cost) * 100);
    } else if (currentProfit <= 0) {
      recommendation = 'decrease';
      recommendationDetail = `Unprofitable at current spend level (ROAS: ${(campaign.ConvValue / campaign.Cost).toFixed(1)}x). ` +
        `Reduce spend to improve profitability.`;
      adjustmentPercent = -50; // Default reduction for unprofitable campaigns
    } else {
      recommendation = 'optimal';
      recommendationDetail = `Current spend is within optimal profit range. ` +
        `ROAS is ${(campaign.ConvValue / campaign.Cost).toFixed(1)}x generating ${Math.round(currentProfit).toLocaleString()} profit.`;
      adjustmentPercent = 0;
    }
  
    return {
      recommendation,
      recommendationDetail,
      adjustmentPercent: Math.round(adjustmentPercent)
    };
  }
  
  /**
   * Projects metrics based on a cost adjustment
   */
  export function projectMetrics(
    campaign: Campaign,
    adjustmentPercent: number,
    cogsPercentage: number,
    scalingFactor = 0.4
  ) {
    const projectedCost = campaign.Cost * (1 + adjustmentPercent / 100);
    const scaleFactor = Math.pow(projectedCost / campaign.Cost, scalingFactor);
    
    const currentIS = campaign.ImprShare * 100;
    let projectedIS = currentIS;
    
    // Adjust impression share based on cost changes
    if (projectedCost > campaign.Cost) {
      projectedIS = Math.min(90, currentIS + (projectedCost - campaign.Cost) / campaign.Cost * currentIS);
    } else if (adjustmentPercent < 0) {
      projectedIS = Math.max(1, currentIS * (projectedCost / campaign.Cost));
    }
  
    const projectedSales = campaign.Conversions * scaleFactor;
    const projectedRevenue = (campaign.ConvValue / campaign.Conversions) * projectedSales;
    const projectedGrossRevenue = projectedRevenue * (1 - cogsPercentage / 100);
    const projectedProfit = projectedGrossRevenue - projectedCost;
  
    return {
      projectedCost,
      projectedProfit,
      projectedIS,
      percentChange: adjustmentPercent,
      profitChange: projectedProfit - (campaign.ConvValue * (1 - cogsPercentage / 100) - campaign.Cost)
  };
}