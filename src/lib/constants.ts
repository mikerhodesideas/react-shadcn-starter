// src/lib/constants.ts

export const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwre7Zv6QaL9bZsUexe5lhPOadnXCbKpo-hz1oF0RZgWh0rWD6-R7LKfzYCz4xjMIya/exec'

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
    description: 'Daily campaign performance metrics'
  },
  thirty_days: {
    title: '30 Day Data',
    description: 'Aggregated 30-day campaign performance'
  },
  hourly_today: {
    title: 'Today\'s Hourly',
    description: 'Hour-by-hour performance for today'
  },
  hourly_yesterday: {
    title: 'Yesterday\'s Hourly',
    description: 'Hour-by-hour performance for yesterday'
  },
  settings: {
    title: 'Campaign Settings',
    description: 'Campaign configuration and bid strategies'
  },
  products: {
    title: 'Product Data',
    description: 'Product-level performance metrics'
  },

  channels: {
    title: 'Channels',
    description: 'Performance by advertising channel'
  },
  pmax: {
    title: 'Performance Max',
    description: 'Performance Max campaign data'
  }
} as const

// Tab keys
export type TabKey = keyof typeof DATA_SOURCES

// Fetch status
export type FetchStatus = 'loading' | 'success' | 'error'


/*
  match_types: {
    title: 'Match Types',
    description: 'Performance by keyword match type'
  },
  search_terms: {
    title: 'Search Terms',
    description: 'Search query performance data'
  },
  */
 