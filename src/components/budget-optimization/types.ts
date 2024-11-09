// src/components/budget-optimization/types.ts

import { Campaign, OptimalZone } from '@/lib/profit-utils';

export interface RowAdjustment {
  campaignName: string;
  adjustment: number;  // -100 to +100
}

export interface CampaignProjection {
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
  optimalMin: number;
  optimalMax: number;
  isHighIS: boolean;
}

export type OptimizationMode = 'none' | 'conservative' | 'balanced' | 'aggressive';

export interface ProjectedMetrics {
  cost: number;
  revenue: number;
  profit: number;
  conversions: number;
  impressionShare: number;
  cpa: number;
  convRate: number;
  roas: number;
}

export interface BudgetOptimizationProps {
  campaigns: Campaign[];
  cogsPercentage: number;
  includeFilter: string;
  excludeFilter: string;
  rowLimit: number;
}

export type ProjectionFilter = 'all' | 'increase' | 'decrease' | 'nochange' | 'high-is';
