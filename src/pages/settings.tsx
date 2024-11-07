// src/pages/settings.tsx
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
import { GOOGLE_SHEET_URL, STORAGE_KEYS } from "@/lib/constants"
import { useCampaignStorage } from '@/services/data-service'
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { DATA_SOURCES, TabKey } from "@/lib/constants"
import { useCampaignData } from "@/contexts/campaign-data"

interface FetchStatusType {
  isLoading: boolean;
  rowCount?: number;
  error?: string;
  lastUpdated?: string;
}

// In settings.tsx
export default function Settings() {
  const navigate = useNavigate();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState(GOOGLE_SHEET_URL);
  const [progress, setProgress] = useState(0);

  // Initialize fetchStatus with all sources
  const [fetchStatus, setFetchStatus] = useState<Record<TabKey, FetchStatusType>>(() => 
    Object.entries(DATA_SOURCES).reduce((acc, [tab]) => ({
      ...acc,
      [tab]: {
        isLoading: false,
        rowCount: 0,
        lastUpdated: null
      }
    }), {} as Record<TabKey, FetchStatusType>)
  );
  
  // Get everything we need from context
  const { data, refreshData, lastUpdated, isStale } = useCampaignData();
  const { toast } = useToast();

  // Update fetchStatus when data changes
  useEffect(() => {
    if (data) {
      const updatedFetchStatus = { ...fetchStatus };
      
      Object.keys(DATA_SOURCES).forEach((tab) => {
        const tabKey = tab as TabKey;
        updatedFetchStatus[tabKey] = {
          isLoading: false,
          rowCount: data[tabKey]?.length || 0,
          lastUpdated: data.timestamp || null
        };
      });
      
      setFetchStatus(updatedFetchStatus);

      if (isStale) {
        console.log('Data is stale, auto-refreshing...');
        fetchAllData();
      }
    }
  }, [data]);

  const fetchTab = async (tab: string) => {
    setFetchStatus(prev => ({
      ...prev,
      [tab]: { isLoading: true }
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

      const data = await response.json();

      setFetchStatus(prev => ({
        ...prev,
        [tab]: {
          isLoading: false,
          rowCount: Array.isArray(data) ? data.length : 0
        }
      }));

      return data;
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
      setFetchStatus(prev => ({
        ...prev,
        [tab]: {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch'
        }
      }));
      throw error;
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    const totalTabs = Object.keys(DATA_SOURCES).length;
    let completedTabs = 0;

    try {
      const updatedData: Record<string, any> = { ...data } || {};

      for (const [tab, source] of Object.entries(DATA_SOURCES)) {
        try {
          const tabData = await fetchTab(tab);
          if (tabData) {
            updatedData[tab] = tabData;
          }
          completedTabs++;
          setProgress((completedTabs / totalTabs) * 100);
        } catch (error) {
          console.error(`Error fetching ${tab}:`, error);
        }
      }

      if (Object.keys(updatedData).length > 0) {
        if (!updatedData.timestamp) {
          updatedData.timestamp = new Date().toISOString();
        }
        localStorage.setItem(STORAGE_KEYS.CAMPAIGN_DATA, JSON.stringify(updatedData));
        refreshData();

        toast({
          title: "Data Updated",
          description: "Campaign data has been successfully refreshed. Taking you to analysis...",
        });

        // Add a small delay for the toast to be visible
        setTimeout(() => {
          navigate('/analysis');
        }, 1500);
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

      {/* Configuration Section */}
      <Accordion type="single" collapsible className="w-full mb-8">
        <AccordionItem value="configuration">
          <AccordionTrigger>Configuration and Installation</AccordionTrigger>
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
                      <TableCell className="font-medium">{source.title}</TableCell>
                      <TableCell>
                        {fetchStatus[tab as TabKey]?.error ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : fetchStatus[tab as TabKey]?.rowCount ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {fetchStatus[tab as TabKey]?.lastUpdated &&
                          new Date(fetchStatus[tab as TabKey].lastUpdated!).toLocaleString()}
                      </TableCell>
                      <TableCell>{fetchStatus[tab as TabKey]?.rowCount?.toLocaleString() || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Google Sheets Integration Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Google Sheets Integration</CardTitle>
          <CardDescription>
            Update campaign data from all sources
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
                {isLoading ? 'Loading...' : 'Update All Data'}
              </Button>
            </div>
            {isLoading && (
              <Progress value={progress} className="w-full" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}