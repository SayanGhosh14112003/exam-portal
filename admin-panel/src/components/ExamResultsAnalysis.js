import React, { useState, useEffect } from 'react';

const ExamResultsAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedExamCode, setSelectedExamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [examCodes, setExamCodes] = useState([]);

  // Filter states
  const [searchUserId, setSearchUserId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  // Fetch exam codes and initial analysis on component mount
  useEffect(() => {
    fetchExamCodes();
    fetchAnalysis();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchExamCodes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/exam-codes`);
      const data = await response.json();
      
      if (data.success) {
        setExamCodes(data.examCodes);
      }
    } catch (err) {
      console.error('Error fetching exam codes:', err);
    }
  };

  const fetchAnalysis = async (examCode = null) => {
    try {
      setLoading(true);
      setError('');
      
      const url = examCode 
        ? `${API_BASE_URL}/admin/results?examCode=${examCode}`
        : `${API_BASE_URL}/admin/results`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data.analysis);
      } else {
        setError(data.error || 'Failed to fetch analysis data');
      }
    } catch (err) {
      setError('Network error: Unable to fetch analysis data');
      console.error('Error fetching analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExamCodeChange = (examCode) => {
    setSelectedExamCode(examCode);
    fetchAnalysis(examCode || null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Attempted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter attempts based on search and filter criteria
  const getFilteredAttempts = () => {
    if (!analysisData || !analysisData.attempts) return [];
    
    return analysisData.attempts.filter(attempt => {
      // User ID search
      if (searchUserId && !attempt.userId?.toLowerCase().includes(searchUserId.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filterStatus && attempt.status !== filterStatus) {
        return false;
      }
      
      // Date range filter
      if (filterStartDate || filterEndDate) {
        const attemptDate = new Date(attempt.startTime);
        if (isNaN(attemptDate.getTime())) return true; // Skip filtering if date is invalid
        
        if (filterStartDate) {
          const startDate = new Date(filterStartDate);
          if (attemptDate < startDate) return false;
        }
        
        if (filterEndDate) {
          const endDate = new Date(filterEndDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          if (attemptDate > endDate) return false;
        }
      }
      
      return true;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchUserId('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exam Results Analysis Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">
              Monitor exam performance and analyze user results
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedExamCode}
              onChange={(e) => handleExamCodeChange(e.target.value)}
              className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">All Exam Codes</option>
              {examCodes.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <button
              onClick={() => fetchAnalysis(selectedExamCode || null)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User ID Search */}
            <div>
              <label htmlFor="searchUserId" className="block text-sm font-medium text-gray-700 mb-1">
                Search User ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="searchUserId"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  placeholder="Enter User ID..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Start Date Filter */}
            <div>
              <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date From
              </label>
              <input
                type="date"
                id="filterStartDate"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date To
              </label>
              <input
                type="date"
                id="filterEndDate"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className={`inline-flex items-center justify-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  (searchUserId || filterStatus || filterStartDate || filterEndDate) 
                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchUserId || filterStatus || filterStartDate || filterEndDate) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-500">Active filters:</span>
              {searchUserId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  User ID: {searchUserId}
                  <button
                    onClick={() => setSearchUserId('')}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterStatus && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Status: {filterStatus}
                  <button
                    onClick={() => setFilterStatus('')}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterStartDate && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  From: {filterStartDate}
                  <button
                    onClick={() => setFilterStartDate('')}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterEndDate && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  To: {filterEndDate}
                  <button
                    onClick={() => setFilterEndDate('')}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !analysisData && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg text-gray-600">Loading analysis data...</span>
          </div>
        </div>
      )}

      {/* Analysis Dashboard */}
      {analysisData && (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Attempts</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{analysisData.totalAttempts}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{analysisData.completedAttempts}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{analysisData.inProgressAttempts}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{analysisData.averageScore.toFixed(1)}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Detailed Results 
                  {selectedExamCode && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Exam Code: {selectedExamCode})
                    </span>
                  )}
                </h3>
                <div className="text-sm text-gray-500">
                  {getFilteredAttempts().length} of {analysisData.attempts.length} attempts shown
                </div>
              </div>
            </div>
            <div className="overflow-hidden">
              {getFilteredAttempts().length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">
                    {analysisData.attempts.length === 0 ? 'No exam attempts found' : 'No attempts match the current filters'}
                  </p>
                  {analysisData.attempts.length > 0 && getFilteredAttempts().length === 0 && (
                    <button
                      onClick={clearFilters}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exam Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <span>Status</span>
                            <div className="relative">
                              <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded px-2 py-1 text-xs font-normal text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                              >
                                <option value="">All</option>
                                <option value="Submitted">Submitted</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Attempted">Attempted</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredAttempts().map((attempt, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {attempt.userId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {attempt.examCode || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(attempt.status)}`}>
                              {attempt.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {attempt.status === 'Submitted' ? (
                              <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-2 bg-gray-200 rounded-full mr-3">
                                  <div 
                                    className="h-2 bg-blue-500 rounded-full" 
                                    style={{ width: `${Math.min(attempt.totalScore, 100)}%` }}
                                  ></div>
                                </div>
                                <span>{attempt.totalScore}%</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(attempt.startTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attempt.endTime ? formatDate(attempt.endTime) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Available Exam Codes Summary */}
          {analysisData.examCodes.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Exam Codes</h3>
              <div className="flex flex-wrap gap-2">
                {analysisData.examCodes.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExamResultsAnalysis;
