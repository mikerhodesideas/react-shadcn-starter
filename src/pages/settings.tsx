'use client'

import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { GOOGLE_SHEET_URL, STORAGE_KEYS, DATA_SOURCES } from "@/lib/constants"
import { useCampaignStorage } from '@/services/data-service'
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { TabKey } from "@/lib/constants"
import { useCampaignData } from "@/contexts/campaign-data"
import { StorageData } from "@/types/metrics"

interface FetchStatusType {
  isLoading: boolean;
  rowCount?: number;
  error?: string;
  lastUpdated?: string;
}

const isDataStale = (lastUpdated: Date | null): boolean => {
  if (!lastUpdated) return true;
  const now = new Date();
  const diff = now.getTime() - lastUpdated.getTime();
  return diff > 24 * 60 * 60 * 1000;
};

export default function Settings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState(GOOGLE_SHEET_URL);
  const [progress, setProgress] = useState(0);

  // Initialize fetchStatus with all sources from DATA_SOURCES
  const [fetchStatus, setFetchStatus] = useState<Record<TabKey, FetchStatusType>>(() => 
    Object.keys(DATA_SOURCES).reduce((acc, tab) => ({
      ...acc,
      [tab]: {
        isLoading: false,
        rowCount: 0,
        lastUpdated: null
      }
    }), {} as Record<TabKey, FetchStatusType>)
  );
  
  const { data, refreshData, lastUpdated } = useCampaignData();
  const { toast } = useToast();
  const { saveData } = useCampaignStorage();

  // Update fetchStatus when data changes
  useEffect(() => {
    if (data) {
      const updatedFetchStatus = { ...fetchStatus };
      
      Object.keys(DATA_SOURCES).forEach((tab) => {
        const tabKey = tab as TabKey;
        const tabData = data[tabKey as keyof typeof data];
        
        updatedFetchStatus[tabKey] = {
          isLoading: false,
          rowCount: Array.isArray(tabData) ? tabData.length : 0,
          lastUpdated: data.timestamp
        };
      });
      
      setFetchStatus(updatedFetchStatus);

      if (isDataStale(lastUpdated)) {
        console.log('Data is stale, auto-refreshing...');
        fetchAllData();
      }
    }
  }, [data, lastUpdated]);

  const fetchTab = async (tab: string): Promise<any[] | null> => {
    setFetchStatus(prev => ({
      ...prev,
      [tab]: { ...prev[tab as TabKey], isLoading: true }
    }));

    const url = `${sheetUrl}?tab=${tab}`;
    console.log(`Fetching ${tab} data from:`, url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Validate that we received an array
      if (!Array.isArray(responseData)) {
        throw new Error(`Invalid data format for ${tab}`);
      }

      setFetchStatus(prev => ({
        ...prev,
        [tab]: {
          isLoading: false,
          rowCount: responseData.length,
          lastUpdated: new Date().toISOString()
        }
      }));

      return responseData;
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
      setFetchStatus(prev => ({
        ...prev,
        [tab]: {
          ...prev[tab as TabKey],
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch'
        }
      }));
      return null;
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    console.log('Available DATA_SOURCES:', Object.keys(DATA_SOURCES));

    const totalTabs = Object.keys(DATA_SOURCES).length;
    let completedTabs = 0;
    let hasErrors = false;

    try {
      const updatedData: Partial<StorageData> = {
        timestamp: new Date().toISOString()
      };

      for (const [tab, source] of Object.entries(DATA_SOURCES)) {
        try {
          console.log(`Attempting to fetch ${tab} data...`);
          const tabData = await fetchTab(tab);
          if (tabData) {
            (updatedData[tab as keyof StorageData] as any) = tabData;
            completedTabs++;
          } else {
            hasErrors = true;
          }
          setProgress((completedTabs / totalTabs) * 100);
        } catch (error) {
          console.error(`Error fetching ${tab}:`, error);
          hasErrors = true;
        }
      }

      if (Object.keys(updatedData).length > 1) { // More than just timestamp
        localStorage.setItem(STORAGE_KEYS.CAMPAIGN_DATA, JSON.stringify(updatedData));
        refreshData();

        if (hasErrors) {
          toast({
            title: "Partial Update",
            description: "Some data was updated, but errors occurred. Check the table for details.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Data Updated",
            description: "Campaign data has been successfully refreshed. Taking you to analysis...",
          });

          setTimeout(() => {
            navigate('/analysis');
          }, 1500);
        }
      } else {
        throw new Error('No valid data received from any tab');
      }
    } catch (error) {
      console.error('Error in fetch process:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch data',
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-2">Campaign Data Settings</h1>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
          {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleString()}`}
        </p>
        <p className="text-sm text-muted-foreground">
          Data automatically refreshes every 24 hours
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full mb-8">
        <AccordionItem value="configuration">
          <AccordionTrigger>Data Source Status</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(DATA_SOURCES).map(([tab, source]) => (
                    <TableRow key={tab}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{source.title}</div>
                          <div className="text-xs text-muted-foreground">{source.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {fetchStatus[tab as TabKey]?.error ? (
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                            <span className="text-xs text-destructive">Error</span>
                          </div>
                        ) : fetchStatus[tab as TabKey]?.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : fetchStatus[tab as TabKey]?.rowCount ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {fetchStatus[tab as TabKey]?.lastUpdated && 
                          new Date(fetchStatus[tab as TabKey].lastUpdated!).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {fetchStatus[tab as TabKey]?.rowCount?.toLocaleString() || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Update Campaign Data</CardTitle>
          <CardDescription>
            Fetch latest data from all sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-2">
              <Input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="Enter Google Sheets Web App URL"
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={fetchAllData}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Updating...' : 'Update All Data'}
              </Button>
            </div>
            {isLoading && (
              <Progress value={progress} className="w-full" />
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}