const { google } = require('googleapis');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.examResultsSpreadsheetId = process.env.EXAM_RESULTS_SPREADSHEET_ID || '16Z0UWUup7zk3Rw2rOXXCW16o8XzNyrDVXNtt0EP7r0s';
    this.credentialsPath = '/Users/apple/Documents/Apis/sheet-api.json';
    this.initialize();
  }

  async initialize() {
    try {
      // Try to load credentials from JSON file first
      let credentials;
      try {
        const fs = require('fs');
        if (fs.existsSync(this.credentialsPath)) {
          console.log('📁 Loading Google Sheets credentials from JSON file...');
          const credentialsFile = fs.readFileSync(this.credentialsPath, 'utf8');
          credentials = JSON.parse(credentialsFile);
          console.log('✅ Credentials loaded from JSON file');
        } else {
          throw new Error('Credentials file not found');
        }
      } catch (fileError) {
        console.log('⚠️ Could not load credentials from JSON file, trying environment variables...');
        
        // Fallback to environment variables
        const hasCredentials = process.env.GOOGLE_CLIENT_EMAIL && 
                              process.env.GOOGLE_PRIVATE_KEY && 
                              process.env.GOOGLE_PROJECT_ID;

        if (!hasCredentials) {
          console.log('⚠️ Google Sheets credentials not configured - running in demo mode');
          console.log('📝 To enable Google Sheets integration, either:');
          console.log('   1. Place credentials in: /Users/apple/Documents/Apis/sheet-api.json');
          console.log('   2. Or configure environment variables');
          this.sheets = null;
          this.drive = null;
          return;
        }

        credentials = {
          type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE || 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: process.env.GOOGLE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
          token_uri: process.env.GOOGLE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
          client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
          universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || 'googleapis.com'
        };
      }

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
      console.log('⚠️ Running in demo mode without Google Sheets integration');
      this.sheets = null;
      this.drive = null;
    }
  }

  async getActiveVideos() {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        console.log('⚠️ Google Sheets not available - returning demo videos');
        // Return demo videos for testing
        return [
          {
            clipId: 'DEMO_001',
            videoTitle: 'Demo Video 1 - No Intervention',
            hasIntervention: false,
            correctTime: 15.5,
            isActive: true,
            driveLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
            originalDriveLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
            fireBaseLink: '',
            order: 1
          },
          {
            clipId: 'DEMO_002',
            videoTitle: 'Demo Video 2 - With Intervention',
            hasIntervention: true,
            correctTime: 22.0,
            isActive: true,
            driveLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
            originalDriveLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
            fireBaseLink: '',
            order: 2
          }
        ];
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
          
          // Check if the Drive_Link column contains Firebase URLs (common case)
          if (originalDriveLink.includes('firebasestorage.googleapis.com')) {
            // Drive_Link column actually contains Firebase URL
            videoUrl = originalDriveLink.trim();
            console.log(`🔥 Using Firebase URL from Drive_Link for ${row[0]}: Firebase video URL`);
          } else if (fireBaseLink.trim() && fireBaseLink !== '1' && fireBaseLink !== '2' && fireBaseLink !== '3') {
            // Use Fire_Base_Link if it's not just a placeholder number
            videoUrl = fireBaseLink.trim();
            console.log(`🔥 Using Fire_Base_Link for ${row[0]}: Firebase video URL`);
          } else if (originalDriveLink.trim() && originalDriveLink !== '1' && originalDriveLink !== '2' && originalDriveLink !== '3') {
            // Fall back to Drive_Link and convert to preview URL if it's not a placeholder
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
            console.warn(`❌ No valid video URL found for ${row[0]}: Both Fire_Base_Link and Drive_Link are empty or contain placeholder values`);
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

  async setupExamResultsSheet() {
    try {
      if (!this.sheets || !this.spreadsheetId || !this.examResultsSpreadsheetId) {
        console.log('⚠️ Google Sheets not available - returning demo response');
        return {
          processed: 0,
          created: 0,
          existing: 0,
          clipIds: [],
          newColumns: [],
          columnPairs: [],
          demo: true,
          message: 'Google Sheets integration not configured - running in demo mode'
        };
      }

      console.log('📊 Setting up Exam_Results sheet...');
      console.log('📊 QuestionBank Spreadsheet ID:', this.spreadsheetId);
      console.log('📊 Exam_Results Spreadsheet ID:', this.examResultsSpreadsheetId);

      // First, get all Clip_IDs from QuestionBank (in the main spreadsheet)
      const questionBankResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:A', // Only Clip_ID column
      });

      const questionBankRows = questionBankResponse.data.values || [];
      if (questionBankRows.length <= 1) {
        console.log('📋 No Clip_IDs found in QuestionBank');
        return { processed: 0, created: 0, existing: 0 };
      }

      // Extract Clip_IDs (skip header row)
      const clipIds = questionBankRows.slice(1)
        .map(row => row[0])
        .filter(clipId => clipId && clipId.trim()); // Filter out empty values

      console.log(`📋 Found ${clipIds.length} Clip_IDs in QuestionBank:`, clipIds);

      // Get current Exam_Results sheet structure (from the separate Exam_Results spreadsheet)
      let examResultsResponse;
      let existingColumns = [];
      
      try {
        examResultsResponse = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.examResultsSpreadsheetId,
          range: 'Sheet1!1:1', // First row to check existing columns (Exam_Results spreadsheet uses Sheet1)
        });
        existingColumns = examResultsResponse.data.values?.[0] || [];
        console.log('📋 Existing columns in Exam_Results:', existingColumns);
      } catch (error) {
        console.log('📋 Exam_Results sheet not accessible:', error.message);
        console.log('⚠️ Exam_Results spreadsheet exists but may need proper permissions');
        existingColumns = [];
      }

      // Create column pairs for each Clip_ID: [Clip_ID, Clip_ID_Reaction_time]
      const requiredColumns = [];
      clipIds.forEach(clipId => {
        requiredColumns.push(clipId); // Clip_ID column
        requiredColumns.push(`${clipId}_Reaction_time`); // Clip_ID_Reaction_time column
      });

      // Determine which columns need to be created
      const columnsToCreate = requiredColumns.filter(column => !existingColumns.includes(column));
      const existingColumnsCount = requiredColumns.filter(column => existingColumns.includes(column)).length;

      console.log(`📊 Required columns: ${requiredColumns.length} (${clipIds.length} Clip_ID pairs)`);
      console.log(`📊 Columns to create: ${columnsToCreate.length}`);
      console.log(`📊 Existing columns: ${existingColumnsCount}`);

      let createdColumns = 0;

      // Create missing columns by adding them to the header row
      if (columnsToCreate.length > 0) {
        // Prepare the header row with existing columns + new columns
        const newHeaderRow = [...existingColumns, ...columnsToCreate];
        
        // If no existing columns, add basic headers first (matching existing structure)
        if (existingColumns.length === 0) {
          newHeaderRow.unshift('User_ID', 'Start_Time', 'End_Time', 'Total_Score', 'Status');
        }

        // Update the header row in the Exam_Results spreadsheet
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.examResultsSpreadsheetId,
          range: 'Sheet1!1:1', // Exam_Results spreadsheet uses Sheet1
          valueInputOption: 'RAW',
          resource: {
            values: [newHeaderRow]
          }
        });

        createdColumns = columnsToCreate.length;
        console.log(`✅ Created ${createdColumns} new columns in Exam_Results`);
        
        // Log the created column pairs
        const createdPairs = [];
        for (let i = 0; i < columnsToCreate.length; i += 2) {
          const clipId = columnsToCreate[i];
          const reactionTimeColumn = columnsToCreate[i + 1];
          if (reactionTimeColumn && reactionTimeColumn.includes('_Reaction_time')) {
            createdPairs.push(`${clipId} + ${reactionTimeColumn}`);
          }
        }
        console.log(`📋 Created column pairs:`, createdPairs);
      }

      const result = {
        processed: clipIds.length,
        created: createdColumns,
        existing: existingColumnsCount,
        clipIds: clipIds,
        newColumns: columnsToCreate,
        columnPairs: clipIds.map(clipId => ({
          clipId: clipId,
          clipIdColumn: clipId,
          reactionTimeColumn: `${clipId}_Reaction_time`
        }))
      };

      console.log('🎯 Exam_Results sheet setup complete:', result);
      return result;

    } catch (error) {
      console.error('❌ Error setting up Exam_Results sheet:', error);
      throw error;
    }
  }

  async recordExamResponse(responseData) {
    try {
      if (!this.sheets || !this.examResultsSpreadsheetId) {
        console.log('⚠️ Google Sheets not available - logging demo response');
        console.log('📝 Demo response data:', responseData);
        return {
          success: true,
          rowIndex: 1,
          clipIdColumn: responseData.clipId,
          reactionTimeColumn: `${responseData.clipId}_Reaction_time`,
          score: responseData.score,
          reactionTime: responseData.reactionTime,
          demo: true,
          message: 'Response logged in demo mode - Google Sheets not configured'
        };
      }

      const { 
        operatorId, 
        clipId, 
        hasIntervention, 
        correctTime, 
        userPressTime, 
        reactionTime, 
        score,
        sessionId
      } = responseData;

      console.log('📝 Recording exam response:', { operatorId, clipId, score, reactionTime, sessionId });

      // Get current Exam_Results sheet structure to find column indices
      const headerResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.examResultsSpreadsheetId,
        range: 'Sheet1!1:1',
      });

      const headers = headerResponse.data.values?.[0] || [];
      console.log('📋 Exam_Results headers:', headers);

      // Find column indices for this Clip_ID
      const clipIdColumnIndex = headers.indexOf(clipId);
      const reactionTimeColumnIndex = headers.indexOf(`${clipId}_Reaction_time`);

      console.log(`🔍 Looking for columns: ${clipId} (index: ${clipIdColumnIndex}), ${clipId}_Reaction_time (index: ${reactionTimeColumnIndex})`);

      if (clipIdColumnIndex === -1 || reactionTimeColumnIndex === -1) {
        console.error(`❌ Columns not found for Clip_ID: ${clipId}`);
        console.error(`Available columns:`, headers);
        throw new Error(`Columns not found for Clip_ID: ${clipId}. Available columns: ${headers.join(', ')}`);
      }

      // Find or create a row for this operator's exam session
      const dataResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.examResultsSpreadsheetId,
        range: 'Sheet1!A:Z', // Get all data to find existing row
      });

      const rows = dataResponse.data.values || [];
      let targetRowIndex = -1;

      // Look for existing row with matching User_ID (which is the operatorId)
      console.log(`🔍 Looking for existing row with User_ID: ${operatorId}`);
      for (let i = 1; i < rows.length; i++) { // Skip header row
        const row = rows[i];
        const rowUserId = row[0]; // User_ID column (index 0)
        console.log(`   Row ${i}: User_ID = "${rowUserId}"`);
        
        if (rowUserId === operatorId) {
          targetRowIndex = i + 1; // 1-based row index
          console.log(`✅ Found existing row at index ${targetRowIndex}`);
          break;
        }
      }

      // If no existing row found, create a new one
      if (targetRowIndex === -1) {
        console.log(`📝 Creating new row for User_ID: ${operatorId}`);
        const newRow = [
          operatorId, // User_ID (index 0)
          new Date().toISOString(), // Start_Time (index 1)
          '', // End_Time (index 2) - will be updated when exam completes
          0, // Total_Score (index 3) - will be calculated
          'In Progress' // Status (index 4)
        ];

        // Add empty values for all Clip_ID columns (starting from index 5)
        for (let i = 5; i < headers.length; i++) {
          newRow.push('');
        }

        console.log(`📝 New row data:`, newRow);

        // Append the new row
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.examResultsSpreadsheetId,
          range: 'Sheet1!A:Z',
          valueInputOption: 'RAW',
          resource: {
            values: [newRow]
          }
        });

        // Get the new row index
        const updatedDataResponse = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.examResultsSpreadsheetId,
          range: 'Sheet1!A:Z',
        });
        targetRowIndex = updatedDataResponse.data.values.length;
        console.log(`✅ Created new row at index ${targetRowIndex}`);
      }

      // Update the specific cells for this Clip_ID
      const clipIdColumn = String.fromCharCode(65 + clipIdColumnIndex);
      const reactionTimeColumn = String.fromCharCode(65 + reactionTimeColumnIndex);
      
      const updates = [
        {
          range: `Sheet1!${clipIdColumn}${targetRowIndex}`,
          values: [[score]] // Clip_ID column gets the score (0 or 1)
        },
        {
          range: `Sheet1!${reactionTimeColumn}${targetRowIndex}`,
          values: [[reactionTime !== null ? reactionTime.toFixed(3) : '']] // Reaction_time column
        }
      ];

      console.log(`📝 Updating cells: ${clipIdColumn}${targetRowIndex}=${score}, ${reactionTimeColumn}${targetRowIndex}=${reactionTime !== null ? reactionTime.toFixed(3) : 'null'}`);

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.examResultsSpreadsheetId,
        resource: {
          valueInputOption: 'RAW',
          data: updates
        }
      });

      console.log(`✅ Recorded response for ${clipId}: Score=${score}, ReactionTime=${reactionTime}`);

      return {
        success: true,
        rowIndex: targetRowIndex,
        clipIdColumn: clipId,
        reactionTimeColumn: `${clipId}_Reaction_time`,
        score: score,
        reactionTime: reactionTime
      };

    } catch (error) {
      console.error('❌ Error recording exam response:', error);
      throw error;
    }
  }

  async updateExamStatus(statusData) {
    try {
      if (!this.sheets || !this.examResultsSpreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      const { operatorId, sessionId, status, endTime, totalScore } = statusData;

      console.log('📝 Updating exam status:', { operatorId, sessionId, status, endTime, totalScore });

      // Get current Exam_Results sheet data
      const dataResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.examResultsSpreadsheetId,
        range: 'Sheet1!A:Z',
      });

      const rows = dataResponse.data.values || [];
      let targetRowIndex = -1;

      // Look for existing row with matching User_ID (which is the operatorId)
      for (let i = 1; i < rows.length; i++) { // Skip header row
        const row = rows[i];
        const rowUserId = row[0]; // User_ID column (index 0)
        
        if (rowUserId === operatorId) {
          targetRowIndex = i + 1; // 1-based row index
          break;
        }
      }

      // If no existing row found, create a new one
      if (targetRowIndex === -1) {
        console.log(`📝 Creating new row for User_ID: ${operatorId} during status update`);
        const newRow = [
          operatorId, // User_ID (index 0)
          new Date().toISOString(), // Start_Time (index 1)
          endTime || '', // End_Time (index 2)
          totalScore || 0, // Total_Score (index 3)
          status || 'Completed' // Status (index 4)
        ];

        // Get headers to determine how many columns we need
        const headerResponse = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.examResultsSpreadsheetId,
          range: 'Sheet1!1:1',
        });

        const headers = headerResponse.data.values?.[0] || [];
        
        // Add empty values for all Clip_ID columns (starting from index 5)
        for (let i = 5; i < headers.length; i++) {
          newRow.push('');
        }

        console.log(`📝 New row data for status update:`, newRow);

        // Append the new row
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.examResultsSpreadsheetId,
          range: 'Sheet1!A:Z',
          valueInputOption: 'RAW',
          resource: {
            values: [newRow]
          }
        });

        // Get the new row index
        const updatedDataResponse = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.examResultsSpreadsheetId,
          range: 'Sheet1!A:Z',
        });
        targetRowIndex = updatedDataResponse.data.values.length;
        console.log(`✅ Created new row at index ${targetRowIndex}`);

        // Return early since we already set the status when creating the row
        return {
          success: true,
          rowIndex: targetRowIndex,
          status: status,
          endTime: endTime,
          totalScore: totalScore,
          created: true
        };
      }

      // Get headers to find column indices
      const headerResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.examResultsSpreadsheetId,
        range: 'Sheet1!1:1',
      });

      const headers = headerResponse.data.values?.[0] || [];
      const endTimeColumnIndex = headers.indexOf('End_Time');
      const totalScoreColumnIndex = headers.indexOf('Total_Score');
      const statusColumnIndex = headers.indexOf('Status');

      // Prepare updates
      const updates = [];

      if (endTimeColumnIndex !== -1) {
        updates.push({
          range: `Sheet1!${String.fromCharCode(65 + endTimeColumnIndex)}${targetRowIndex}`,
          values: [[endTime]]
        });
      }

      if (totalScoreColumnIndex !== -1 && totalScore !== undefined) {
        updates.push({
          range: `Sheet1!${String.fromCharCode(65 + totalScoreColumnIndex)}${targetRowIndex}`,
          values: [[totalScore]]
        });
      }

      if (statusColumnIndex !== -1) {
        updates.push({
          range: `Sheet1!${String.fromCharCode(65 + statusColumnIndex)}${targetRowIndex}`,
          values: [[status]]
        });
      }

      if (updates.length > 0) {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.examResultsSpreadsheetId,
          resource: {
            valueInputOption: 'RAW',
            data: updates
          }
        });

        console.log(`✅ Updated exam status for ${operatorId}: ${status}`);
      }

      return {
        success: true,
        rowIndex: targetRowIndex,
        status: status,
        endTime: endTime,
        totalScore: totalScore
      };

    } catch (error) {
      console.error('❌ Error updating exam status:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
