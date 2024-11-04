export async function getFolderContents(folderId: string) {
  try {
    // First get the folder view page
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
    const response = await fetch(folderUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to access folder');
    }

    const html = await response.text();

    // Extract file IDs and names
    const fileRegex = /"([^"]+\.csv)","([^"]+)"/g;
    const matches = [...html.matchAll(fileRegex)];
    const files = matches.map(match => ({
      name: match[1],
      id: match[2]
    }));

    // Download each CSV file
    const csvFiles = await Promise.all(files.map(async (file) => {
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
      const fileResponse = await fetch(downloadUrl);
      const content = await fileResponse.text();
      
      return {
        name: file.name,
        id: file.id,
        content,
        timestamp: Date.now()
      };
    }));

    return {
      fileCount: csvFiles.length,
      files: csvFiles
    };

  } catch (error) {
    console.error('Error fetching folder contents:', error);
    throw error;
  }
} 