// src/services/data-service.ts
import { useLocalStorage } from '@/hooks/use-local-storage';
import { STORAGE_KEYS, CACHE_DURATION, DATA_SOURCES, TabKey } from '@/lib/constants';

export class DataService {
  static isDataStale(timestamp: string | null): boolean {
    if (!timestamp) return true;
    const timestampDate = new Date(timestamp).getTime();
    const now = new Date().getTime();
    return (now - timestampDate) > CACHE_DURATION;  // Using constant
  }

  static getLastUpdated(data: any): Date | null {
    return data?.timestamp ? new Date(data.timestamp) : null;
  }
}

// Type for our stored data structure
interface StoredCampaignData {
  timestamp: string;
  daily: any[];
  thirty_days: any[];
  hourly_today: any[];
  hourly_yesterday: any[];
  settings: any[];
  products: any[];
  channels: any[];
  pmax: any[];
}

// New hook that combines useLocalStorage with campaign data specifics
export function useCampaignStorage() {
  const [storedData, setStoredData] = useLocalStorage<StoredCampaignData | null>(
    STORAGE_KEYS.CAMPAIGN_DATA,  // Using constant
    null
  );

  const saveData = (newData: any) => {
    const dataWithTimestamp = {
      ...newData,
      timestamp: new Date().toISOString()
    };
    setStoredData(dataWithTimestamp);
  };

  const clearData = () => {
    setStoredData(null);
  };

  const getFetchStatus = () => {
    const status: Record<TabKey, { rowCount: number; lastUpdated: string | null }> = {} as any;
    
    if (storedData) {
      Object.keys(DATA_SOURCES).forEach((tab) => {
        const tabKey = tab as TabKey;
        const tabData = storedData[tabKey];
        status[tabKey] = {
          rowCount: Array.isArray(tabData) ? tabData.length : 0,
          lastUpdated: storedData.timestamp
        };
      });
    }

    return status;
  };

  return {
    data: storedData,
    saveData,
    clearData,
    getFetchStatus,
    isStale: DataService.isDataStale(storedData?.timestamp),
    lastUpdated: DataService.getLastUpdated(storedData)
  };
}