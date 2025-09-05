import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const VideoPlayer = ({ operatorId, onExamComplete }) => {
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoStartTime, setVideoStartTime] = useState(null);
  const [responses, setResponses] = useState([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [showResponse, setShowResponse] = useState(null);
  const [spacebarPressed, setSpacebarPressed] = useState(false);

  const videoRef = useRef(null);
  const spacebarPressTime = useRef(null);
  const hasUserResponded = useRef(false);

  // Fetch videos on component mount
  useEffect(() => {
    fetchVideos();
    
    // Cleanup intervals on unmount
    return () => {
      if (window.videoInterval) {
        clearInterval(window.videoInterval);
      }
      if (window.demoInterval) {
        clearInterval(window.demoInterval);
      }
    };
  }, []);

  // Set up spacebar listener with multiple capture points
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        setSpacebarPressed(true);
        if (isPlaying) {
          handleSpacebarPress();
        }
        return false;
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === 'Space' || event.key === ' ') {
        setSpacebarPressed(false);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // Add listeners to multiple elements to ensure capture
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [isPlaying, videoStartTime]); // Dependencies updated

  // Video time update listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleVideoEnd = () => {
      handleVideoComplete();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleVideoEnd);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, [currentVideoIndex]);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/videos');
      
      if (response.data.success) {
        setVideos(response.data.videos);
        console.log('📹 Loaded videos:', response.data.videos);
      } else {
        setError('Failed to load videos');
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpacebarPress = () => {
    if (!isPlaying || !videoStartTime) return;

    const pressTime = Date.now();
    const videoTime = (pressTime - videoStartTime) / 1000; // Convert to seconds
    
    spacebarPressTime.current = videoTime;
    hasUserResponded.current = true;

    console.log(`🔘 Spacebar pressed at video time: ${videoTime.toFixed(2)}s`);
    
    // Show immediate visual feedback
    setShowResponse({ 
      type: 'press', 
      time: videoTime,
      message: 'Intervention Recorded!'
    });
    setTimeout(() => setShowResponse(null), 1500);
  };

  const startVideo = () => {
    const currentVideo = getCurrentVideo();
    
    if (currentVideo?.driveLink) {
      if (currentVideo.driveLink.includes('drive.google.com')) {
        // Google Drive video - simulate playback with overlay control
        setVideoStartTime(Date.now());
        setIsPlaying(true);
        hasUserResponded.current = false;
        spacebarPressTime.current = null;
        setCurrentTime(0);
        
        console.log(`▶️ Started Google Drive video: ${currentVideo?.videoTitle}`);
        
        // Ensure focus stays on document for spacebar detection
        setTimeout(() => {
          document.body.focus();
          document.activeElement?.blur();
        }, 100);
        
        // Simulate 2-minute video playback (120 seconds)
        const videoInterval = setInterval(() => {
          setCurrentTime(prevTime => {
            const newTime = prevTime + 0.1;
            if (newTime >= 120) {
              clearInterval(videoInterval);
              setTimeout(() => handleVideoComplete(), 100);
              return 120;
            }
            return newTime;
          });
        }, 100);
        
        // Store interval reference for cleanup
        window.videoInterval = videoInterval;
      } else {
        // Regular video file
        const video = videoRef.current;
        if (video) {
          setVideoStartTime(Date.now());
          setIsPlaying(true);
          hasUserResponded.current = false;
          spacebarPressTime.current = null;
          video.play();
          console.log(`▶️ Started video: ${currentVideo?.videoTitle}`);
        }
      }
    } else {
      // Demo mode - simulate video playback
      setVideoStartTime(Date.now());
      setIsPlaying(true);
      hasUserResponded.current = false;
      spacebarPressTime.current = null;
      setCurrentTime(0);
      
      console.log(`▶️ Started demo: ${currentVideo?.videoTitle}`);
      
      // Simulate 20-second video playback
      const demoInterval = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 0.1;
          if (newTime >= 20) {
            clearInterval(demoInterval);
            setTimeout(() => handleVideoComplete(), 100);
            return 20;
          }
          return newTime;
        });
      }, 100);
      
      // Store interval reference for cleanup
      window.demoInterval = demoInterval;
    }
  };

  const handleVideoComplete = () => {
    setIsPlaying(false);
    const currentVideo = getCurrentVideo();
    if (!currentVideo) return;

    // Calculate score based on response
    const result = calculateScore(currentVideo);
    
    // Store response
    const response = {
      clipId: currentVideo.clipId,
      videoTitle: currentVideo.videoTitle,
      hasIntervention: currentVideo.hasIntervention,
      correctTime: currentVideo.correctTime,
      userPressTime: spacebarPressTime.current,
      reactionTime: result.reactionTime,
      score: result.score,
      feedback: result.feedback,
      timestamp: new Date().toISOString()
    };

    setResponses(prev => [...prev, response]);
    console.log('📊 Video response recorded:', response);

    // Submit to backend
    submitResponse(response);

    // Show result briefly
    setShowResponse({ type: 'result', ...result });
    setTimeout(() => {
      setShowResponse(null);
      moveToNextVideo();
    }, 2000);
  };

  const calculateScore = (video) => {
    const { hasIntervention, correctTime } = video;
    const userPressed = hasUserResponded.current;
    const pressTime = spacebarPressTime.current;

    if (hasIntervention) {
      // Case A: Clip WITH Intervention
      if (userPressed && pressTime !== null) {
        const timeDiff = pressTime - correctTime;
        const withinWindow = Math.abs(timeDiff) <= 1.5;
        
        return {
          score: withinWindow ? 1 : 0,
          reactionTime: timeDiff,
          feedback: withinWindow 
            ? `Correct! Reaction time: ${timeDiff > 0 ? '+' : ''}${timeDiff.toFixed(2)}s`
            : `Incorrect timing. Off by ${Math.abs(timeDiff).toFixed(2)}s`
        };
      } else {
        return {
          score: 0,
          reactionTime: null,
          feedback: 'Missed intervention - no response detected'
        };
      }
    } else {
      // Case B: Clip WITHOUT Intervention
      if (userPressed) {
        return {
          score: 0,
          reactionTime: pressTime,
          feedback: `False intervention at ${pressTime.toFixed(2)}s`
        };
      } else {
        return {
          score: 1,
          reactionTime: null,
          feedback: 'Correct - no intervention needed'
        };
      }
    }
  };

  const submitResponse = async (response) => {
    try {
      await axios.post('/api/responses', {
        operatorId,
        sessionId,
        ...response
      });
    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  };

  const moveToNextVideo = () => {
    // Clean up current video state
    if (window.videoInterval) {
      clearInterval(window.videoInterval);
      window.videoInterval = null;
    }
    if (window.demoInterval) {
      clearInterval(window.demoInterval);
      window.demoInterval = null;
    }

    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      setCurrentTime(0);
      setIsPlaying(false);
      hasUserResponded.current = false;
      spacebarPressTime.current = null;
      setShowResponse(null);
    } else {
      // Exam complete
      handleExamComplete();
    }
  };

  const handleExamComplete = () => {
    const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
    const percentage = ((totalScore / responses.length) * 100).toFixed(1);
    
    console.log('🎯 Exam completed!', {
      totalResponses: responses.length,
      correctResponses: totalScore,
      percentage: `${percentage}%`
    });

    onExamComplete({
      responses,
      totalScore,
      percentage,
      operatorId,
      sessionId
    });
  };

  const getCurrentVideo = () => videos[currentVideoIndex];
  const currentVideo = getCurrentVideo();

  // Focus management for better spacebar detection
  useEffect(() => {
    if (isPlaying) {
      // Ensure document has focus for spacebar detection
      const focusDocument = () => {
        document.body.focus();
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
      };
      
      focusDocument();
      
      // Re-focus periodically to maintain spacebar detection
      const focusInterval = setInterval(focusDocument, 1000);
      
      return () => clearInterval(focusInterval);
    }
  }, [isPlaying]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading examination videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-8">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Videos</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchVideos}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Active Videos</h2>
          <p className="text-yellow-600">No active videos found in the question bank.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video Intervention Assessment</h1>
            <p className="text-gray-600 mt-1">
              Operator: <span className="font-medium text-primary-600">{operatorId}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-primary-600">
              {currentVideoIndex + 1} / {videos.length}
            </div>
            <div className="text-sm text-gray-500">Videos</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentVideoIndex + 1) / videos.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {currentVideo && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {currentVideo.videoTitle || `Video ${currentVideoIndex + 1}`}
              </h2>
              <p className="text-gray-600">Clip ID: {currentVideo.clipId}</p>
            </div>

            {/* Video Element */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
              {currentVideo.driveLink ? (
                currentVideo.driveLink.includes('drive.google.com') ? (
                  // Google Drive iframe embed with custom overlay
                  <div className="relative w-full h-full bg-black">
                    <iframe
                      ref={videoRef}
                      src={`${currentVideo.driveLink}${currentVideo.driveLink.includes('?') ? '&' : '?'}autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={currentVideo.videoTitle}
                      style={{ pointerEvents: isPlaying ? 'none' : 'auto' }}
                    />
                    
                    {/* Invisible overlay to capture clicks and prevent focus issues */}
                    <div 
                      className="absolute inset-0 bg-transparent cursor-default"
                      style={{ pointerEvents: isPlaying ? 'auto' : 'none' }}
                      onMouseDown={(e) => e.preventDefault()}
                      onFocus={(e) => e.preventDefault()}
                      tabIndex={-1}
                    />
                    
                    {/* Timer overlay for Google Drive videos */}
                    {isPlaying && (
                      <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white px-4 py-2 rounded-lg text-lg font-mono shadow-lg">
                        {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
                      </div>
                    )}
                    
                    {/* Play button overlay for initial start */}
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <button
                          onClick={startVideo}
                          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-6 shadow-2xl transition-all duration-200 hover:scale-110"
                        >
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {/* Instruction overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-90 text-white px-6 py-3 rounded-lg text-center shadow-lg">
                      <p className="text-lg font-semibold">
                        <span className="text-yellow-300">⚡ Press SPACEBAR</span> when you believe an intervention is needed
                      </p>
                    </div>
                  </div>
                ) : (
                  // Regular video file
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls={false}
                    preload="metadata"
                  >
                    <source src={currentVideo.driveLink} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-white bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-semibold mb-2">Demo Mode</p>
                    <p className="text-blue-300 mb-2">{currentVideo.videoTitle}</p>
                    <p className="text-sm text-gray-400">Clip ID: {currentVideo.clipId}</p>
                    {currentVideo.hasIntervention && (
                      <p className="text-xs text-yellow-400 mt-2">
                        ⚠️ Intervention at {currentVideo.correctTime}s
                      </p>
                    )}
                    {isPlaying && (
                      <div className="mt-4">
                        <div className="text-2xl font-bold text-green-400">
                          {currentTime.toFixed(1)}s
                        </div>
                        <div className="text-xs text-gray-400">Demo Timer Running</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Response Overlay */}
              {showResponse && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-85 z-10">
                  <div className="bg-white rounded-xl p-8 text-center max-w-md shadow-2xl border-4 border-primary-500">
                    {showResponse.type === 'press' ? (
                      <>
                        <div className="text-6xl mb-4 animate-bounce">🚨</div>
                        <p className="text-2xl font-bold text-primary-600 mb-2">{showResponse.message}</p>
                        <p className="text-lg text-gray-700">Time: <span className="font-mono font-bold">{showResponse.time.toFixed(2)}s</span></p>
                        <div className="mt-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                          <p className="text-sm font-medium">✓ Spacebar detected successfully</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-6xl mb-4">
                          {showResponse.score === 1 ? '🎯' : '❌'}
                        </div>
                        <p className="text-2xl font-bold mb-4">
                          {showResponse.score === 1 ? 'Correct Response!' : 'Incorrect Response'}
                        </p>
                        <p className="text-gray-700 text-lg">{showResponse.feedback}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Video status and controls */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {!isPlaying ? (
                  <div className="flex items-center text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Click the play button on the video to start</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="font-bold">RECORDING</span>
                    <span className="ml-2 font-mono text-lg">
                      {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className={`border-2 rounded-lg px-6 py-3 mb-2 transition-all duration-150 ${
                  spacebarPressed 
                    ? 'bg-green-500 border-green-600 scale-110 shadow-lg' 
                    : 'bg-red-100 border-red-300'
                }`}>
                  <span className={`font-mono text-xl font-bold ${
                    spacebarPressed ? 'text-white' : 'text-red-800'
                  }`}>
                    SPACEBAR
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  {spacebarPressed ? '🚨 PRESSED!' : 'Press when intervention needed'}
                </p>
                {hasUserResponded.current && (
                  <p className="text-xs text-green-600 mt-1">✓ Response recorded this video</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Instructions Reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800">
            <strong>Remember:</strong> Press SPACEBAR when you believe an intervention is needed. 
            You have ±1.5 seconds from the correct time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
