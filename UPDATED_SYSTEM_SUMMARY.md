# Updated Exam Portal System - Summary

## 🎯 **System Overview**

The Exam Portal system has been updated to handle dynamic Exam_ID management and proper exam status tracking without fixed exam IDs.

## 📊 **Exam_Results Sheet Structure**

```
User_ID | Start_Time | End_Time | Total_Score | Status | Ok934 | Ok935 | Ok936 | Ok934_Reaction_time | Ok935_Reaction_time | Ok936_Reaction_time
```

### **Column Mapping:**
- **User_ID**: Operator ID (unique identifier)
- **Start_Time**: When exam started
- **End_Time**: When exam completed or abandoned
- **Total_Score**: Final calculated score
- **Status**: "In Progress", "Submitted", or "Attempted"
- **Clip_X**: Score (1 or 0) for each clip
- **Clip_X_Reaction_time**: Reaction time in seconds (or blank if not applicable)

## 🔄 **System Updates to Exam_Results**

### **1. Clip Score Recording**
- **Clip_X_Score** → `1` (correct response) or `0` (incorrect/no response)
- **Clip_X_Reaction** → Reaction time in seconds (or blank if not applicable)

### **2. Exam Status Management**

#### **"Submitted" Status**
- Triggered when all clips are completed
- End_Time is set to completion timestamp
- Total_Score is calculated and updated

#### **"Attempted" Status**
- Triggered when user exits early, refreshes, or abandons session
- End_Time is set to abandonment timestamp
- Total_Score reflects partial completion

#### **"In Progress" Status**
- Default status when exam row is created
- Updated to "Submitted" or "Attempted" based on completion

## 🚀 **Workflow Implementation**

### **Step 1: Rules Acceptance**
- User accepts rules → `/api/accept-rules` called
- Exam_Results sheet columns are created/verified
- Row created with "In Progress" status

### **Step 2: Exam Response Recording**
- Each clip response → `/api/responses` called
- Score and reaction time recorded in appropriate columns
- Real-time updates to Exam_Results sheet

### **Step 3: Exam Completion Handling**

#### **Normal Completion:**
```javascript
// When all clips completed
await axios.post('/api/update-exam-status', {
  operatorId,
  sessionId,
  status: 'Submitted',
  endTime: new Date().toISOString(),
  totalScore: calculatedTotalScore
});
```

#### **Early Exit Detection:**
```javascript
// Using beforeunload event with sendBeacon
window.addEventListener('beforeunload', (event) => {
  if (responses.length > 0 && responses.length < videos.length) {
    navigator.sendBeacon('/api/update-exam-status', JSON.stringify({
      operatorId,
      sessionId,
      status: 'Attempted',
      endTime: new Date().toISOString(),
      totalScore: partialScore
    }));
  }
});
```

## 🔧 **API Endpoints**

### **POST /api/accept-rules**
- Sets up Exam_Results sheet columns
- Creates initial exam row with "In Progress" status

### **POST /api/responses**
- Records individual clip responses
- Updates Clip_X and Clip_X_Reaction_time columns

### **POST /api/update-exam-status**
- Updates exam status (Submitted/Attempted)
- Sets End_Time and Total_Score
- Handles both normal completion and early exit

## 📋 **Key Features**

### **1. Dynamic Exam Management**
- No fixed exam IDs
- Each operator gets one row per session
- Status tracking for incomplete exams

### **2. Robust Early Exit Detection**
- Uses `beforeunload` event listener
- `sendBeacon` API for reliable delivery
- Handles browser refresh, tab close, navigation

### **3. Comprehensive Logging**
- Detailed console logging for debugging
- Error handling with meaningful messages
- Status tracking throughout the process

### **4. Flexible Column Structure**
- Automatically creates columns based on QuestionBank
- Supports any number of clips
- Maintains consistent naming convention

## 🎯 **Usage Examples**

### **Complete Exam Flow:**
1. User accepts rules → Row created with "In Progress"
2. User completes all clips → Status updated to "Submitted"
3. End_Time and Total_Score are set

### **Abandoned Exam Flow:**
1. User accepts rules → Row created with "In Progress"
2. User completes some clips → Partial scores recorded
3. User closes browser → Status updated to "Attempted"
4. End_Time set to abandonment time

## 🔍 **Monitoring & Debugging**

### **Console Logs:**
- `📝 Recording exam response:` - Individual responses
- `📝 Updating exam status:` - Status changes
- `✅ Exam marked as Submitted` - Successful completion
- `⚠️ Exam marked as Attempted` - Early exit detected

### **Error Handling:**
- Column not found errors with available columns list
- Missing exam record errors
- Network failure handling with retry logic

## 🚀 **Benefits**

1. **No Fixed Exam IDs**: System adapts to any number of exams
2. **Incomplete Exam Tracking**: Identifies abandoned sessions
3. **Real-time Updates**: Immediate feedback and recording
4. **Robust Error Handling**: Graceful failure recovery
5. **Comprehensive Logging**: Easy debugging and monitoring
6. **Flexible Structure**: Supports any QuestionBank configuration

The system now properly handles the dynamic nature of exam sessions while maintaining data integrity and providing comprehensive tracking of both completed and abandoned exams.
