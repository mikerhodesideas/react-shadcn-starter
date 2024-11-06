// src/types/metrics.ts

// Base metrics that appear in most data
export interface BaseMetrics {
  Impressions: number;
  Clicks: number;
  Cost: number;
  Conversions: number;
  ConvValue: number;
}

// Campaign-specific metrics that include impression share data
export interface CampaignMetrics extends BaseMetrics {
  ImprShare: number;
  LostToBudget: number;
  LostToRank: number;
}

// Daily and hourly campaign data
export interface CampaignTimeData extends CampaignMetrics {
  Campaign: string;
  CampaignId: string;
}

// Specific interfaces for each data type
export interface DailyData extends CampaignTimeData {
  Date: string;
}

export interface HourlyData extends CampaignTimeData {
  Hour: number;
}

export interface ThirtyDayData extends CampaignTimeData {
  // Same as CampaignTimeData but without date
}

export interface CampaignSettings {
  BidStrategy: string;
  BidStatus: string;
  BidType: string;
  Budget: number;
  Group: string;
  Channel: string;
  SubChannel: string;
  OptStatus: string;
  CampaignId: string;
  Labels: string;
  Campaign: string;
  TargetCPA: number | null;
  TargetROAS: number | null;
  MaxCPC: number;
  RTBOptIn: boolean;
  StatusReasons: string;
  PrimaryStatus: string;
  ServingStatus: string;
  Status: string;
  OptOutURLExp: boolean;
}

export interface ProductData extends BaseMetrics {
  ProductId: string;
  ProductTitle: string;
}

export interface MatchTypeData extends BaseMetrics {
  KeywordMatchType: string;
}

export interface SearchTermData extends BaseMetrics {
  SearchTerm: string;
}

export interface ChannelData extends BaseMetrics {
  Channel: string;
}

export interface PMaxData extends BaseMetrics {
  Date: string;
}

// Combined data structure for storage
export interface StorageData {
  timestamp: string;
  daily: DailyData[];
  hourly_today: HourlyData[];
  hourly_yesterday: HourlyData[];
  thirty_days: ThirtyDayData[];
  settings: CampaignSettings[];
  products: ProductData[];
  match_types: MatchTypeData[];
  search_terms: SearchTermData[];
  channels: ChannelData[];
  pmax: PMaxData[];
}