const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize Google Sheets API with service account credentials from environment variables
      const credentials = {
        type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: process.env.GOOGLE_AUTH_URI,
        token_uri: process.env.GOOGLE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
        universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
      };

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.readonly'
        ],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.drive = google.drive({ version: 'v3', auth });
      console.log('✅ Google Sheets API initialized successfully');
      console.log('📊 Connected to spreadsheet:', this.spreadsheetId);
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets API:', error.message);
    }
  }

  async getActiveVideos() {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('📊 Fetching active videos from QuestionBank worksheet...');

      // Fetch video data from Sheet1 worksheet
      // Columns: Clip_ID, Video_Title, Has_Intervention, Correct_Time, Is_Active, Drive_Link, Fire_Base_Link
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:G', // Extended to include Fire_Base_Link column
      });

      const rows = response.data.values || [];
      console.log(`📋 Found ${rows.length} total rows in QuestionBank`);

      if (rows.length === 0) {
        return [];
      }

      // Skip header row and filter for active videos
      const videos = rows.slice(1)
        .filter(row => {
          // Check if Is_Active column (index 4) is active (YES, TRUE, or true)
          const isActive = row[4] && (
            row[4].toString().toUpperCase() === 'YES' ||
            row[4].toString().toUpperCase() === 'TRUE' ||
            row[4] === true
          );
          return isActive && row[0]; // Also ensure Clip_ID exists
        })
        .map((row, index) => {
          // Parse correct time - handle both "MM:SS" format and decimal seconds
          let correctTime = null;
          if (row[3]) {
            const timeStr = row[3].toString().trim();
            if (timeStr.includes(':')) {
              // Convert MM:SS to seconds
              const [minutes, seconds] = timeStr.split(':').map(Number);
              correctTime = (minutes * 60) + seconds;
            } else if (timeStr !== '') {
              // Parse as decimal seconds
              correctTime = parseFloat(timeStr);
            }
          }
          
          // Use Fire_Base_Link if available, otherwise fall back to Drive_Link
          let videoUrl = '';
          const fireBaseLink = row[6] || ''; // Fire_Base_Link column (G)
          const originalDriveLink = row[5] || ''; // Drive_Link column (F)
          
          if (fireBaseLink.trim()) {
            // Use Firebase video link
            videoUrl = fireBaseLink.trim();
            console.log(`🔥 Using Fire_Base_Link for ${row[0]}: Firebase video URL`);
          } else if (originalDriveLink.trim()) {
            // Fall back to Drive_Link and convert to preview URL
            videoUrl = originalDriveLink.trim();
            if (videoUrl.includes('drive.google.com')) {
              // Extract file ID from Google Drive URL
              const fileIdMatch = videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
              if (fileIdMatch) {
                const fileId = fileIdMatch[1];
                // Convert to direct preview URL
                videoUrl = `https://drive.google.com/file/d/${fileId}/preview`;
              }
            }
            console.log(`⚠️ Using Drive_Link for ${row[0]}: Fire_Base_Link not available`);
          } else {
            console.warn(`❌ No video URL found for ${row[0]}: Both Fire_Base_Link and Drive_Link are empty`);
          }
          
          return {
            clipId: row[0],
            videoTitle: row[1] || '',
            hasIntervention: row[2] && (row[2].toString().toUpperCase() === 'TRUE' || row[2] === true),
            correctTime: correctTime,
            isActive: true, // We already filtered for active videos
            driveLink: videoUrl, // Primary video URL (Fire_Base_Link or processed Drive_Link)
            originalDriveLink: originalDriveLink, // Original Drive_Link for reference
            fireBaseLink: fireBaseLink, // Firebase video link for reference
            order: index + 1
          };
        });

      console.log(`✅ Found ${videos.length} active videos`);
      videos.forEach(video => {
        console.log(`   - ${video.clipId}: ${video.videoTitle} (Intervention: ${video.hasIntervention})`);
      });

      return videos;
    } catch (error) {
      console.error('❌ Error fetching active videos:', error);
      throw error;
    }
  }

  async processVideoLinks() {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('🔄 Processing video links...');

      // Fetch all data including Api_Drive_Link column (column G)
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:G',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log('📋 No data rows found to process');
        return { processed: 0, updated: 0 };
      }

      let processed = 0;
      let updated = 0;
      const updates = [];

      // Process each row (skip header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = i + 1; // 1-based row index for Google Sheets
        
        // Check if row has basic data
        if (!row[0] || !row[5]) continue; // Skip if no Clip_ID or Drive_Link
        
        const clipId = row[0];
        const driveLink = row[5];
        const apiDriveLink = row[6] || ''; // Api_Drive_Link column (may be empty)
        
        processed++;
        
        // If Api_Drive_Link is empty, process it
        if (!apiDriveLink.trim()) {
          console.log(`🔗 Processing ${clipId}: Converting Drive_Link to raw video link`);
          
          try {
            const rawVideoLink = await this.convertToRawVideoLink(driveLink);
            
            // Prepare update for this row
            updates.push({
              range: `Sheet1!G${rowIndex}`,
              values: [[rawVideoLink]]
            });
            
            updated++;
            console.log(`✅ ${clipId}: Raw video link generated`);
          } catch (error) {
            console.error(`❌ ${clipId}: Failed to convert link - ${error.message}`);
          }
        } else {
          console.log(`⏭️ ${clipId}: Api_Drive_Link already exists, skipping`);
        }
      }

      // Batch update all the Api_Drive_Link cells
      if (updates.length > 0) {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            valueInputOption: 'RAW',
            data: updates
          }
        });
        console.log(`✅ Updated ${updates.length} Api_Drive_Link entries`);
      }

      console.log(`🎯 Processing complete: ${processed} processed, ${updated} updated`);
      return { processed, updated };
      
    } catch (error) {
      console.error('❌ Error processing video links:', error);
      throw error;
    }
  }

  async convertToRawVideoLink(driveLink) {
    try {
      // Extract file ID from Google Drive URL
      const fileIdMatch = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (!fileIdMatch) {
        throw new Error('Invalid Google Drive URL format');
      }

      const fileId = fileIdMatch[1];
      
      // Get file metadata to ensure it exists and is accessible
      const fileMetadata = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,webViewLink'
      });

      // Check if it's a video file
      if (!fileMetadata.data.mimeType.startsWith('video/')) {
        console.warn(`⚠️ File ${fileId} is not a video (${fileMetadata.data.mimeType})`);
      }

      // Generate multiple video URL formats for better compatibility
      const urls = {
        preview: `https://drive.google.com/file/d/${fileId}/preview`,
        embed: `https://drive.google.com/file/d/${fileId}/preview?usp=embed`,
        direct: `https://drive.google.com/uc?id=${fileId}`,
        stream: `https://drive.google.com/file/d/${fileId}/view`
      };
      
      // Return the embed URL as primary (works best with iframe)
      const primaryUrl = urls.embed;
      
      console.log(`🎥 Generated video URLs for: ${fileMetadata.data.name}`);
      console.log(`   Primary: ${primaryUrl}`);
      return primaryUrl;
      
    } catch (error) {
      if (error.code === 404) {
        throw new Error('Video file not found or not accessible');
      } else if (error.code === 403) {
        throw new Error('Permission denied - check service account access');
      } else {
        throw new Error(`Drive API error: ${error.message}`);
      }
    }
  }

  async forceProcessVideoLinks() {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('🔄 Force processing video links (regenerating all)...');

      // Fetch all data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:G',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log('📋 No data rows found to process');
        return { processed: 0, updated: 0 };
      }

      let processed = 0;
      let updated = 0;
      const updates = [];

      // Process each row (skip header), forcing regeneration
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = i + 1; // 1-based row index for Google Sheets
        
        // Check if row has basic data
        if (!row[0] || !row[5]) continue; // Skip if no Clip_ID or Drive_Link
        
        const clipId = row[0];
        const driveLink = row[5];
        
        processed++;
        
        console.log(`🔗 Force processing ${clipId}: Regenerating video link`);
        
        try {
          const rawVideoLink = await this.convertToRawVideoLink(driveLink);
          
          // Prepare update for this row
          updates.push({
            range: `Sheet1!G${rowIndex}`,
            values: [[rawVideoLink]]
          });
          
          updated++;
          console.log(`✅ ${clipId}: New video link generated`);
        } catch (error) {
          console.error(`❌ ${clipId}: Failed to convert link - ${error.message}`);
        }
      }

      // Batch update all the Api_Drive_Link cells
      if (updates.length > 0) {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            valueInputOption: 'RAW',
            data: updates
          }
        });
        console.log(`✅ Force updated ${updates.length} Api_Drive_Link entries`);
      }

      console.log(`🎯 Force processing complete: ${processed} processed, ${updated} updated`);
      return { processed, updated };
      
    } catch (error) {
      console.error('❌ Error force processing video links:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
