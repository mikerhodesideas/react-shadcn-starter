// src/contexts/campaign-data.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { DataService } from '@/services/data-service';
import { STORAGE_KEYS } from '@/lib/constants';

interface CampaignDataContextType {
  data: any;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => void;
}

const CampaignDataContext = createContext<CampaignDataContextType | undefined>(undefined);

export function CampaignDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshData = () => {
    setIsLoading(true);
    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_DATA);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setData(parsedData);
        setLastUpdated(new Date(parsedData.timestamp));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <CampaignDataContext.Provider value={{
      data,
      isLoading,
      error,
      lastUpdated,
      refreshData
    }}>
      {children}
    </CampaignDataContext.Provider>
  );
}

export function useCampaignData() {
  const context = useContext(CampaignDataContext);
  if (!context) {
    throw new Error('useCampaignData must be used within a CampaignDataProvider');
  }
  return context;
}