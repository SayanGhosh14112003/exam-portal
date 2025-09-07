# Rules Acceptance → Exam_Results Update Workflow

This document describes the complete workflow for handling rules acceptance and updating the Exam_Results Google Sheet with the required column structure.

## Overview

The workflow ensures that when a user accepts the examination rules, the system automatically sets up the Exam_Results sheet with the proper column structure based on the QuestionBank data.

## Workflow Steps

### Step 1: Rules Acceptance
- **Component**: `RulesSection.js`
- **Trigger**: User checks the agreement checkbox and clicks "Agree & Next"
- **Action**: Frontend calls `/api/accept-rules` endpoint with `operatorId`

```javascript
// Frontend call
const response = await axios.post('/api/accept-rules', {
  operatorId: operatorId
});
```

### Step 2: Backend Trigger
- **Endpoint**: `POST /api/accept-rules`
- **File**: `backend/routes/api.js`
- **Action**: Validates operator ID and triggers Exam_Results sheet setup

```javascript
// Backend processing
const result = await sheetsService.setupExamResultsSheet();
```

### Step 3: Exam_Results Sheet Update
- **Service**: `GoogleSheetsService.setupExamResultsSheet()`
- **File**: `backend/services/googleSheets.js`
- **Action**: Updates the Exam_Results Google Sheet (Sheet1)

### Step 4: Column Creation Logic
For each question in the QuestionBank Google Sheet:

1. **Fetch Clip_IDs**: Retrieves all Clip_IDs from QuestionBank Sheet1
2. **Check Existing Columns**: Reads current Exam_Results Sheet1 header row
3. **Create Column Pairs**: For each Clip_ID, creates two columns:
   - `<Clip_ID>` - stores the score (0 or 1)
   - `<Clip_ID>_Reaction_time` - stores reaction time in seconds

### Step 5: Sequential Addition
- **Process**: All unique Clip_ID and Clip_ID_Reaction_time column pairs are added sequentially
- **Order**: Basic columns first, then Clip_ID pairs in QuestionBank order
- **Structure**: 
  ```
  Exam_ID | Operator_ID | Session_ID | Start_Time | End_Time | Total_Score | CLIP_001 | CLIP_001_Reaction_time | CLIP_002 | CLIP_002_Reaction_time | ...
  ```

## Implementation Details

### Google Sheets Service Methods

#### `setupExamResultsSheet()`
- Fetches Clip_IDs from QuestionBank spreadsheet
- Checks existing columns in Exam_Results spreadsheet
- Creates missing column pairs
- Returns setup statistics

#### `recordExamResponse(responseData)`
- Records individual exam responses
- Finds or creates operator session row
- Updates specific Clip_ID and Clip_ID_Reaction_time columns
- Handles score and reaction time data

### API Endpoints

#### `POST /api/accept-rules`
- **Purpose**: Trigger Exam_Results sheet setup
- **Input**: `{ operatorId: string }`
- **Output**: Setup result with column creation statistics

#### `POST /api/responses`
- **Purpose**: Record exam responses
- **Input**: Complete response data including operatorId, clipId, score, reactionTime
- **Output**: Recording confirmation with Exam_Results row details

## Data Flow

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

## Workflow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   User Accepts  │───▶│  RulesSection.js │───▶│  POST /api/accept-  │
│      Rules      │    │   (Frontend)     │    │       rules         │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  Exam_Results   │◀───│ setupExamResults │◀───│   Backend API       │
│  Sheet Updated  │    │     Sheet()      │    │   (routes/api.js)   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ Column Creation │    │ QuestionBank     │
│ • CLIP_001      │    │ Integration      │
│ • CLIP_001_RT   │    │ (Fetch Clip_IDs) │
│ • CLIP_002      │    │                  │
│ • CLIP_002_RT   │    │                  │
│ • ...           │    │                  │
└─────────────────┘    └──────────────────┘
```

## Column Structure Example

```
Exam_Results Sheet1 Header Row:
┌──────────┬─────────────┬────────────┬────────────┬────────────┬─────────────┬─────────┬──────────────────┬─────────┬──────────────────┬─────────┬──────────────────┐
│ Exam_ID  │ Operator_ID │ Session_ID │ Start_Time │ End_Time   │ Total_Score │ CLIP_001│ CLIP_001_RT      │ CLIP_002│ CLIP_002_RT      │ CLIP_003│ CLIP_003_RT      │
├──────────┼─────────────┼────────────┼────────────┼────────────┼─────────────┼─────────┼──────────────────┼─────────┼──────────────────┼─────────┼──────────────────┤
│ EXAM_001 │ OP_001      │ SESS_001   │ 2024-01-01 │ 2024-01-01 │ 85          │ 1       │ 0.250            │ 0       │                  │ 1       │ -0.150           │
└──────────┴─────────────┴────────────┴────────────┴────────────┴─────────────┴─────────┴──────────────────┴─────────┴──────────────────┴─────────┴──────────────────┘
```

## Exam Response Recording

When users complete video clips during the exam:

1. **Response Data**: Score (0/1) and reaction time are calculated
2. **API Call**: `POST /api/responses` with complete response data
3. **Sheet Update**: `recordExamResponse()` finds the operator's row and updates the appropriate Clip_ID columns
4. **Data Storage**: 
   - Score goes to `<Clip_ID>` column
   - Reaction time goes to `<Clip_ID>_Reaction_time` column

## Error Handling

- **Missing Columns**: If Clip_ID columns don't exist, the system throws an error
- **Sheet Access**: Handles Google Sheets API permission issues
- **Data Validation**: Validates required fields before processing
- **Graceful Degradation**: Logs errors but continues processing other operations

## Testing

Use the provided test script to verify the complete workflow:

```bash
node test-workflow.js
```

The test script verifies:
- API connectivity
- Rules acceptance flow
- Exam_Results sheet setup
- Column creation
- Response recording
- QuestionBank integration

## Configuration

### Environment Variables
- `GOOGLE_SHEETS_SPREADSHEET_ID`: QuestionBank spreadsheet ID
- `EXAM_RESULTS_SPREADSHEET_ID`: Exam_Results spreadsheet ID
- Google Service Account credentials for API access

### Spreadsheet Structure
- **QuestionBank**: Sheet1 with Clip_ID in column A
- **Exam_Results**: Sheet1 with dynamic column structure based on QuestionBank

## Security Considerations

- Service account authentication for Google Sheets API
- Input validation on all API endpoints
- Error logging without exposing sensitive data
- Rate limiting considerations for Google Sheets API calls

## Performance Notes

- Batch updates for multiple column creations
- Efficient row finding using existing data
- Minimal API calls through strategic caching
- Error recovery and retry logic for API failures
