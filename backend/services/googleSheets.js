const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = '1ppRzDl9-iXT8KMcFf62b-tim8fEjP7UQiPBS8HEbCd4';
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize Google Sheets API with service account credentials
      const credentials = {
        type: "service_account",
        project_id: "helpful-monitor-471219-p5",
        private_key_id: "4ebd3d6e5bb421d32f128003ed9516d2c393a5ba",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDLX87PQk7yn/Dc\n5Uo+50jew7MwL9/AALO+XdNyLveC0r6/k6r4yQogfjoBZq+X2+m13WdadiMY5JXl\n+zV0J2asET3v8f4fp2X7TYYqdEdFTDTxH98D5SCqESLGGpqTJaaq8JmO1H9Pn4jl\nOJ2x24pLntU6iAsBtPm9bkzliCouSLZIusGwrmimmF6SShGUp8zvIwT0iRHVSEMO\nPhAuVGdz2tFmStxFM9KvQOSCwKlvD77VTYmgZaTYYDfMWid2B3rIdr4V53L20cgM\nBH8EMzNEkybXs8YuuCHfMCiu3MSHT9/Ut2dx6S7U95Uy/T8jDLZXKGCY23GWADzB\nd/hMZJUVAgMBAAECggEAZYUBXOd6NlYNq47PpZ/Zec3R5FN5i0QudXArrTtxtT3T\nFxm1BnSAmCC6ftmN/K27t9t6DKedNH9irkdccwt6Dpmaw+yWEKIE39Hej9G0hAya\n/uSMdErLp+le5OoB0ENCs+DfnnNHy+zUrqu42EBBhCcYxJuFdwgqhFuLiiaS+7/O\n9xKPsLmPZWgUQml3sRPZ6KLVPhEbqMbFDqhLiDOQX/uEG6JTRYH2bMolBbvFk3rB\nGYRgH/xNQjYULbHC4xCKiKaVAG6QBX2HI4cES9UCIzRPyQH3zQaswpiczkcjPdDh\nuCD/yilzm2f6aOHtVjtskfOQCJ/eUKsGYF84bRpEjwKBgQDyn+g0TmD9Ht5jFUul\n2gzxxyTU+D+akvbaI+dsurE3Tlb8gcNmZGhwLbVRFM5NOVPuYcYmUKfb+CQzbFBy\nGkvdgbyR9Ro7E0IkEGwaOLytMRDGXZ6imv0xXMGD3NxrG98tpWX0b7Igp1VtkVSr\nTkPxQuVQx5U14K71uPVgO0NqXwKBgQDWlfiexP8rlRCbXNWGbaydm0rlSkRbrAS7\nMuBAl1LpcN6LoJs0UboebJWtBuOydkgh8QvmadDUWQDR2l/2PzPVU8Vkg1dGr6PX\nKuDYbhjkAFd3kBfVFe9o3jJAxmediwGksqjouhht1ua7qc9PlPCQG17EbWOuIxJ4\nsXkFeDXdCwKBgQDkXThdCyzk8koVbrTeLUejxnJXdjW/kvZ/ye2IfIxS5wye7LBz\nTqyycYNJBtFLBFuIc0TjSWVFeODx+dAaJcAkhHlt1ApVckH92es2HxMP3K/SVcn7\nePA5pvmJ2LcqpXhB6Xz2Pq+lZnrU/0Z3Wto+Wl2m08QQiyOCqw1h/0Xr9wKBgGVG\nxN+SVGhqYzsgVnqquqRsDa4oHhkyF82OVn7FrNEWf0JhG79Wr0P6ta3DKaYp4yN5\n08b8vB3sn9Frgo0DCWCut+QXhRKMhQRhbVtYoxDBBIcej9D3GFZjQE6IFZEqcS0d\nUVD9u9fjbGS34WtK/TrWYCTPCBPA48/o2xh0wt8/AoGBAMuMVkPWHzYCgj/7x6yY\nMx2OX3rcQXgagcsPYzYyZHM3re1ERcSCXzp0Kg8tlsNkzhQ4zZhOvVr83YciUXCN\nAjO9MYKcB0ncMcB3ncF4MWfWLFQxjAVAJXa83cXwfRkPNrACbwPPq1ZQjmZjG5Y0\nkex6Cz6IHl+LMeWlfysta8SX\n-----END PRIVATE KEY-----\n",
        client_email: "exam-portal@helpful-monitor-471219-p5.iam.gserviceaccount.com",
        client_id: "109807107441119367624",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/exam-portal%40helpful-monitor-471219-p5.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      };

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ Google Sheets API initialized successfully');
      console.log('📊 Connected to spreadsheet:', this.spreadsheetId);
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets API:', error.message);
    }
  }

  async verifyOperatorId(operatorId) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      // Read operator data from the spreadsheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Operators!A:C', // Assuming columns: ID, Name, Status
      });

      const rows = response.data.values || [];
      const operatorRow = rows.find(row => row[0] === operatorId);

      if (operatorRow) {
        return {
          isValid: true,
          operatorId: operatorRow[0],
          name: operatorRow[1],
          status: operatorRow[2]
        };
      }

      return { isValid: false };
    } catch (error) {
      console.error('Error verifying operator ID:', error);
      throw error;
    }
  }

  async logOperatorSession(operatorId, sessionData) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      // Log session data to the spreadsheet
      const values = [
        [
          operatorId,
          new Date().toISOString(),
          sessionData.action || 'login',
          sessionData.ipAddress || 'unknown',
          JSON.stringify(sessionData.metadata || {})
        ]
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sessions!A:E', // Assuming columns: OperatorID, Timestamp, Action, IP, Metadata
        valueInputOption: 'RAW',
        resource: { values }
      });

      console.log(`✅ Session logged for operator: ${operatorId}`);
    } catch (error) {
      console.error('Error logging session:', error);
      throw error;
    }
  }

  async getActiveVideos() {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      console.log('📊 Fetching active videos from QuestionBank worksheet...');

      // Fetch video data from Sheet1 worksheet
      // Columns: Clip_ID, Video_Title, Has_Intervention, Correct_Time, Is_Active, Drive_Link
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:F',
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
          
          // Convert Google Drive links to direct video URLs
          let videoUrl = row[5] || '';
          if (videoUrl && videoUrl.includes('drive.google.com')) {
            // Extract file ID from Google Drive URL
            const fileIdMatch = videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch) {
              const fileId = fileIdMatch[1];
              // Convert to direct preview URL
              videoUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            }
          }
          
          return {
            clipId: row[0],
            videoTitle: row[1] || '',
            hasIntervention: row[2] && (row[2].toString().toUpperCase() === 'TRUE' || row[2] === true),
            correctTime: correctTime,
            isActive: true, // We already filtered for active videos
            driveLink: videoUrl,
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

  async getExamData(examId) {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        throw new Error('Google Sheets service not properly initialized');
      }

      // Fetch exam questions and metadata
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `Exam_${examId}!A:F`, // Assuming columns: Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return null;
      }

      // Parse exam data
      const questions = rows.slice(1).map((row, index) => ({
        id: index + 1,
        question: row[0],
        options: {
          A: row[1],
          B: row[2],
          C: row[3],
          D: row[4]
        },
        correctAnswer: row[5]
      }));

      return {
        examId,
        questions,
        totalQuestions: questions.length
      };
    } catch (error) {
      console.error('Error fetching exam data:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
