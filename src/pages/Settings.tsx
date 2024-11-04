'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DriveDownloader from '@/lib/drive-downloader'

interface CacheStatus {
  timestamp: number;
  fileCount: number;
}

const TEST_FOLDER_ID = '1In-JbYLAim0OoCrQw0uvvHTtBofTNROk';

export default function Settings() {
  const [folderId, setFolderId] = useState(TEST_FOLDER_ID)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null)

  // Check cache status on mount
  useEffect(() => {
    const cacheKey = `drive_folder_${TEST_FOLDER_ID}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      setCacheStatus({
        timestamp,
        fileCount: data.length
      });
    }
  }, []);

  const handleRefresh = async () => {
    if (!folderId) {
      toast({
        title: "Error",
        description: "Please enter a folder ID",
        variant: "destructive",
      })
      return
    }

    setIsRefreshing(true)
    try {
      const files = await DriveDownloader.downloadFromFolder(folderId);
      
      setCacheStatus({
        timestamp: Date.now(),
        fileCount: files.length
      });

      toast({
        title: "CSV Files Refreshed",
        description: `Successfully refreshed ${files.length} files.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh CSV files",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const clearCache = () => {
    DriveDownloader.clearCache(folderId);
    setCacheStatus(null);
    toast({
      title: "Cache Cleared",
      description: "CSV file cache has been cleared.",
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV Data Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-id">Google Drive Folder ID</Label>
            <Input
              id="folder-id"
              placeholder="Enter the shared folder ID"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Using test folder with 6 CSV files: 30day_totals.csv, campaign_settings.csv, daily_metrics.csv, etc.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing CSV Files...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh CSV Files
                </>
              )}
            </Button>

            <Button
              onClick={clearCache}
              variant="outline"
              disabled={isRefreshing || !cacheStatus}
            >
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Last Updated:</span>
              <span className="text-muted-foreground">
                {cacheStatus ? new Date(cacheStatus.timestamp).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Files Cached:</span>
              <span className="text-muted-foreground">
                {cacheStatus?.fileCount || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 