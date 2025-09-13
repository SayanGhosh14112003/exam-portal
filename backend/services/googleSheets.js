const { google } = require('googleapis');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.examResultsSpreadsheetId = process.env.EXAM_RESULTS_SPREADSHEET_ID || '16Z0UWUup7zk3Rw2rOXXCW16o8XzNyrDVXNtt0EP7r0s';
    this.adminSpreadsheetId = '1V4nxJwWUBXns8Z9FxUoNAzjnKcXr7pJh2jydOXyuZs4';
    this.credentialsPath = '/Users/apple/Documents/Apis/sheet-api.json';
    this.initialize();
  }

  async initialize() {
    try {
      let credentials;
        const hasCredentials = process.env.GOOGLE_CLIENT_EMAIL && 
                              process.env.GOOGLE_PRIVATE_KEY && 
                              process.env.GOOGLE_PROJECT_ID;

        if (!hasCredentials) {
          this.sheets = null;
          this.drive = null;
          return;
        }
        credentials = {
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
      console.log('⚠️ Running in demo mode without Google Sheets integration');
      this.sheets = null;
      this.drive = null;
    }
  }
  //change
  async deleteRecordsByExamCode(examCode) {
  try {
    if (!this.sheets || !this.examResultsSpreadsheetId) {
      throw new Error('Google Sheets service not properly initialized');
    }

    console.log('🗑️ Deleting records for Exam_Code:', examCode);

    // 1. Get the sheet ID
    const sheetInfo = await this.sheets.spreadsheets.get({
      spreadsheetId: this.examResultsSpreadsheetId,
    });

    const sheet = sheetInfo.data.sheets.find(s => s.properties.title === 'Sheet1');
    if (!sheet) {
      throw new Error('Sheet1 not found');
    }
    const sheetId = sheet.properties.sheetId;

    // 2. Get all data from the spreadsheet
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.examResultsSpreadsheetId,
      range: 'Sheet1!A:Z', // Adjust range if needed
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      console.log('⚠️ No data found or only header row present.');
      return { deletedCount: 0 };
    }

    const header = rows[0];
    const examCodeIndex = header.indexOf('Exam_Code');
    if (examCodeIndex === -1) {
      throw new Error('Exam_Code column not found');
    }

    // 3. Find rows to delete by Exam_Code
    const rowsToDelete = [];
    for (let i = 1; i < rows.length; i++) {
      const cellValue = rows[i][examCodeIndex] || '';
      if (cellValue.toLowerCase() === examCode.toLowerCase()) {
        rowsToDelete.push(i + 1); // API expects 1-based row numbers
      }
    }

    if (rowsToDelete.length === 0) {
      console.log(`⚠️ No records found with Exam_Code = ${examCode}`);
      return { deletedCount: 0 };
    }

    // 4. Delete rows in reverse order
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      const rowIndex = rowsToDelete[i];
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.examResultsSpreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // API expects 0-based index
                endIndex: rowIndex
              }
            }
          }]
        }
      });
      console.log(`Deleted row ${rowIndex}`);
    }

    console.log(`✅ Deleted ${rowsToDelete.length} record(s) with Exam_Code = ${examCode}`);
    return { deletedCount: rowsToDelete.length };

  } catch (error) {
    console.error('❌ Error deleting records:', error);
    throw error;
  }
}


  async deleteExamResult(userId, examCode, startTime) {
  try {
    if (!this.sheets || !this.examResultsSpreadsheetId) {
      throw new Error('Google Sheets service not properly initialized');
    }

    console.log(`🗑️ Deleting row for userId: ${userId}, examCode: ${examCode}, startTime: ${startTime}`);

    // Get all data from the sheet
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.examResultsSpreadsheetId,
      range: 'Sheet1!A:G', // Adjust range as needed to include Start_Time
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return { deletedCount: 0 };
    }

    const header = rows[0];
    const userIdIndex = header.indexOf('User_ID');
    const examCodeIndex = header.indexOf('Exam_Code');
    const startTimeIndex = header.indexOf('Start_Time');

    if (userIdIndex === -1 || examCodeIndex === -1 || startTimeIndex === -1) {
      throw new Error('Required columns "User_ID", "Exam_Code", or "Start_Time" not found');
    }

    // Find rows to delete matching all three fields
    const rowsToDelete = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const currentUserId = row[userIdIndex];
      const currentExamCode = row[examCodeIndex];
      const currentStartTime = row[startTimeIndex];

      if (
        currentUserId && currentExamCode && currentStartTime &&
        currentUserId.toLowerCase() === userId.toLowerCase() &&
        currentExamCode.toLowerCase() === examCode.toLowerCase() &&
        currentStartTime.toLowerCase() === startTime.toLowerCase()
      ) {
        rowsToDelete.push(i + 1); // store 1-based index
      }
    }

    if (rowsToDelete.length === 0) {
      console.log('⚠️ No matching row found');
      return { deletedCount: 0 };
    }

    // Delete rows in reverse order
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      const rowIndex = rowsToDelete[i];
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.examResultsSpreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // Adjust if using another sheet
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex
              }
            }
          }]
        }
      });
    }

    console.log(`✅ Deleted ${rowsToDelete.length} row(s) for userId: ${userId}, examCode: ${examCode}, startTime: ${startTime}`);
    return { deletedCount: rowsToDelete.length };

  } catch (error) {
    console.error('❌ Error deleting row:', error);
    throw error;
  }
}



  //change

  async validateExamCode(examCode) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        console.log('⚠️ Google Sheets not available - accepting any exam code in demo mode');
        return true;
      }

      console.log('🔍 Validating exam code in QuestionBank:', examCode);

      // Fetch exam codes from QuestionBank worksheet
      // Columns: Exam_Code, Clip_ID, Video_Title, Has_Intervention, Correct_Time, Is_Active, Fire_Base_Link
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:A', // Only Exam_Code column
      });

      const rows = response.data.values || [];
      console.log(`📋 Found ${rows.length} total rows in QuestionBank`);

      if (rows.length === 0) {
        console.log('⚠️ No data found in QuestionBank');
        return false;
      }

      // Skip header row and check if exam code exists (case-insensitive)
      const examCodes = rows.slice(1)
        .map(row => row[0])
        .filter(code => code && code.trim()); // Filter out empty values

      // Convert both the input exam code and stored codes to lowercase for comparison
      const isValid = examCodes.some(code => code.toLowerCase() === examCode.toLowerCase());
      
      console.log(`🔍 Exam code "${examCode}" ${isValid ? 'found' : 'not found'} in QuestionBank`);
      console.log(`📋 Available exam codes:`, examCodes);
      
      return isValid;
    } catch (error) {
      console.error('❌ Error validating exam code:', error);
      throw error;
    }
  }

  async getActiveVideos(examCode = null) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        console.log('⚠️ Google Sheets not available - returning demo videos');
        // Return demo videos for testing
        return [
          {
            examCode: 'DEMO',
            clipId: 'DEMO_001',
            videoTitle: 'DEMO_001',
            hasIntervention: false,
            correctTime: 15.5,
            isActive: true,
            driveLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
            originalDriveLink: '',
            fireBaseLink: '',
            order: 1
          },
          {
            examCode: 'DEMO',
            clipId: 'DEMO_002',
            videoTitle: 'DEMO_002',
            hasIntervention: true,
            correctTime: 22.0,
            isActive: true,
            driveLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
            originalDriveLink: '',
            fireBaseLink: '',
            order: 2
          }
        ];
      }

      console.log('📊 Fetching active videos from QuestionBank worksheet...', { examCode });

      // Fetch video data from Sheet1 worksheet
      // New structure: Exam_Code, Clip_ID, Has_Intervention, Correct_Time, Is_Active, Fire_Base_Link
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:F', // 6 columns for new structure
      });

      const rows = response.data.values || [];
      console.log(`📋 Found ${rows.length} total rows in QuestionBank`);

      if (rows.length === 0) {
        return [];
      }

      // Skip header row and filter for active videos
      const videos = rows.slice(1)
        .filter(row => {
          // Filter by exam code if provided (case-insensitive)
          if (examCode && row[0].toLowerCase() !== examCode.toLowerCase()) {
            return false;
          }
          
          // Check if Is_Active column (index 4) is active (YES, TRUE, or true)
          const isActive = row[4] && (
            row[4].toString().toUpperCase() === 'YES' ||
            row[4].toString().toUpperCase() === 'TRUE' ||
            row[4] === true
          );
          return isActive && row[1]; // Also ensure Clip_ID exists (index 1)
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
          
          // Use Fire_Base_Link directly (column F)
          let videoUrl = '';
          const fireBaseLink = row[5] || ''; // Fire_Base_Link column (F)
          
          // Check if Fire_Base_Link contains Firebase URL
          if (fireBaseLink.trim() && fireBaseLink.includes('firebasestorage.googleapis.com')) {
            videoUrl = fireBaseLink.trim();
            console.log(`🔥 Using Firebase URL for ${row[1]}: Firebase video URL`);
          } else if (fireBaseLink.trim() && fireBaseLink !== '1' && fireBaseLink !== '2' && fireBaseLink !== '3') {
            // Use Fire_Base_Link if it's not just a placeholder number
            videoUrl = fireBaseLink.trim();
            console.log(`🔗 Using Fire_Base_Link for ${row[1]}: ${videoUrl}`);
          } else {
            console.warn(`❌ No valid video URL found for ${row[1]}: Fire_Base_Link is empty or contains placeholder values`);
          }
          
          return {
            examCode: row[0], // Exam_Code column (A)
            clipId: row[1], // Clip_ID column (B)
            videoTitle: row[1] || 'Video', // Use Clip_ID as title since Video_Title is removed
            hasIntervention: row[2] && (row[2].toString().toUpperCase() === 'TRUE' || row[2] === true), // Has_Intervention column (C)
            correctTime: correctTime, // Correct_Time column (D)
            isActive: true, // We already filtered for active videos
            driveLink: videoUrl, // Primary video URL (Fire_Base_Link)
            originalDriveLink: '', // No longer applicable
            fireBaseLink: fireBaseLink, // Firebase video link
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

  async setupExamResultsSheet(examCode = null) {
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

      console.log('📊 Setting up Exam_Results sheet...', { examCode });
      console.log('📊 QuestionBank Spreadsheet ID:', this.spreadsheetId);
      console.log('📊 Exam_Results Spreadsheet ID:', this.examResultsSpreadsheetId);

      // First, get all Clip_IDs from QuestionBank (in the main spreadsheet), filtered by exam code if provided
      const questionBankResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:B', // Exam_Code and Clip_ID columns
      });

      const questionBankRows = questionBankResponse.data.values || [];
      if (questionBankRows.length <= 1) {
        console.log('📋 No Clip_IDs found in QuestionBank');
        return { processed: 0, created: 0, existing: 0 };
      }

      // Extract Clip_IDs (skip header row), filter by exam code if provided
      const clipIds = questionBankRows.slice(1)
        .filter(row => {
          // Filter by exam code if provided (case-insensitive)
          if (examCode && row[0].toLowerCase() !== examCode.toLowerCase()) {
            return false;
          }
          return row[1] && row[1].trim(); // Ensure Clip_ID exists
        })
        .map(row => row[1]); // Extract Clip_ID (column B)

      console.log(`📋 Found ${clipIds.length} Clip_IDs in QuestionBank${examCode ? ` for exam code ${examCode}` : ''}:`, clipIds);

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
        
        // If no existing columns, add basic headers first (with new Exam_Code column)
        if (existingColumns.length === 0) {
          newHeaderRow.unshift('Exam_Code', 'User_ID', 'Start_Time', 'End_Time', 'Total_Score', 'Status');
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
        sessionId,
        examCode
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

      // Look for existing row with matching User_ID AND Exam_Code for the current attempt
      // This is for recording individual video responses within the same exam session
      console.log(`🔍 Looking for existing row with User_ID: ${operatorId} and Exam_Code: ${examCode}`);
      for (let i = 1; i < rows.length; i++) { // Skip header row
        const row = rows[i];
        const rowExamCode = row[0]; // Exam_Code column (index 0)
        const rowUserId = row[1]; // User_ID column (index 1, after Exam_Code)
        console.log(`   Row ${i}: Exam_Code = "${rowExamCode}", User_ID = "${rowUserId}"`);
        
        // Match User_ID, Exam_Code, and "In Progress" status for the same attempt
        // Only update rows that are still in progress (not completed attempts)
        const rowStatus = row[5]; // Status column (index 5)
        if (rowUserId === operatorId && rowExamCode === examCode && rowStatus === 'In Progress') {
          targetRowIndex = i + 1; // 1-based row index
          console.log(`✅ Found existing "In Progress" row at index ${targetRowIndex} for same exam attempt`);
          break;
        }
      }

      // If no existing row found, create a new one
      if (targetRowIndex === -1) {
        console.log(`📝 Creating new row for User_ID: ${operatorId}`);
        const newRow = [
          examCode || '', // Exam_Code (index 0)
          operatorId, // User_ID (index 1)
          new Date().toISOString(), // Start_Time (index 2)
          '', // End_Time (index 3) - will be updated when exam completes
          0, // Total_Score (index 4) - will be calculated
          'In Progress' // Status (index 5)
        ];

        // Add empty values for all Clip_ID columns (starting from index 6)
        for (let i = 6; i < headers.length; i++) {
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

      const { operatorId, sessionId, status, endTime, totalScore, examCode } = statusData;

      console.log('📝 Updating exam status:', { operatorId, sessionId, status, endTime, totalScore, examCode });

      // Get current Exam_Results sheet data
      const dataResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.examResultsSpreadsheetId,
        range: 'Sheet1!A:Z',
      });

      const rows = dataResponse.data.values || [];
      let targetRowIndex = -1;

      // Look for existing row with matching User_ID, Exam_Code, and Status = "In Progress"
      // This finds the row created during recordExamResponse() to update with final status
      console.log(`🔍 Looking for existing "In Progress" row - User_ID: ${operatorId}, Exam_Code: ${examCode}`);
      for (let i = 1; i < rows.length; i++) { // Skip header row
        const row = rows[i];
        const rowExamCode = row[0]; // Exam_Code column (index 0)
        const rowUserId = row[1]; // User_ID column (index 1, after Exam_Code)
        const rowStatus = row[5]; // Status column (index 5)
        console.log(`   Row ${i}: Exam_Code = "${rowExamCode}", User_ID = "${rowUserId}", Status = "${rowStatus}"`);
        
        // Match User_ID, Exam_Code, and "In Progress" status
        if (rowUserId === operatorId && rowExamCode === examCode && rowStatus === 'In Progress') {
          targetRowIndex = i + 1; // 1-based row index
          console.log(`✅ Found existing "In Progress" row at index ${targetRowIndex} to update`);
          break;
        }
      }

      // If no existing row found, create a new one
      if (targetRowIndex === -1) {
        console.log(`📝 No existing "In Progress" row found - creating new row for User_ID: ${operatorId} during status update`);
        const newRow = [
          examCode || '', // Exam_Code (index 0) - store the actual exam code
          operatorId, // User_ID (index 1)
          new Date().toISOString(), // Start_Time (index 2)
          endTime || '', // End_Time (index 3)
          totalScore || 0, // Total_Score (index 4)
          status || 'Completed' // Status (index 5)
        ];

        // Get headers to determine how many columns we need
        const headerResponse = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.examResultsSpreadsheetId,
          range: 'Sheet1!1:1',
        });

        const headers = headerResponse.data.values?.[0] || [];
        
        // Add empty values for all Clip_ID columns (starting from index 6)
        for (let i = 6; i < headers.length; i++) {
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

  // Admin Panel Methods
  async getActiveExamCodes() {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        console.log('⚠️ Google Sheets not available - returning demo exam codes');
        return ['DEMO', 'TEST', 'SAMPLE'];
      }

      console.log('🔍 Fetching active exam codes from QuestionBank...');

      // Fetch exam codes from QuestionBank worksheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:E', // Exam_Code to Is_Active columns
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log('📋 No data found in QuestionBank');
        return [];
      }

      // Extract unique exam codes from active rows
      const examCodes = new Set();
      rows.slice(1).forEach(row => {
        const examCode = row[0];
        const isActive = row[4] && (
          row[4].toString().toUpperCase() === 'YES' ||
          row[4].toString().toUpperCase() === 'TRUE' ||
          row[4] === true
        );
        
        if (examCode && isActive) {
          examCodes.add(examCode);
        }
      });

      const uniqueExamCodes = Array.from(examCodes);
      console.log(`✅ Found ${uniqueExamCodes.length} active exam codes:`, uniqueExamCodes);
      
      return uniqueExamCodes;
    } catch (error) {
      console.error('❌ Error fetching active exam codes:', error);
      throw error;
    }
  }

  async getExamDetails(examCode) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        console.log('⚠️ Google Sheets not available - returning demo exam details');
        return {
          examCode: examCode,
          clips: [
            {
              clipId: 'DEMO_001',
              hasIntervention: false,
              correctTime: 15.5,
              isActive: true,
              fireBaseLink: 'https://example.com/video1.mp4'
            }
          ],
          totalClips: 1,
          activeClips: 1
        };
      }

      console.log('🔍 Fetching exam details for:', examCode);

      // Fetch all data from QuestionBank
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:F', // All columns
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        return { examCode, clips: [], totalClips: 0, activeClips: 0 };
      }

      // Filter rows for this exam code
      const examClips = rows.slice(1)
        .filter(row => row[0] && row[0].toLowerCase() === examCode.toLowerCase())
        .map(row => {
          // Parse correct time
          let correctTime = null;
          if (row[3]) {
            const timeStr = row[3].toString().trim();
            if (timeStr.includes(':')) {
              const [minutes, seconds] = timeStr.split(':').map(Number);
              correctTime = (minutes * 60) + seconds;
            } else if (timeStr !== '') {
              correctTime = parseFloat(timeStr);
            }
          }

          const isActive = row[4] && (
            row[4].toString().toUpperCase() === 'YES' ||
            row[4].toString().toUpperCase() === 'TRUE' ||
            row[4] === true
          );

          return {
            clipId: row[1] || '',
            hasIntervention: row[2] && (row[2].toString().toUpperCase() === 'TRUE' || row[2] === true),
            correctTime: correctTime,
            isActive: isActive,
            fireBaseLink: row[5] || ''
          };
        });

      const activeClips = examClips.filter(clip => clip.isActive).length;

      console.log(`✅ Found ${examClips.length} clips for exam ${examCode} (${activeClips} active)`);

      return {
        examCode: examCode,
        clips: examClips,
        totalClips: examClips.length,
        activeClips: activeClips
      };
    } catch (error) {
      console.error('❌ Error fetching exam details:', error);
      throw error;
    }
  }

  async deleteExam(examCode) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('🗑️ Deleting exam:', examCode);

      // Get all data from QuestionBank
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:F',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        return { deletedCount: 0 };
      }

      // Find rows to delete (matching exam code)
      const rowsToDelete = [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] && rows[i][0].toLowerCase() === examCode.toLowerCase()) {
          rowsToDelete.push(i + 1); // 1-based row index
        }
      }

      if (rowsToDelete.length === 0) {
        console.log(`⚠️ No rows found for exam code: ${examCode}`);
        return { deletedCount: 0 };
      }

      // Delete rows in reverse order to maintain correct indices
      for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        const rowIndex = rowsToDelete[i];
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 0, // Assuming first sheet
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1, // 0-based for API
                  endIndex: rowIndex // 0-based for API
                }
              }
            }]
          }
        });
      }

      console.log(`✅ Deleted ${rowsToDelete.length} rows for exam: ${examCode}`);
      return { deletedCount: rowsToDelete.length };
    } catch (error) {
      console.error('❌ Error deleting exam:', error);
      throw error;
    }
  }

  async createExam(examCode, clips) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('➕ Creating new exam:', examCode, 'with', clips.length, 'clips');

      // Prepare rows for insertion
      const newRows = clips.map(clip => [
        examCode, // Exam_Code
        clip.clipId || '', // Clip_ID
        clip.hasIntervention ? 'TRUE' : 'FALSE', // Has_Intervention
        clip.correctTime || '', // Correct_Time
        clip.isActive !== false ? 'Yes' : 'No', // Is_Active (default to true)
        clip.fireBaseLink || '' // Fire_Base_Link
      ]);

      // Append rows to QuestionBank
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:F',
        valueInputOption: 'RAW',
        resource: {
          values: newRows
        }
      });

      console.log(`✅ Created exam ${examCode} with ${newRows.length} clips`);
      return { createdCount: newRows.length };
    } catch (error) {
      console.error('❌ Error creating exam:', error);
      throw error;
    }
  }

  async updateExam(examCode, clips) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('✏️ Updating exam:', examCode, 'with', clips.length, 'clips');

      // First delete existing exam
      await this.deleteExam(examCode);

      // Then create with new data
      const result = await this.createExam(examCode, clips);

      console.log(`✅ Updated exam ${examCode} with ${result.createdCount} clips`);
      return { updatedCount: result.createdCount };
    } catch (error) {
      console.error('❌ Error updating exam:', error);
      throw error;
    }
  }

  async getExamResultsAnalysis(examCode = null) {
    try {
      if (!this.sheets || !this.examResultsSpreadsheetId) {
        console.log('⚠️ Google Sheets not available - returning demo analysis');
        return {
          totalAttempts: 10,
          completedAttempts: 8,
          inProgressAttempts: 2,
          averageScore: 75.5,
          examCodes: ['DEMO', 'TEST'],
          attempts: []
        };
      }

      console.log('📊 Fetching exam results analysis...', { examCode });

      // Get all data from Exam_Results sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.examResultsSpreadsheetId,
        range: 'Sheet1!A:Z',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        return {
          totalAttempts: 0,
          completedAttempts: 0,
          inProgressAttempts: 0,
          averageScore: 0,
          examCodes: [],
          attempts: []
        };
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Filter by exam code if provided
      const filteredRows = examCode 
        ? dataRows.filter(row => row[0] && row[0].toLowerCase() === examCode.toLowerCase())
        : dataRows;

      // Analyze the data
      const analysis = {
        totalAttempts: filteredRows.length,
        completedAttempts: 0,
        inProgressAttempts: 0,
        attemptedAttempts: 0,
        averageScore: 0,
        examCodes: [...new Set(dataRows.map(row => row[0]).filter(Boolean))],
        attempts: []
      };

      let totalScore = 0;
      let scoredAttempts = 0;

      filteredRows.forEach(row => {
        const examCodeCol = row[0] || '';
        const userIdCol = row[1] || '';
        const startTimeCol = row[2] || '';
        const endTimeCol = row[3] || '';
        const totalScoreCol = parseFloat(row[4]) || 0;
        const statusCol = row[5] || '';

        // Count by status
        if (statusCol === 'Submitted') {
          analysis.completedAttempts++;
        } else if (statusCol === 'In Progress') {
          analysis.inProgressAttempts++;
        } else if (statusCol === 'Attempted') {
          analysis.attemptedAttempts++;
        }

        // Calculate average score for completed attempts
        if (statusCol === 'Submitted' && totalScoreCol >= 0) {
          totalScore += totalScoreCol;
          scoredAttempts++;
        }

        // Individual attempt data
        analysis.attempts.push({
          examCode: examCodeCol,
          userId: userIdCol,
          startTime: startTimeCol,
          endTime: endTimeCol,
          totalScore: totalScoreCol,
          status: statusCol
        });
      });

      analysis.averageScore = scoredAttempts > 0 ? (totalScore / scoredAttempts) : 0;

      console.log(`✅ Analysis complete: ${analysis.totalAttempts} total attempts`);
      return analysis;
    } catch (error) {
      console.error('❌ Error fetching exam results analysis:', error);
      throw error;
    }
  }

async deleteQuestions(examCode, clipId) {
  try {
    if (!this.sheets || !this.spreadsheetId) {
      console.log('⚠️ Google Sheets API or Spreadsheet ID not available');
      return false;
    }

    console.log('🗑 Deleting rows based on Exam_Code and Clip_ID');
    console.log('Exam_Code:', examCode, '| Clip_ID:', clipId);

    // Get all rows including headers
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Sheet1!A:F', // Adjust as needed
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.log('⚠️ No data found in the sheet');
      return false;
    }

    const header = rows[0];
    const examCodeIndex = header.indexOf('Exam_Code');
    const clipIdIndex = header.indexOf('Clip_ID');

    if (examCodeIndex === -1 || clipIdIndex === -1) {
      console.log('❌ Required columns not found');
      return false;
    }

    // Find all row indices to delete
    let rowsToDelete = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowExamCode = row[examCodeIndex] || "";
      const rowClipId = row[clipIdIndex] || "";

      let shouldDelete = false;

      if (!examCode && clipId) {
        // Case 1: Exam_Code is empty and Clip_ID is provided
        if (rowClipId === clipId) {
          shouldDelete = true;
        }
      } else if (examCode && !clipId) {
        // Case 2: Exam_Code is provided and Clip_ID is empty
        if (rowExamCode === examCode) {
          shouldDelete = true;
        }
      } else if (examCode && clipId) {
        // Case 3: Both provided, match both
        if (rowExamCode === examCode && rowClipId === clipId) {
          shouldDelete = true;
        }
      }

      if (shouldDelete) {
        rowsToDelete.push(i + 1); // Row numbers are 1-based and headers are in row 1
      }
    }

    if (rowsToDelete.length === 0) {
      console.log('⚠️ No matching rows found');
      return false;
    }

    console.log(`✅ Found ${rowsToDelete.length} rows to delete`);

    // Sort rows descending to delete without affecting indices
    rowsToDelete.sort((a, b) => b - a);

    for (let rowIndex of rowsToDelete) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // Replace with actual sheetId if needed
                dimension: "ROWS",
                startIndex: rowIndex - 1,
                endIndex: rowIndex
              }
            }
          }]
        }
      });
      console.log(`Deleted row ${rowIndex}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error deleting rows:', error);
    throw error;
  }
}

  async addClipToExam(examCode, clipData) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('➕ Adding clip to exam:', examCode, clipData);

      // Prepare row for insertion
      const newRow = [
        examCode, // Exam_Code
        clipData.clipId || '', // Clip_ID
        clipData.hasIntervention ? 'TRUE' : 'FALSE', // Has_Intervention
        clipData.correctTime || '', // Correct_Time
        'Yes', // Is_Active (default to true)
        clipData.fireBaseLink || '' // Fire_Base_Link
      ];

      // Append row to QuestionBank
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:F',
        valueInputOption: 'RAW',
        resource: {
          values: [newRow]
        }
      });

      console.log(`✅ Added clip ${clipData.clipId} to exam ${examCode}`);
      return { addedCount: 1 };
    } catch (error) {
      console.error('❌ Error adding clip to exam:', error);
      throw error;
    }
  }

  async verifyAdminCredentials(adminId, password) {
    try {
      if (!this.sheets || !this.adminSpreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('🔐 Verifying admin credentials for:', adminId);

      // Get admin credentials from the admin spreadsheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.adminSpreadsheetId,
        range: 'Sheet1!A:B', // Admin_Id and Password columns
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log('⚠️ No admin credentials found in spreadsheet');
        return { success: false, message: 'No admin credentials configured' };
      }

      // Find matching admin credentials
      for (let i = 1; i < rows.length; i++) { // Skip header row
        const [sheetAdminId, sheetPassword] = rows[i];
        
        if (sheetAdminId && sheetAdminId.trim() === adminId.trim() && 
            sheetPassword && sheetPassword.trim() === password.trim()) {
          console.log('✅ Admin credentials verified successfully');
          return { 
            success: true, 
            message: 'Authentication successful',
            adminId: sheetAdminId.trim()
          };
        }
      }

      console.log('❌ Invalid admin credentials');
      return { success: false, message: 'Invalid Admin ID or Password' };
    } catch (error) {
      console.error('❌ Error verifying admin credentials:', error);
      throw error;
    }
  }

  async createAdminCredentials(newAdminId, newPassword, createdBy) {
    try {
      if (!this.sheets || !this.adminSpreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('➕ Creating admin credentials for:', newAdminId, 'by:', createdBy);

      // First, check if admin ID already exists
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.adminSpreadsheetId,
        range: 'Sheet1!A:D', // Admin_Id, Password, Created_At, Created_By columns
      });

      const rows = response.data.values || [];
      
      // Check for existing admin ID
      for (let i = 1; i < rows.length; i++) { // Skip header row
        const [sheetAdminId] = rows[i];
        if (sheetAdminId && sheetAdminId.trim().toLowerCase() === newAdminId.trim().toLowerCase()) {
          console.log('❌ Admin ID already exists');
          return { success: false, message: 'Admin ID already exists' };
        }
      }

      // Add new admin credentials
      const newRow = [
        newAdminId.trim(),
        newPassword.trim(),
        new Date().toISOString(),
        createdBy.trim()
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.adminSpreadsheetId,
        range: 'Sheet1!A:D',
        valueInputOption: 'RAW',
        resource: {
          values: [newRow]
        }
      });

      console.log('✅ Admin credentials created successfully');
      return { 
        success: true, 
        message: 'Admin created successfully',
        adminId: newAdminId.trim()
      };
    } catch (error) {
      console.error('❌ Error creating admin credentials:', error);
      throw error;
    }
  }

  async deleteAdminCredentials(adminIdToDelete, deletedBy) {
    try {
      if (!this.sheets || !this.adminSpreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('🗑️ Deleting admin credentials for:', adminIdToDelete, 'by:', deletedBy);

      // Get all admin credentials to find the row to delete
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.adminSpreadsheetId,
        range: 'Sheet1!A:D', // Admin_Id, Password, Created_At, Created_By columns
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log('⚠️ No admin credentials found in spreadsheet');
        return { success: false, message: 'No admin credentials found' };
      }

      // Find the admin to delete
      let rowToDelete = -1;
      for (let i = 1; i < rows.length; i++) { // Skip header row
        const [sheetAdminId] = rows[i];
        if (sheetAdminId && sheetAdminId.trim().toLowerCase() === adminIdToDelete.trim().toLowerCase()) {
          rowToDelete = i + 1; // Google Sheets rows are 1-indexed
          break;
        }
      }

      if (rowToDelete === -1) {
        console.log('❌ Admin ID not found:', adminIdToDelete);
        return { success: false, message: 'Admin ID not found' };
      }

      // Delete the row
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.adminSpreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0, // Assuming the first sheet
                  dimension: 'ROWS',
                  startIndex: rowToDelete - 1, // 0-indexed for the API
                  endIndex: rowToDelete // Exclusive end index
                }
              }
            }
          ]
        }
      });

      console.log('✅ Admin credentials deleted successfully');
      return { 
        success: true, 
        message: 'Admin deleted successfully',
        adminId: adminIdToDelete.trim()
      };
    } catch (error) {
      console.error('❌ Error deleting admin credentials:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
