# Online Exam Portal

A comprehensive online examination system built with React, Node.js, and Google Sheets integration for video-based assessments with real-time response tracking.

## 🚀 Features

- **Operator ID Verification**: Two-step verification process with ID matching
- **Rules Display**: Comprehensive examination rules with agreement confirmation
- **Video Assessment System**: 
  - Google Drive video integration
  - Spacebar-based intervention detection
  - Real-time timing and scoring
  - Automatic progression through video sets
- **Google Sheets Integration**: Dynamic video data management
- **Response Tracking**: Real-time user response recording and analysis
- **Professional UI**: Clean, modern interface built with Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **React** - Component-based UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Google Sheets API** - Data management
- **CORS** - Cross-origin resource sharing

### Database
- **Google Sheets** - Cloud-based data storage with real-time updates

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Platform account
- Google Sheets API credentials

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/exam-portal.git
   cd exam-portal
   ```

2. **Install dependencies for all modules**
   ```bash
   npm run install-all
   ```

3. **Set up Google Sheets API**
   - Create a Google Cloud Platform project
   - Enable the Google Sheets API
   - Create a service account and download the credentials JSON
   - Update the credentials in `backend/services/googleSheets.js`

4. **Configure your Google Sheet**
   - Create a spreadsheet with columns: `Clip_ID`, `Video_Title`, `Has_Intervention`, `Correct_Time`, `Is_Active`, `Drive_Link`
   - Update the spreadsheet ID in the backend service
   - Ensure your service account has read access to the sheet

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
This starts both frontend (port 3000) and backend (port 5001) concurrently.

### Individual Services
```bash
# Backend only
npm run server

# Frontend only  
npm run client
```

## 📊 Google Sheets Configuration

Your Google Sheet should have the following structure:

| Clip_ID | Video_Title | Has_Intervention | Correct_Time | Is_Active | Drive_Link |
|---------|-------------|------------------|--------------|-----------|------------|
| Ok934   | testing 1   | TRUE            | 00:41        | YES       | https://drive.google.com/file/d/... |
| Ok935   | testing 2   | FALSE           |              | YES       | https://drive.google.com/file/d/... |

### Column Descriptions:
- **Clip_ID**: Unique identifier for each video
- **Video_Title**: Display name for the video
- **Has_Intervention**: TRUE/FALSE - whether the video requires intervention
- **Correct_Time**: Time in MM:SS format when intervention should occur
- **Is_Active**: YES/NO - whether to include this video in assessments
- **Drive_Link**: Google Drive sharing link for the video

## 🎯 Application Flow

1. **Welcome Screen**: Initial landing page
2. **Operator ID Verification**: 
   - Enter operator ID
   - Confirm ID (must match)
   - Proceed to rules or show error
3. **Rules Section**: 
   - Display examination rules
   - Require agreement to proceed
4. **Video Assessment**:
   - Load videos from Google Sheets
   - Display video information
   - Start timed assessment (2 minutes per video)
   - Detect spacebar presses for interventions
   - Calculate scores based on timing accuracy
5. **Results**: Display final assessment results

## 🔧 API Endpoints

### GET /api/videos
Returns active videos from Google Sheets
```json
{
  "success": true,
  "videos": [
    {
      "clipId": "Ok934",
      "videoTitle": "testing 1",
      "hasIntervention": true,
      "correctTime": 41,
      "isActive": true,
      "driveLink": "https://drive.google.com/file/d/...",
      "order": 1
    }
  ],
  "totalCount": 2
}
```

### POST /api/responses
Records user responses during assessments
```json
{
  "operatorId": "OP123",
  "sessionId": "session_1234567890",
  "clipId": "Ok934",
  "responseTime": 40.5,
  "hasIntervention": true,
  "isCorrect": true,
  "score": 1
}
```

## 🎮 Usage Instructions

1. **Start the application** and navigate to `http://localhost:3000`
2. **Enter your Operator ID** twice for verification
3. **Read and agree** to the examination rules
4. **For each video**:
   - Click the Google Drive link to view the video in a new tab
   - Return to the exam tab and click "Start Video Assessment"
   - Press **SPACEBAR** when you believe intervention is needed
   - The system automatically moves to the next video after 2 minutes
5. **Review your results** at the end of the assessment

## 🔒 Security Features

- Service account credentials for secure Google Sheets access
- Input validation and sanitization
- CORS configuration for controlled access
- Environment variable protection

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices (landscape recommended for video assessment)

## 🐛 Troubleshooting

### Common Issues:

1. **Videos not loading**: Check Google Drive sharing permissions and ensure links are public
2. **API connection errors**: Verify backend is running on port 5001
3. **Google Sheets access denied**: Confirm service account has proper permissions
4. **Spacebar not working**: Ensure the browser tab has focus during assessment

### Debug Mode:
Check browser console and backend logs for detailed error information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - Operator ID verification
  - Google Sheets integration
  - Video assessment system
  - Real-time response tracking

---

**Built with ❤️ for comprehensive online assessments**