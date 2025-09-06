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

// Get active videos from QuestionBank
router.get('/videos', async (req, res) => {
  try {
    console.log('🎥 API: Fetching active videos...');
    
    const videos = await sheetsService.getActiveVideos();
    
    if (!videos || videos.length === 0) {
      return res.json({
        success: true,
        message: 'No active videos found',
        videos: [],
        totalCount: 0
      });
    }

    // Shuffle videos for random order (optional)
    const shuffledVideos = videos.sort(() => Math.random() - 0.5);

    res.json({
      success: true,
      message: `Found ${videos.length} active videos`,
      videos: shuffledVideos,
      totalCount: videos.length,
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
      sessionId 
    } = req.body;

    // Validate required fields
    if (!operatorId || !clipId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: operatorId and clipId'
      });
    }

    // TODO: Store response in Google Sheets
    console.log('📝 Recording response:', {
      operatorId,
      clipId,
      hasIntervention,
      correctTime,
      userPressTime,
      reactionTime,
      score,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Response recorded successfully',
      responseId: `${operatorId}_${clipId}_${Date.now()}`
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

module.exports = router;
