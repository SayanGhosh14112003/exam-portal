import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import ExamResults from './ExamResults';

const ExamPortal = ({ operatorId, onExamComplete }) => {
  const [examState, setExamState] = useState('ready'); // ready, active, completed
  const [examResults, setExamResults] = useState(null);

  const handleStartExam = () => {
    setExamState('active');
  };

  const handleExamComplete = (results) => {
    setExamResults(results);
    setExamState('completed');
    onExamComplete(results);
  };

  const handleRestart = () => {
    setExamState('ready');
    setExamResults(null);
  };

  if (examState === 'active') {
    return (
      <VideoPlayer 
        operatorId={operatorId}
        onExamComplete={handleExamComplete}
      />
    );
  }

  if (examState === 'completed' && examResults) {
    return (
      <ExamResults 
        results={examResults}
        onRestart={handleRestart}
      />
    );
  }
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video Intervention Assessment</h1>
            <p className="text-gray-600 mt-1">Operator: <span className="font-medium text-primary-600">{operatorId}</span></p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-primary-600">0 / 20</div>
            <div className="text-sm text-gray-500">Videos Completed</div>
          </div>
        </div>
      </div>

      {/* Main Exam Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Exam Portal Ready
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            The video intervention assessment system is ready to begin. This is where the 20 video clips 
            will be displayed and you'll use the SPACEBAR to indicate when interventions are needed.
          </p>

          {/* Instructions Reminder */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Quick Reminder:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8v2.25H5.25v2.25H2.5v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121 9z" />
                </svg>
                Press SPACEBAR for interventions
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Respond within 1.5 seconds
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                60% contain interventions
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                20 clips (~2 min each)
              </div>
            </div>
          </div>

          {/* Placeholder for Video Player */}
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 mb-8">
            <div className="text-center">
              <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Video Player Area</h3>
              <p className="text-gray-500">
                Video clips will be displayed here during the examination.
                <br />
                <span className="text-sm">(Video player implementation - Next Module)</span>
              </p>
            </div>
          </div>

          {/* Control Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="bg-white border-2 border-gray-300 rounded-lg px-4 py-2 mb-2 font-mono text-lg font-bold">
                  SPACEBAR
                </div>
                <p className="text-sm text-gray-600">Press when intervention needed</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 text-primary-800 rounded-lg px-4 py-2 mb-2 text-lg font-bold">
                  1.5s
                </div>
                <p className="text-sm text-gray-600">Maximum response time</p>
              </div>
            </div>
          </div>

          {/* Start Exam Button */}
          <div className="mt-8">
            <button
              onClick={handleStartExam}
              className="inline-flex items-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1" />
              </svg>
              Start Video Examination
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPortal;
