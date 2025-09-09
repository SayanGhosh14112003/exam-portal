import React, { useState, useEffect, useRef, useCallback } from 'react';


import axios from 'axios';




const VideoPlayer = ({ operatorId, examCode, onExamComplete }) => {
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoStartTime, setVideoStartTime] = useState(null);
  const [responses, setResponses] = useState([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [showResponse, setShowResponse] = useState(null);
  const [spacebarPressed, setSpacebarPressed] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [viewedVideos, setViewedVideos] = useState(new Set()); // Track which videos have been viewed

  const videoRef = useRef(null);
  const spacebarPressTime = useRef(null);
  const hasUserResponded = useRef(false);


const handleVideoComplete = useCallback(() => {
  const currentVideo = getCurrentVideo();
  console.log(`🎬 Video completed: ${currentVideo?.videoTitle} (${currentVideo?.clipId}) - Index: ${currentVideoIndex}`);
  
  // Prevent duplicate completion calls for the same video
  if (showNextButton) {
    console.log("⚠️ Video already completed, skipping duplicate call");
    return;
  }
  
  setIsPlaying(false);
  setShowNextButton(true); // ensure button shows after video ends

  if (!currentVideo) return;

  // Check if we already have a response for this video
  const existingResponse = responses.find(r => r.clipId === currentVideo.clipId);
  if (existingResponse) {
    console.log(`⚠️ Response already exists for ${currentVideo.clipId}, skipping duplicate`);
    return;
  }

  // Mark this video as viewed
  setViewedVideos(prev => new Set(prev).add(currentVideoIndex));

  const result = calculateScore(currentVideo);

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

  console.log(`📝 Creating response for ${currentVideo.clipId}:`, response);

  setResponses(prev => [...prev, response]);
  submitResponse(response);

  // Show the Next Video button - user must manually proceed
  // This ensures users don't accidentally skip videos

}, [videos,
  currentVideoIndex,
  operatorId,
  sessionId,
  onExamComplete,
  responses]);


    const handleVideoCompleteRef = useRef(handleVideoComplete);
    
    // Update ref when function changes
    useEffect(() => {
      handleVideoCompleteRef.current = handleVideoComplete;
    }, [handleVideoComplete]);







  // Fetch videos on component mount
  useEffect(() => {
    fetchVideos();

    // Handle early exit detection
    const handleBeforeUnload = async (event) => {
      // Only mark as attempted if exam is in progress (not completed)
      if (responses.length > 0 && responses.length < videos.length) {
        try {
          // Use sendBeacon for reliable delivery even when page is closing
          const data = JSON.stringify({
            operatorId,
            sessionId,
            status: 'Attempted',
            endTime: new Date().toISOString(),
            totalScore: responses.reduce((sum, r) => sum + r.score, 0)
          });

          navigator.sendBeacon('/api/update-exam-status', data);
          console.log('⚠️ Exam marked as Attempted (early exit detected)');
        } catch (error) {
          console.error('Failed to mark exam as attempted:', error);
        }
      }
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup intervals and event listener on unmount
    return () => {
      if (window.videoInterval) {
        clearInterval(window.videoInterval);
      }
      if (window.demoInterval) {
        clearInterval(window.demoInterval);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [responses, videos.length, operatorId, sessionId]);





  //new added

  // Auto-start the video whenever currentVideoIndex changes
  useEffect(() => {
    if (videos.length > 0) {
      startVideo();
    }
  }, [currentVideoIndex]);


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

  // This is the useEffect from Step 2
  useEffect(() => {
    handleVideoCompleteRef.current = handleVideoComplete;
  }, [handleVideoComplete]);

  // This is your main video setup useEffect (Step 3)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log("🎯 useEffect (video setup) running for video:", currentVideo?.videoTitle);

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      setCurrentTime(currentTime);
      
      // Check if video is near the end (within 0.5 seconds) and ensure Next button shows
      if (duration && currentTime >= duration - 0.5 && !showNextButton) {
        console.log("🎯 Video near end, ensuring Next button shows");
        setShowNextButton(true);
        
        // Also trigger video complete logic if not already triggered
        if (currentTime >= duration - 0.1) {
          console.log("🎬 Video ended via timeupdate check");
          handleVideoCompleteRef.current();
        }
      }
    };

    // This now uses the ref to call the up-to-date function
    const handleVideoEnd = () => {
      console.log("🎬 Native ended event fired");
      handleVideoCompleteRef.current(); 
    };

    const handleLoadedMetadata = () => {
      // ... (rest of this function is unchanged)
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleVideoEnd);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Fallback timeout to ensure Next button appears
    const fallbackTimeout = setTimeout(() => {
      if (!showNextButton && video.duration && video.currentTime >= video.duration * 0.95) {
        console.log("⏰ Fallback timeout: Ensuring Next button shows");
        setShowNextButton(true);
        handleVideoCompleteRef.current();
      }
    }, (video.duration || 60) * 1000 + 1000); // Video duration + 1 second buffer

    return () => {
      console.log("♻️ Cleaning up video event listeners");
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleVideoEnd);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      clearTimeout(fallbackTimeout);
    };
  }, [currentVideoIndex]); // Only re-run when video changes, not when button state changes

  // Additional fallback: Ensure Next button appears after video duration
  useEffect(() => {
    if (isPlaying && videoDuration > 0 && !showNextButton) {
      console.log("⏰ Setting fallback timer for Next button:", videoDuration, "seconds");
      const timer = setTimeout(() => {
        console.log("⏰ Fallback timer: Showing Next button after", videoDuration, "seconds");
        setShowNextButton(true);
        handleVideoCompleteRef.current();
      }, (videoDuration + 1) * 1000); // Video duration + 1 second

      return () => clearTimeout(timer);
    }
  }, [isPlaying, videoDuration, showNextButton]);








  // new added

  // Actively update currentTime via requestAnimationFrame
  useEffect(() => {
    let animationFrameId;

    const updateCurrentTime = () => {
      if (isPlaying && videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        animationFrameId = requestAnimationFrame(updateCurrentTime);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateCurrentTime);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying]);

  // Fetch videos from backend
  const fetchVideos = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = examCode ? `/api/videos?examCode=${encodeURIComponent(examCode)}` : '/api/videos';
      const response = await axios.get(url);

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
  }, [examCode]);

  const handleSpacebarPress = () => {
    if (!isPlaying || !videoStartTime) return;

    const pressTime = Date.now();
    const videoTime = (pressTime - videoStartTime) / 1000; // Convert to seconds

    spacebarPressTime.current = videoTime;
    hasUserResponded.current = true;
    setShowNextButton(true); // Show Next button after spacebar press

    console.log(`🔘 Spacebar pressed at video time: ${videoTime.toFixed(2)}s`);

    // Show immediate visual feedback
    setShowResponse({
      type: 'press',
      time: videoTime,
      message: 'Intervention Recorded!'
    });
    setTimeout(() => setShowResponse(null), 1500);
  };

  // const startVideo = () => {

  //new modified version
  const startVideo = async () => {
    const currentVideo = getCurrentVideo();
    console.log(`🎬 Starting video ${currentVideoIndex + 1}/${videos.length}: ${currentVideo?.videoTitle} (${currentVideo?.clipId})`);
    
    if (!currentVideo) {
      console.error('❌ No current video found for index:', currentVideoIndex);
      return;
    }

    if (currentVideo?.driveLink) {
      if (currentVideo.driveLink.includes('drive.google.com')) {
        // Google Drive video - simulate playback with overlay control
        setVideoStartTime(Date.now());
        setIsPlaying(true);
        hasUserResponded.current = false;
        spacebarPressTime.current = null;
        setCurrentTime(0);
        setVideoDuration(120); // Set 2-minute duration for Google Drive videos

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
          //  video.play();

          // updated version:
          try {
            await video.play();
            setIsPlaying(true);
            setVideoStartTime(Date.now());
            hasUserResponded.current = false;
            spacebarPressTime.current = null;
            console.log(`▶️ Started video: ${currentVideo?.videoTitle}`);
          } catch (err) {
            console.error('❌ Error starting video:', err);
          }

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
      setVideoDuration(20); // Set 20-second duration for demo mode

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

  // Calculate score based on user response and video intervention
  const calculateScore = (video) => {
    const { hasIntervention, correctTime } = video;
    const userPressed = hasUserResponded.current;
    const pressTime = spacebarPressTime.current;

    if (hasIntervention) {
      // Case A: Clip WITH Intervention
      if (userPressed && pressTime !== null && correctTime !== null) {
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
        examCode,
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

    const nextIndex = currentVideoIndex + 1;
    console.log('🔄 Moving to next video:', {
      currentVideoIndex,
      nextIndex,
      totalVideos: videos.length,
      responsesCount: responses.length,
      viewedVideosCount: viewedVideos.size,
      isLastVideo: currentVideoIndex >= videos.length - 1
    });

    if (currentVideoIndex < videos.length - 1) {
      console.log(`➡️ Moving from video ${currentVideoIndex + 1} to video ${nextIndex + 1}`);
      
      // Reset all states before moving to next video
      setCurrentTime(0);
      setVideoDuration(0);
      setIsPlaying(false);
      hasUserResponded.current = false;
      spacebarPressTime.current = 
      null;
      setShowResponse(null);
      setShowNextButton(false);
      
      // Move to next video index
      setCurrentVideoIndex(nextIndex);
    } else {
      // We're on the last video - complete the exam
      console.log('🏁 On last video, completing exam');
      handleExamComplete();
    }
  };

  const [examSubmitted, setExamSubmitted] = useState(false);

  const handleExamComplete = async () => {
    // Prevent duplicate submissions
    if (examSubmitted) {
      console.log('⚠️ Exam already submitted, skipping duplicate submission');
      return;
    }

    setExamSubmitted(true);

    const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
    const totalVideos = videos.length;
    const percentage = totalVideos > 0 ? ((totalScore / totalVideos) * 100).toFixed(1) : '0.0';

    console.log('🎯 Exam completed!', {
      totalResponses: responses.length,
      totalVideos: totalVideos,
      correctResponses: totalScore,
      percentage: `${percentage}%`,
      responses: responses.map(r => ({ clipId: r.clipId, hasIntervention: r.hasIntervention, score: r.score }))
    });

    // Mark exam as "Submitted" when all clips are completed
    try {
      await axios.post('/api/update-exam-status', {
        operatorId,
        sessionId,
        status: 'Submitted',
        endTime: new Date().toISOString(),
        totalScore: totalScore,
        examCode
      });
      console.log('✅ Exam marked as Submitted');
    } catch (error) {
      console.error('Failed to mark exam as submitted:', error);
    }

    onExamComplete({
      responses,
      totalScore,
      percentage,
      totalVideos,
      operatorId,
      sessionId
    });
  };

  const getCurrentVideo = () => videos[currentVideoIndex];
  const currentVideo = getCurrentVideo();

  // Helper function to format time in mm:ss format
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || timeInSeconds === 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


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
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentVideo.videoTitle || `Video ${currentVideoIndex + 1}`}
                </h2>
                <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Video {currentVideoIndex + 1} of {videos.length}
                </div>
              </div>
            </div>

            {/* Video Element */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
              {currentVideo.driveLink ? (
                currentVideo.driveLink.includes('drive.google.com') ? (
                  // Google Drive iframe embed with custom overlay
                  <div className="relative w-full h-full bg-black">
                    <iframe
                      ref={videoRef}
                      src={currentVideo.driveLink}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={currentVideo.videoTitle}
                      style={{ pointerEvents: isPlaying ? 'none' : 'auto' }}
                      onLoad={() => {
                        console.log(`✅ Iframe loaded: ${currentVideo.videoTitle}`);
                      }}
                      onError={() => console.error(`❌ Iframe error: ${currentVideo.videoTitle}`)}
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
                      <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm font-mono">
                        {formatTime(currentTime)} / {formatTime(videoDuration)}
                      </div>
                    )}

                    {/* Assessment running overlay */}
                    {isPlaying && (
                      <div className="absolute top-4 left-4 bg-red-600 bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg animate-pulse">
                        🔴 ASSESSMENT ACTIVE
                      </div>
                    )}


                    {/* Manual start button for Google Drive videos */}
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
                        <div className="text-center max-w-md mx-4">
                          <div className="bg-blue-600 text-white px-6 py-4 rounded-lg mb-6">
                            <h3 className="text-lg font-bold mb-2">📹 Video Assessment Instructions</h3>
                            <ol className="text-sm text-left space-y-2">
                              <li>1. <strong>Click "Open Video"</strong> to view the video in a new tab</li>
                              <li>2. <strong>Watch the video</strong> in the new tab (keep this tab open)</li>
                              <li>3. <strong>Return here</strong> and click "Start Assessment"</li>
                              <li>4. <strong>Press SPACEBAR</strong> when you see an intervention needed</li>
                            </ol>
                          </div>

                          <div className="flex space-x-4 justify-center">
                            <a
                              href={currentVideo.originalDriveLink || currentVideo.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                            >
                              🔗 Open Video
                            </a>
                            <button
                              onClick={startVideo}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                            >
                              ▶️ Start Assessment
                            </button>
                          </div>

                          <p className="text-white text-sm mt-4 opacity-80">
                            Assessment duration: {formatTime(videoDuration) || '2 minutes'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Instruction overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-90 text-white px-6 py-3 rounded-lg text-center shadow-lg">
                      {isPlaying ? (
                        <div>
                          <p className="text-lg font-semibold mb-1">
                            <span className="text-yellow-300">⚡ Press SPACEBAR</span> when you believe an intervention is needed
                          </p>
                          <p className="text-sm opacity-80">
                            💡 Watch the video in the other tab while keeping this tab active for spacebar input
                          </p>
                        </div>
                      ) : (
                        <p className="text-lg font-semibold">
                          <span className="text-yellow-300">⚡ Press SPACEBAR</span> when you believe an intervention is needed
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Regular video file (Firebase/other direct URLs)
                  <div className="relative w-full h-full bg-black">
                    {
                      // new changed version 2
                      <video
                        key={currentVideo.clipId}
                        ref={videoRef}
                        className="w-full h-full"
                        controls={false}
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          const duration = e.target.duration;
                          console.log('📏 Metadata loaded, duration =', duration);
                          setVideoDuration(duration || 120); // fallback
                        }}
                      >
                        <source src={currentVideo.driveLink} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>


                    }

                    {/* Start button for Firebase videos */}
                    {!isPlaying && !showNextButton && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                        <button
                          onClick={startVideo}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-xl font-semibold shadow-2xl transition-all duration-200 hover:scale-105"
                        >
                          ▶️ Start Video Assessment
                        </button>
                      </div>
                    )}

                    {/* Video Duration Display */}
                    {isPlaying && (
                      <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm font-mono">
                        {formatTime(currentTime)} / {formatTime(videoDuration)}
                      </div>
                    )}
                  </div>
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
                  <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Ready to start</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="font-bold">RECORDING</span>
                    <span className="ml-2 font-mono text-lg">
                      {formatTime(currentTime)} / {formatTime(videoDuration)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className={`border-2 rounded-lg px-6 py-3 mb-2 transition-all duration-150 ${spacebarPressed
                  ? 'bg-green-500 border-green-600 scale-110 shadow-lg'
                  : 'bg-red-100 border-red-300'
                  }`}>
                  <span className={`font-mono text-xl font-bold ${spacebarPressed ? 'text-white' : 'text-red-800'
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

              <div className="text-right">
                {showNextButton && (

                  <button
                    onClick={moveToNextVideo}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-lg"
                  >
                    {currentVideoIndex === videos.length - 1 
                      ? `Complete Exam ✓ (${currentVideoIndex + 1}/${videos.length})`
                      : `Next Video → (${currentVideoIndex + 1}/${videos.length})`}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Instructions - Only show for first video and before it starts */}
      {currentVideoIndex === 0 && !isPlaying && !showNextButton && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Assessment Instructions</h3>
              <ul className="text-yellow-800 space-y-1 text-sm">
                <li>• <strong>Press SPACEBAR</strong> when you believe an intervention is needed</li>
                <li>• You have <strong>±1.5 seconds</strong> from the correct intervention time</li>
                <li>• Each video is approximately <strong>2 minutes</strong> long</li>
                <li>• The assessment will automatically progress to the next video</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Simple instruction reminder during exam */}
      {isPlaying && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-gray-700 text-sm">
            ⚡ <strong>Press SPACEBAR</strong> when intervention needed • <strong>±1.5s</strong> response window
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
