import Papa from 'papaparse';

interface DriveFile {
  id: string;
  name: string;
  content: string;
  timestamp: string;
}

interface CacheEntry {
  data: DriveFile[];
  timestamp: number;
}

class DriveDownloader {
  private static CACHE_PREFIX = 'drive_folder_';
  private static EXPIRY_HOURS = 6;

  private static getCachedData(folderId: string): DriveFile[] | null {
    try {
      const cacheKey = this.CACHE_PREFIX + folderId;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const { data, timestamp }: CacheEntry = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age > this.EXPIRY_HOURS * 60 * 60 * 1000) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache error:', error);
      return null;
    }
  }

  private static cacheData(folderId: string, data: DriveFile[]): void {
    try {
      const cacheKey = this.CACHE_PREFIX + folderId;
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  private static extractFileIds(html: string): string[] {
    const fileIdRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/g;
    const matches = [...html.matchAll(fileIdRegex)];
    return [...new Set(matches.map(match => match[1]))];
  }

  private static extractFileName(html: string, fileId: string): string {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    return titleMatch ? 
      titleMatch[1].replace(' - Google Drive', '') : 
      `file_${fileId}.csv`;
  }

  private static async processFile(fileId: string): Promise<DriveFile | null> {
    try {
      const metadataResponse = await fetch(
        `https://drive.google.com/file/d/${fileId}/view`
      );
      
      if (!metadataResponse.ok) return null;
      
      const metadataHtml = await metadataResponse.text();
      const fileName = this.extractFileName(metadataHtml, fileId);
      
      if (!fileName.toLowerCase().endsWith('.csv')) {
        return null;
      }

      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const downloadResponse = await fetch(downloadUrl);
      
      if (!downloadResponse.ok) {
        throw new Error(`Failed to download ${fileName}`);
      }

      const content = await downloadResponse.text();

      const parseResult = await new Promise(resolve => {
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: (error) => {
            console.error('CSV parse error:', error);
            resolve(null);
          }
        });
      });

      if (!parseResult) {
        throw new Error(`Invalid CSV format: ${fileName}`);
      }

      return {
        id: fileId,
        name: fileName,
        content,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error processing file ${fileId}:`, error);
      return null;
    }
  }

  static async downloadFromFolder(folderId: string): Promise<DriveFile[]> {
    try {
      const cached = this.getCachedData(folderId);
      if (cached) {
        console.log('Returning cached data');
        return cached;
      }

      const folderResponse = await fetch(
        `https://drive.google.com/drive/folders/${folderId}`
      );

      if (!folderResponse.ok) {
        throw new Error('Failed to access folder');
      }

      const folderHtml = await folderResponse.text();
      const fileIds = this.extractFileIds(folderHtml);

      const files = await Promise.all(
        fileIds.map(fileId => this.processFile(fileId))
      );

      const validFiles = files.filter((file): file is DriveFile => file !== null);

      this.cacheData(folderId, validFiles);

      return validFiles;

    } catch (error) {
      console.error('Error downloading from folder:', error);
      throw error;
    }
  }

  static clearCache(folderId?: string): void {
    if (folderId) {
      localStorage.removeItem(this.CACHE_PREFIX + folderId);
    } else {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    }
  }
}

export default DriveDownloader; 