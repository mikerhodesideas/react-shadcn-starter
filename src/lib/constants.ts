// src/lib/constants.ts

export const GOOGLE_SHEET_URL = import.meta.env.DEV 
  ? 'https://script.google.com/macros/s/AKfycbwre7Zv6QaL9bZsUexe5lhPOadnXCbKpo-hz1oF0RZgWh0rWD6-R7LKfzYCz4xjMIya/exec'
  : '' // Only use test URL in development mode

export const STORAGE_KEYS = {
  CAMPAIGN_DATA: 'campaignData',
  ROW_LIMIT: 'campaign_row_limit'
} as const

// Cache duration in milliseconds
export const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// API endpoints
export const API = {
  SHEET_DATA: GOOGLE_SHEET_URL
} as const 

// Data sources
export const DATA_SOURCES = {
  daily: {
    title: 'Daily Data',
    description: 'Daily campaign metrics'
  },
  thirty_days: {
    title: '30 Day Data',
    description: '30-day aggregated metrics'
  },
  previous_thirty_days: {
    title: 'Previous 30 Days',
    description: '31-60 day comparison metrics'
  },
  seven_days: {
    title: '7 Day Data',
    description: '7-day aggregated metrics'
  },
  previous_seven_days: {
    title: 'Previous 7 Days',
    description: '8-14 day comparison metrics'
  },
  hourly_today: {
    title: 'Today\'s Hourly',
    description: 'Hourly metrics for today'
  },
  hourly_yesterday: {
    title: 'Yesterday\'s Hourly',
    description: 'Hourly metrics for yesterday'
  },
  settings: {
    title: 'Campaign Settings',
    description: 'Campaign settings and configuration'
  },
  products: {
    title: 'Product Data',
    description: 'Product performance metrics'
  },
  match_types: {
    title: 'Match Types',
    description: 'Performance by keyword match type'
  },
  search_terms: {
    title: 'Search Terms',
    description: 'Search query performance data'
  },
  channels: {
    title: 'Channels',
    description: 'Channel performance metrics'
  },
  pmax: {
    title: 'Performance Max',
    description: 'Performance Max campaign metrics'
  }
} as const;

// Tab keys
export type TabKey = keyof typeof DATA_SOURCES

// Fetch status
export type FetchStatus = 'loading' | 'success' | 'error'

