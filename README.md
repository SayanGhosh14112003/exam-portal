# Online Exam Portal

A comprehensive online examination system built with React, Node.js, and Google Sheets integration for video-based assessments with real-time response tracking.

## 🏗️ Project Architecture

### 📁 Directory Structure

```
Exam Portal/
├── 📁 frontend/                    # React frontend application
│   ├── 📁 public/                  # Static assets
│   │   └── 📄 index.html          # Main HTML template
│   ├── 📁 src/                     # Source code
│   │   ├── 📁 components/          # React components
│   │   │   ├── 📄 App.js          # Main application component & routing
│   │   │   ├── 📄 OperatorIDModal.js    # ID verification modal
│   │   │   ├── 📄 RulesSection.js       # Rules display component
│   │   │   ├── 📄 ExamPortal.js         # Exam container component
│   │   │   ├── 📄 VideoPlayer.js        # Video playback & assessment logic
│   │   │   └── 📄 ExamResults.js        # Results display component
│   │   ├── 📄 index.js            # React app entry point
│   │   └── 📄 index.css           # Global styles & Tailwind imports
│   ├── 📄 package.json            # Frontend dependencies & scripts
│   ├── 📄 tailwind.config.js      # Tailwind CSS configuration
│   └── 📄 postcss.config.js       # PostCSS configuration
├── 📁 backend/                     # Node.js backend application
│   ├── 📁 routes/                  # API route definitions
│   │   └── 📄 api.js              # Main API routes (/api/videos, /api/responses)
│   ├── 📁 services/                # Business logic services
│   │   └── 📄 googleSheets.js     # Google Sheets API integration
│   ├── 📄 server.js               # Express server setup & configuration
│   ├── 📄 package.json            # Backend dependencies & scripts
│   ├── 📄 .env                    # Environment variables (credentials)
│   └── 📄 env.example             # Environment variables template
├── 📄 package.json                # Root package.json (orchestrates both apps)
├── 📄 .gitignore                  # Git ignore rules (protects credentials)
└── 📄 README.md                   # This documentation file
```

## 🎯 File-by-File Architecture Guide

### 🎨 Frontend Components

#### **`frontend/src/components/App.js`**
- **Purpose**: Main application component & state management
- **Key Features**:
  - Manages overall application flow (welcome → ID → rules → exam → results)
  - Handles `currentStep` state transitions
  - Integrates all major components
- **When to Edit**: 
  - To change overall app flow
  - To add new steps in the process
  - To modify state management logic

#### **`frontend/src/components/OperatorIDModal.js`**
- **Purpose**: Two-step operator ID verification system
- **Key Features**:
  - First ID entry with validation
  - Second ID confirmation
  - Error handling for mismatched IDs
  - Auto-close on successful verification
- **When to Edit**:
  - To change ID validation rules
  - To modify verification process
  - To update error messages or UI

#### **`frontend/src/components/RulesSection.js`**
- **Purpose**: Displays examination rules and agreement
- **Key Features**:
  - Lists all assessment rules
  - Agreement checkbox requirement
  - "Agree & Next" button
- **When to Edit**:
  - To update examination rules text
  - To modify agreement requirements
  - To change rules display format

#### **`frontend/src/components/ExamPortal.js`**
- **Purpose**: Container for video assessment and results
- **Key Features**:
  - Renders VideoPlayer or ExamResults based on state
  - Manages exam completion flow
- **When to Edit**:
  - To change exam container layout
  - To modify exam completion logic
  - To add new exam-related features

#### **`frontend/src/components/VideoPlayer.js`** ⭐ **CORE COMPONENT**
- **Purpose**: Video playback, spacebar detection, and assessment logic
- **Key Features**:
  - Fetches videos from Google Sheets API
  - Handles Firebase and Google Drive video playback
  - Real-time spacebar detection and response tracking
  - Dynamic video duration display
  - Smart auto-progression and manual controls
  - Score calculation and response recording
- **When to Edit**:
  - To modify video playback behavior
  - To change spacebar detection logic
  - To update scoring algorithms
  - To modify timer and duration displays
  - To change video progression logic

#### **`frontend/src/components/ExamResults.js`**
- **Purpose**: Displays final assessment results
- **Key Features**:
  - Shows total score and percentage
  - Displays individual video responses
  - Provides assessment summary
- **When to Edit**:
  - To change results display format
  - To add new result metrics
  - To modify result calculation display

### 🔧 Backend Services

#### **`backend/server.js`**
- **Purpose**: Express server setup and configuration
- **Key Features**:
  - Server initialization and port configuration
  - CORS setup for frontend communication
  - Route mounting and middleware setup
- **When to Edit**:
  - To change server configuration
  - To add new middleware
  - To modify port settings

#### **`backend/routes/api.js`**
- **Purpose**: API endpoint definitions
- **Key Features**:
  - `GET /api/videos` - Fetches active videos from Google Sheets
  - `POST /api/responses` - Records user responses
  - `POST /api/process-video-links` - Processes video links (optional)
- **When to Edit**:
  - To add new API endpoints
  - To modify existing endpoint logic
  - To change request/response formats

#### **`backend/services/googleSheets.js`** ⭐ **CORE SERVICE**
- **Purpose**: Google Sheets API integration and data management
- **Key Features**:
  - Connects to Google Sheets using service account
  - Fetches active videos from QuestionBank worksheet
  - Handles video URL processing (Firebase vs Google Drive)
  - Parses video metadata (duration, intervention timing)
  - Manages video link conversion and updates
- **When to Edit**:
  - To change Google Sheets connection logic
  - To modify video data parsing
  - To update video URL handling
  - To change worksheet structure or column mapping

### ⚙️ Configuration Files

#### **`backend/.env`**
- **Purpose**: Environment variables for sensitive data
- **Contains**:
  - Google Sheets API credentials
  - Service account configuration
  - Database connection settings
- **When to Edit**:
  - To update API credentials
  - To change database settings
  - To modify environment-specific configurations

#### **`frontend/package.json`**
- **Purpose**: Frontend dependencies and scripts
- **Key Scripts**:
  - `start` - Runs React development server
  - `build` - Creates production build
- **When to Edit**:
  - To add new frontend dependencies
  - To modify build scripts
  - To update React or other library versions

#### **`backend/package.json`**
- **Purpose**: Backend dependencies and scripts
- **Key Scripts**:
  - `start` - Runs production server
  - `dev` - Runs development server with nodemon
- **When to Edit**:
  - To add new backend dependencies
  - To modify server scripts
  - To update Node.js library versions

## 🚀 Quick File Location Guide

### 🎯 Common Edit Scenarios

| **What You Want to Change** | **File to Edit** |
|------------------------------|------------------|
| **Video playback behavior** | `frontend/src/components/VideoPlayer.js` |
| **Spacebar detection logic** | `frontend/src/components/VideoPlayer.js` |
| **Scoring algorithm** | `frontend/src/components/VideoPlayer.js` |
| **Video duration display** | `frontend/src/components/VideoPlayer.js` |
| **Auto-progression logic** | `frontend/src/components/VideoPlayer.js` |
| **Google Sheets data fetching** | `backend/services/googleSheets.js` |
| **Video URL processing** | `backend/services/googleSheets.js` |
| **API endpoints** | `backend/routes/api.js` |
| **Overall app flow** | `frontend/src/components/App.js` |
| **ID verification process** | `frontend/src/components/OperatorIDModal.js` |
| **Examination rules** | `frontend/src/components/RulesSection.js` |
| **Results display** | `frontend/src/components/ExamResults.js` |
| **Server configuration** | `backend/server.js` |
| **Environment variables** | `backend/.env` |
| **Dependencies** | `frontend/package.json` or `backend/package.json` |
| **Styling** | `frontend/src/index.css` or component files |
| **Build configuration** | `frontend/tailwind.config.js` |

### 🔍 Key Code Sections

#### **Video Assessment Logic** (`VideoPlayer.js`)
```javascript
// Lines 122-141: Spacebar press handling
const handleSpacebarPress = () => { ... }

// Lines 210-258: Video completion logic
const handleVideoComplete = () => { ... }

// Lines 143-207: Video start logic
const startVideo = () => { ... }
```

#### **Google Sheets Integration** (`googleSheets.js`)
```javascript
// Lines 45-85: Fetch active videos
async getActiveVideos() { ... }

// Lines 87-120: Process video links
async processVideoLinks() { ... }
```

#### **API Routes** (`api.js`)
```javascript
// Lines 15-35: GET /api/videos endpoint
router.get('/videos', async (req, res) => { ... }

// Lines 37-55: POST /api/responses endpoint
router.post('/responses', async (req, res) => { ... }
```

## 🛠️ Tech Stack

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
- Two Google Spreadsheets:
  - **QuestionBank Spreadsheet**: Contains video data (Clip_ID, Video_Title, etc.)
  - **Exam_Results Spreadsheet**: Stores exam results and responses

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
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your Google credentials in the `.env` file

4. **Configure your Google Sheet**
   - Create a spreadsheet with columns: `Clip_ID`, `Video_Title`, `Has_Intervention`, `Correct_Time`, `Is_Active`, `Drive_Link`, `Fire_Base_Link`
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

### QuestionBank Spreadsheet
Your main Google Sheet should have the following structure:

| Clip_ID | Video_Title | Has_Intervention | Correct_Time | Is_Active | Drive_Link | Fire_Base_Link |
|---------|-------------|------------------|--------------|-----------|------------|----------------|
| Ok934   | testing 1   | TRUE            | 00:41        | YES       | https://drive.google.com/file/d/... | https://firebasestorage.googleapis.com/... |
| Ok935   | testing 2   | FALSE           |              | YES       | https://drive.google.com/file/d/... | https://firebasestorage.googleapis.com/... |

### Exam_Results Spreadsheet
The system automatically creates an Exam_Results spreadsheet with the following structure:

| Operator_ID | Session_ID | Start_Time | End_Time | Total_Score | Ok934 | Ok935 | Ok936 |
|-------------|------------|------------|----------|-------------|-------|-------|-------|
| 1234        | session_123| 2025-09-07 | 2025-09-07| 85%         | 1     | 0     | 1     |

**Important**: 
- The Exam_Results spreadsheet ID is: `16Z0UWUup7zk3Rw2rOXXCW16o8XzNyrDVXNtt0EP7r0s`
- Make sure to share this spreadsheet with your service account email
- The system automatically creates columns for each Clip_ID from the QuestionBank

### Column Descriptions:
- **Clip_ID**: Unique identifier for each video
- **Video_Title**: Display name for the video
- **Has_Intervention**: TRUE/FALSE - whether the video requires intervention
- **Correct_Time**: Time in MM:SS format when intervention should occur
- **Is_Active**: YES/NO - whether to include this video in assessments
- **Drive_Link**: Google Drive sharing link for the video (fallback)
- **Fire_Base_Link**: Firebase Storage URL for the video (primary)

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
   - Start timed assessment (dynamic duration per video)
   - Detect spacebar presses for interventions
   - Calculate scores based on timing accuracy
   - Smart auto-progression or manual controls
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
      "driveLink": "https://firebasestorage.googleapis.com/...",
      "fireBaseLink": "https://firebasestorage.googleapis.com/...",
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
   - Click "Start Video Assessment" to begin
   - Press **SPACEBAR** when you believe intervention is needed
   - Watch the real-time timer and duration display
   - System automatically moves to next video (or shows Next button)
5. **Review your results** at the end of the assessment

## 🔒 Security Features

- **Environment Variables**: All sensitive credentials stored in `.env` files (not committed to Git)
- **Service Account Authentication**: Secure Google Sheets API access using service accounts
- **Input Validation**: Server-side validation and sanitization of all inputs
- **CORS Configuration**: Controlled cross-origin access
- **Credential Protection**: API keys and secrets excluded from version control

### Important Security Notes:
- Never commit `.env` files to version control
- Keep your service account JSON file secure and private
- Regularly rotate API credentials
- Use environment-specific configurations for production deployments

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices (landscape recommended for video assessment)

## 🐛 Troubleshooting

### Common Issues:

1. **Videos not loading**: Check Firebase/Google Drive sharing permissions
2. **API connection errors**: Verify backend is running on port 5001
3. **Google Sheets access denied**: Confirm service account has proper permissions
4. **Spacebar not working**: Ensure the browser tab has focus during assessment
5. **Timer not updating**: Check browser console for JavaScript errors

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
- **v1.1.0** - Enhanced video playback
  - Dynamic video duration detection
  - Real-time timer updates
  - Smart auto-progression
  - Firebase video integration
- **v1.2.0** - UI/UX improvements
  - Clean interface design
  - Hidden backend details
  - Professional assessment flow
  - Responsive design

---

**Built with ❤️ for comprehensive online assessments**