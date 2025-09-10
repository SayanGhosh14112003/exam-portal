const express = require('express');
const router = express.Router();

// Google Sheets service
const sheetsService = require('../services/googleSheets');

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Operator routes
router.post('/operators/verify', async (req, res) => {
  try {
    const { operatorId } = req.body;
    
    if (!operatorId) {
      return res.status(400).json({ 
        error: 'Operator ID is required' 
      });
    }

    // TODO: Implement Google Sheets verification
    // For now, accept any non-empty operator ID
    const isValid = operatorId.trim().length > 0;
    
    if (isValid) {
      res.json({ 
        success: true,
        operatorId: operatorId.trim(),
        message: 'Operator ID verified successfully'
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: 'Invalid operator ID' 
      });
    }
  } catch (error) {
    console.error('Error verifying operator ID:', error);
    res.status(500).json({ 
      error: 'Internal server error during verification' 
    });
  }
});

// Get operator details
router.get('/operators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement Google Sheets lookup
    // For now, return mock data
    res.json({
      operatorId: id,
      name: `Operator ${id}`,
      status: 'active',
      lastLogin: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching operator details:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Validate exam code
router.post('/validate-exam-code', async (req, res) => {
  try {
    const { examCode, operatorId } = req.body;
    
    if (!examCode) {
      return res.status(400).json({
        success: false,
        error: 'Exam code is required'
      });
    }

    console.log('🔍 Validating exam code:', { examCode, operatorId });
    
    // Check if exam code exists in QuestionBank
    const isValid = await sheetsService.validateExamCode(examCode.trim());
    
    if (isValid) {
      res.json({
        success: true,
        message: 'Exam code is valid',
        examCode: examCode.trim(),
        operatorId: operatorId
      });
    } else {
      res.json({
        success: false,
        error: 'Invalid exam code',
        message: 'The provided exam code was not found in the system'
      });
    }
  } catch (error) {
    console.error('❌ Error validating exam code:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during exam code validation',
      message: error.message
    });
  }
});

// Get active videos from QuestionBank (filtered by exam code)
router.get('/videos', async (req, res) => {
  try {
    const { examCode } = req.query;
    
    console.log('🎥 API: Fetching active videos...', { examCode });
    
    const videos = await sheetsService.getActiveVideos(examCode);
    
    if (!videos || videos.length === 0) {
      return res.json({
        success: true,
        message: examCode ? `No active videos found for exam code: ${examCode}` : 'No active videos found',
        videos: [],
        totalCount: 0,
        examCode: examCode
      });
    }

    // Shuffle videos for random order (optional)
    const shuffledVideos = videos.sort(() => Math.random() - 0.5);

    res.json({
      success: true,
      message: `Found ${videos.length} active videos${examCode ? ` for exam code: ${examCode}` : ''}`,
      videos: shuffledVideos,
      totalCount: videos.length,
      examCode: examCode,
      metadata: {
        interventionClips: videos.filter(v => v.hasIntervention).length,
        nonInterventionClips: videos.filter(v => !v.hasIntervention).length,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching videos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch videos from database',
      message: error.message
    });
  }
});

// Submit exam response
router.post('/responses', async (req, res) => {
  try {
    const { 
      operatorId, 
      clipId, 
      hasIntervention, 
      correctTime, 
      userPressTime, 
      reactionTime, 
      score,
      videoStartTime,
      sessionId,
      examId,
      examCode 
    } = req.body;

    // Validate required fields
    if (!operatorId || !clipId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: operatorId and clipId'
      });
    }

    console.log('📝 Recording response:', {
      operatorId,
      clipId,
      hasIntervention,
      correctTime,
      userPressTime,
      reactionTime,
      score,
      sessionId,
      examId,
      timestamp: new Date().toISOString()
    });

    // Store response in Exam_Results Google Sheet
    const result = await sheetsService.recordExamResponse({
      operatorId,
      clipId,
      hasIntervention,
      correctTime,
      userPressTime,
      reactionTime,
      score,
      sessionId,
      examCode
    });

    res.json({
      success: true,
      message: 'Response recorded successfully in Exam_Results sheet',
      responseId: `${operatorId}_${clipId}_${Date.now()}`,
      examResultsRecord: result
    });

  } catch (error) {
    console.error('❌ Error recording response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record response',
      message: error.message
    });
  }
});

// Process video links - convert Drive_Link to Api_Drive_Link when empty
router.post('/process-video-links', async (req, res) => {
  try {
    console.log('🔄 API: Processing video links...');
    
    const { force } = req.body; // Allow forcing regeneration
    
    let result;
    if (force) {
      result = await sheetsService.forceProcessVideoLinks();
    } else {
      result = await sheetsService.processVideoLinks();
    }
    
    res.json({
      success: true,
      message: 'Video links processed successfully',
      processed: result.processed,
      updated: result.updated,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing video links:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process video links',
      message: error.message
    });
  }
});

// Rules acceptance and Exam_Results sheet setup
router.post('/accept-rules', async (req, res) => {
  try {
    const { operatorId, examCode } = req.body;
    
    if (!operatorId) {
      return res.status(400).json({
        success: false,
        error: 'Operator ID is required'
      });
    }
    
    if (!examCode) {
      return res.status(400).json({
        success: false,
        error: 'Exam Code is required'
      });
    }
    
    console.log('📋 Rules accepted by operator:', { operatorId, examCode });
    
    // Trigger Exam_Results sheet update with exam code filtering
    const result = await sheetsService.setupExamResultsSheet(examCode);
    
    res.json({
      success: true,
      message: 'Rules accepted and Exam_Results sheet updated',
      operatorId,
      examCode,
      examResultsSetup: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error accepting rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept rules and setup Exam_Results',
      error: error.message
    });
  }
});

// Update exam status (Submitted/Attempted)
router.post('/update-exam-status', async (req, res) => {
  try {
    const { 
      operatorId, 
      sessionId, 
      status, 
      endTime, 
      totalScore,
      examCode 
    } = req.body;

    // Validate required fields
    if (!operatorId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: operatorId and status'
      });
    }

    console.log('📝 Updating exam status:', {
      operatorId,
      sessionId,
      status,
      endTime,
      totalScore,
      examCode,
      timestamp: new Date().toISOString()
    });

    // Update exam status in Exam_Results Google Sheet
    const result = await sheetsService.updateExamStatus({
      operatorId,
      sessionId,
      status,
      endTime,
      totalScore,
      examCode
    });

    res.json({
      success: true,
      message: `Exam status updated to: ${status}`,
      operatorId,
      status,
      examStatusUpdate: result
    });

  } catch (error) {
    console.error('❌ Error updating exam status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update exam status',
      message: error.message
    });
  }
});

// Admin Panel Routes
// Admin authentication
router.post('/admin/auth', async (req, res) => {
  try {
    const { adminId, password } = req.body;
    
    if (!adminId || !password) {
      return res.status(400).json({
        success: false,
        error: 'Admin ID and password are required'
      });
    }

    console.log('🔐 Admin: Authentication attempt for:', adminId);
    
    const result = await sheetsService.verifyAdminCredentials(adminId, password);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        adminId: result.adminId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.message
      });
    }

  } catch (error) {
    console.error('❌ Admin: Error during authentication:', error);
    res.status(500).json({ 
      success: false,
      error: 'Authentication service error',
      message: error.message
    });
  }
});

// Get all active exam codes from QuestionBank
router.get('/admin/exam-codes', async (req, res) => {
  try {
    console.log('🔍 Admin: Fetching active exam codes...');
    
    const examCodes = await sheetsService.getActiveExamCodes();
    
    res.json({
      success: true,
      message: `Found ${examCodes.length} active exam codes`,
      examCodes: examCodes,
      totalCount: examCodes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin: Error fetching exam codes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch exam codes',
      message: error.message
    });
  }
});

// Get exam details by exam code
router.get('/admin/exam/:examCode', async (req, res) => {
  try {
    const { examCode } = req.params;
    
    console.log('🔍 Admin: Fetching exam details for:', examCode);
    
    const examDetails = await sheetsService.getExamDetails(examCode);
    
    if (!examDetails || examDetails.clips.length === 0) {
      return res.json({
        success: false,
        error: 'Exam not found',
        message: `No exam found with code: ${examCode}`
      });
    }

    res.json({
      success: true,
      message: `Found exam details for: ${examCode}`,
      examCode: examCode,
      examDetails: examDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin: Error fetching exam details:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch exam details',
      message: error.message
    });
  }
});

// Delete an entire exam (all clips with the same exam code)
router.delete('/admin/exam/:examCode', async (req, res) => {
  try {
    const { examCode } = req.params;
    
    console.log('🗑️ Admin: Deleting exam:', examCode);
    
    const result = await sheetsService.deleteExam(examCode);
    
    res.json({
      success: true,
      message: `Exam ${examCode} deleted successfully`,
      examCode: examCode,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin: Error deleting exam:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete exam',
      message: error.message
    });
  }
});

// Create a new exam
router.post('/admin/exam', async (req, res) => {
  try {
    const { examCode, clips } = req.body;
    
    if (!examCode || !clips || !Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid exam data',
        message: 'Exam code and clips array are required'
      });
    }

    console.log('➕ Admin: Creating new exam:', examCode);
    
    const result = await sheetsService.createExam(examCode, clips);
    
    res.json({
      success: true,
      message: `Exam ${examCode} created successfully`,
      examCode: examCode,
      createdCount: result.createdCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin: Error creating exam:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create exam',
      message: error.message
    });
  }
});

// Update an existing exam
router.put('/admin/exam/:examCode', async (req, res) => {
  try {
    const { examCode } = req.params;
    const { clips } = req.body;
    
    if (!clips || !Array.isArray(clips)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid exam data',
        message: 'Clips array is required'
      });
    }

    console.log('✏️ Admin: Updating exam:', examCode);
    
    const result = await sheetsService.updateExam(examCode, clips);
    
    res.json({
      success: true,
      message: `Exam ${examCode} updated successfully`,
      examCode: examCode,
      updatedCount: result.updatedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin: Error updating exam:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update exam',
      message: error.message
    });
  }
});

// Delete individual clip by Clip_ID
router.delete('/admin/clip/:clipId', async (req, res) => {
  try {
    const { clipId } = req.params;
    
    console.log('🗑️ Admin: Deleting clip:', clipId);
    
    const result = await sheetsService.deleteClip(clipId);
    
    res.json({
      success: true,
      message: `Clip ${clipId} deleted successfully`,
      clipId: clipId,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin: Error deleting clip:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete clip',
      message: error.message
    });
  }
});

// Add new clip to existing exam
router.post('/admin/exam/:examCode/clip', async (req, res) => {
  try {
    const { examCode } = req.params;
    const { clipId, hasIntervention, correctTime, fireBaseLink } = req.body;
    
    if (!clipId) {
      return res.status(400).json({
        success: false,
        error: 'Clip ID is required'
      });
    }

    console.log('➕ Admin: Adding clip to exam:', examCode, clipId);
    
    const result = await sheetsService.addClipToExam(examCode, {
      clipId,
      hasIntervention: hasIntervention || false,
      correctTime: correctTime || '',
      fireBaseLink: fireBaseLink || ''
    });
    
    res.json({
      success: true,
      message: `Clip ${clipId} added to exam ${examCode} successfully`,
      examCode: examCode,
      clipId: clipId,
      addedCount: result.addedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin: Error adding clip:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add clip',
      message: error.message
    });
  }
});

// Get exam results analysis
router.get('/admin/results', async (req, res) => {
  try {
    const { examCode } = req.query;
    
    console.log('📊 Admin: Fetching exam results analysis...', { examCode });
    
    const resultsAnalysis = await sheetsService.getExamResultsAnalysis(examCode);
    
    res.json({
      success: true,
      message: examCode ? `Results analysis for exam: ${examCode}` : 'All exam results analysis',
      examCode: examCode,
      analysis: resultsAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin: Error fetching results analysis:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch results analysis',
      message: error.message
    });
  }
});

module.exports = router;
