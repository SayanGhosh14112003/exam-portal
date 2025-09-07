# Exam Portal System

A comprehensive video-based examination system that tracks user responses and reaction times for intervention assessment. The system integrates with Google Sheets for data storage and provides real-time exam monitoring with automatic status tracking.

## 🎯 Overview

The Exam Portal is designed for assessment scenarios where users watch video clips and respond to interventions. The system tracks:
- **Response Accuracy**: Correct/incorrect responses (1 or 0)
- **Reaction Time**: Time difference between correct intervention and user response
- **Exam Status**: Complete tracking of exam progress and completion
- **Early Exit Detection**: Automatic detection of abandoned sessions

## 🏗️ Architecture

### Frontend (React)
- **VideoPlayer Component**: Main exam interface with video playback
- **RulesSection Component**: Rules acceptance and exam initialization
- **ExamResults Component**: Results display and analysis
- **Real-time Response Tracking**: Spacebar detection and timing

### Backend (Node.js/Express)
- **Google Sheets Integration**: Automatic data storage and retrieval
- **API Endpoints**: RESTful API for exam management
- **Status Management**: Dynamic exam status tracking
- **Error Handling**: Comprehensive error management and logging

### Data Storage (Google Sheets)
- **QuestionBank Sheet**: Video clips and correct answers
- **Exam_Results Sheet**: User responses and exam outcomes
- **Dynamic Column Creation**: Automatic column setup based on QuestionBank

## 📊 System Features

### 1. Dynamic Exam Management
- **No Fixed Exam IDs**: System adapts to any number of exams
- **Session-based Tracking**: Each exam session is uniquely tracked
- **Real-time Updates**: Immediate recording of responses

### 2. Comprehensive Status Tracking
- **"In Progress"**: Default status when exam starts
- **"Submitted"**: When all clips are completed successfully
- **"Attempted"**: When user exits early or abandons session

### 3. Early Exit Detection
- **Browser Close Detection**: Uses `beforeunload` event
- **Reliable Delivery**: `sendBeacon` API for guaranteed data transmission
- **Partial Score Preservation**: Maintains data integrity for incomplete exams

### 4. Flexible Question Bank Integration
- **Automatic Column Creation**: Creates columns for each Clip_ID
- **Reaction Time Tracking**: Separate columns for timing data
- **Scalable Structure**: Supports any number of video clips

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Google Cloud Service Account with Sheets API access
- Google Sheets with QuestionBank data

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd exam-portal
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp backend/env.example backend/.env
   
   # Configure your environment variables
   # See Environment Variables section below
   ```

4. **Start the application**
   ```bash
   # Start backend server (Terminal 1)
   cd backend
   npm start
   
   # Start frontend server (Terminal 2)
   cd frontend
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 🔧 Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your_questionbank_spreadsheet_id
EXAM_RESULTS_SPREADSHEET_ID=your_exam_results_spreadsheet_id

# Google Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_TYPE=service_account
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CLIENT_CERT_URL=your_client_cert_url
GOOGLE_UNIVERSE_DOMAIN=googleapis.com

# Server Configuration
PORT=5001
NODE_ENV=development
```

## 📋 Google Sheets Setup

### QuestionBank Sheet Structure
```
Clip_ID | Video_Title | Has_Intervention | Correct_Time | Is_Active | Drive_Link | Fire_Base_Link
```

### Exam_Results Sheet Structure
```
User_ID | Start_Time | End_Time | Total_Score | Status | [Clip_IDs] | [Clip_ID_Reaction_times]
```

The system automatically creates columns for each Clip_ID in the QuestionBank:
- `Clip_ID`: Stores score (1 or 0)
- `Clip_ID_Reaction_time`: Stores reaction time in seconds

## 🔄 Workflow

### 1. Rules Acceptance
- User enters Operator ID
- Reads and accepts examination rules
- System triggers Exam_Results sheet setup
- Creates/verifies required columns

### 2. Exam Execution
- User watches video clips sequentially
- Presses SPACEBAR when intervention is needed
- System records response and reaction time
- Real-time updates to Exam_Results sheet

### 3. Exam Completion
- **Normal Completion**: Status = "Submitted"
- **Early Exit**: Status = "Attempted" (automatic detection)
- Final score calculation and storage

## 🛠️ API Endpoints

### Core Endpoints

#### `POST /api/accept-rules`
Accepts rules and sets up Exam_Results sheet
```json
{
  "operatorId": "string"
}
```

#### `POST /api/responses`
Records individual exam responses
```json
{
  "operatorId": "string",
  "clipId": "string",
  "hasIntervention": boolean,
  "correctTime": number,
  "userPressTime": number,
  "reactionTime": number,
  "score": number,
  "sessionId": "string"
}
```

#### `POST /api/update-exam-status`
Updates exam status (Submitted/Attempted)
```json
{
  "operatorId": "string",
  "sessionId": "string",
  "status": "Submitted|Attempted",
  "endTime": "ISO_timestamp",
  "totalScore": number
}
```

#### `GET /api/videos`
Fetches active videos from QuestionBank

#### `GET /api/test`
Health check endpoint

## 📊 Data Flow

```
User Accepts Rules
       ↓
Frontend: RulesSection.js
       ↓
API: POST /api/accept-rules
       ↓
Service: setupExamResultsSheet()
       ↓
Google Sheets: Exam_Results Sheet1
       ↓
Column Creation: Clip_ID + Clip_ID_Reaction_time pairs
       ↓
Ready for Exam Responses
```

## 🔍 Monitoring & Debugging

### Console Logs
- `📝 Recording exam response:` - Individual responses
- `📝 Updating exam status:` - Status changes
- `✅ Exam marked as Submitted` - Successful completion
- `⚠️ Exam marked as Attempted` - Early exit detected

### Error Handling
- Comprehensive error logging
- Graceful failure recovery
- Detailed error messages for debugging

## 🧪 Testing

### Manual Testing
1. Start both servers
2. Open http://localhost:3000
3. Enter an Operator ID
4. Accept rules and complete exam
5. Check Exam_Results sheet for data

### API Testing
```bash
# Test rules acceptance
curl -X POST http://localhost:5001/api/accept-rules \
  -H "Content-Type: application/json" \
  -d '{"operatorId": "TEST_USER"}'

# Test response recording
curl -X POST http://localhost:5001/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "operatorId": "TEST_USER",
    "clipId": "Ok934",
    "hasIntervention": true,
    "correctTime": 45.5,
    "userPressTime": 45.2,
    "reactionTime": -0.3,
    "score": 1,
    "sessionId": "SESSION_001"
  }'
```

## 🚨 Troubleshooting

### Common Issues

1. **Google Sheets API Errors**
   - Verify service account permissions
   - Check spreadsheet IDs in environment variables
   - Ensure sheets are accessible to service account

2. **Column Not Found Errors**
   - Run rules acceptance to create columns
   - Verify QuestionBank has active clips
   - Check Clip_ID naming consistency

3. **Early Exit Detection Not Working**
   - Verify `beforeunload` event listener
   - Check `sendBeacon` API support
   - Monitor console for error messages

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your environment variables.

## 📈 Performance Considerations

- **Batch Updates**: Multiple column updates in single API call
- **Efficient Row Finding**: Optimized search algorithms
- **Minimal API Calls**: Strategic caching and batching
- **Error Recovery**: Retry logic for API failures

## 🔒 Security Features

- **Service Account Authentication**: Secure Google Sheets access
- **Input Validation**: All API endpoints validate input data
- **Error Logging**: Secure error handling without data exposure
- **Rate Limiting**: Built-in protection against API abuse

## 📝 Development

### Project Structure
```
exam-portal/
├── backend/
│   ├── routes/
│   │   └── api.js
│   ├── services/
│   │   └── googleSheets.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoPlayer.js
│   │   │   ├── RulesSection.js
│   │   │   └── ExamResults.js
│   │   └── App.js
│   └── package.json
└── README.md
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Check the troubleshooting section
- Review console logs for error details
- Verify Google Sheets permissions and setup
- Ensure all environment variables are correctly configured

## 🎯 Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] Bulk exam management
- [ ] Advanced reporting features
- [ ] Multi-language support
- [ ] Mobile-responsive design improvements
- [ ] Automated testing suite
- [ ] Performance monitoring
- [ ] Data export functionality

---

**Version**: 2.0.0  
**Last Updated**: September 2025  
**Maintainer**: Exam Portal Development Team