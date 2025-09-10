import React, { useState, useEffect } from 'react';

const QuestionBankManagement = () => {
  const [examCodes, setExamCodes] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createExamStep, setCreateExamStep] = useState('examCode'); // 'examCode' | 'questions'
  const [newExamCode, setNewExamCode] = useState('');
  const [newExamQuestions, setNewExamQuestions] = useState([{
    clipId: '',
    hasIntervention: false,
    correctTime: '',
    fireBaseLink: ''
  }]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editingClips, setEditingClips] = useState([]);
  const [showDeleteClipModal, setShowDeleteClipModal] = useState(false);
  const [clipToDelete, setClipToDelete] = useState(null);
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    clipId: '',
    hasIntervention: false,
    correctTime: '',
    fireBaseLink: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteExamCode, setDeleteExamCode] = useState('');
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState('input'); // 'input' | 'confirm'

  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  // Test API connectivity
  const testAPIConnectivity = async () => {
    try {
      console.log('Testing API connectivity...');
      const response = await fetch(`${API_BASE_URL}/admin/exam-codes`);
      console.log('API test response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('API test successful:', data);
      } else {
        console.log('API test failed with status:', response.status);
      }
    } catch (err) {
      console.error('API connectivity test failed:', err);
    }
  };

  // Fetch active exam codes on component mount
  useEffect(() => {
    testAPIConnectivity();
    fetchExamCodes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchExamCodes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/admin/exam-codes`);
      const data = await response.json();
      
      if (data.success) {
        setExamCodes(data.examCodes);
      } else {
        setError(data.error || 'Failed to fetch exam codes');
      }
    } catch (err) {
      setError('Network error: Unable to fetch exam codes');
      console.error('Error fetching exam codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamDetails = async (examCode) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/admin/exam/${examCode}`);
      const data = await response.json();
      
      if (data.success) {
        setExamDetails(data.examDetails);
        setSelectedExam(examCode);
      } else {
        setError(data.error || 'Failed to fetch exam details');
      }
    } catch (err) {
      setError('Network error: Unable to fetch exam details');
      console.error('Error fetching exam details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExamInput = () => {
    setShowDeleteModal(true);
    setDeleteConfirmationStep('input');
    setDeleteExamCode('');
    setError('');
  };

  const handleValidateDeleteExamCode = async () => {
    if (!deleteExamCode.trim()) {
      setError('Please enter an exam code');
      return;
    }

    // Check if the exam code exists in the available exam codes
    const examCodeExists = examCodes.some(code => 
      code.toLowerCase() === deleteExamCode.trim().toLowerCase()
    );

    if (!examCodeExists) {
      setError(`Exam code "${deleteExamCode}" not found in QuestionBank. Please check the exam code and try again.`);
      return;
    }

    // If exam code exists, proceed to confirmation
    setError('');
    setDeleteConfirmationStep('confirm');
  };

  const handleDeleteExam = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`${API_BASE_URL}/admin/exam/${deleteExamCode.trim()}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Exam ${deleteExamCode} deleted successfully. ${data.deletedCount} clips were removed.`);
        setShowDeleteModal(false);
        setDeleteConfirmationStep('input');
        setDeleteExamCode('');
        
        // If the deleted exam was currently selected, clear the selection
        if (selectedExam && selectedExam.toLowerCase() === deleteExamCode.toLowerCase()) {
          setSelectedExam(null);
          setExamDetails(null);
        }
        
        await fetchExamCodes(); // Refresh exam codes list
      } else {
        setError(data.error || 'Failed to delete exam');
      }
    } catch (err) {
      setError('Network error: Unable to delete exam');
      console.error('Error deleting exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteConfirmationStep('input');
    setDeleteExamCode('');
    setError('');
  };

  const handleEditExam = async (examCode) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const fullURL = `${API_BASE_URL}/admin/exam/${examCode}`;
      console.log('=== EDIT EXAM DEBUG ===');
      console.log('Exam Code:', examCode);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Full URL:', fullURL);
      console.log('Window location:', window.location.href);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(fullURL, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success && data.examDetails && data.examDetails.clips) {
        console.log('Setting edit modal data...');
        setEditingExam(examCode);
        setEditingClips(data.examDetails.clips);
        setShowEditModal(true);
        setError(''); // Clear any previous errors
        console.log('Edit modal should now be open');
      } else {
        const errorMsg = data.error || data.message || 'Failed to fetch exam details for editing';
        console.log('Setting error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching exam for editing:', err);
      const errorMsg = err.name === 'AbortError' ? 'Request timeout' : `Network error: ${err.message}`;
      console.log('Setting error from catch:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
      console.log('=== END EDIT EXAM DEBUG ===');
    }
  };

  const handleDeleteClip = (clipId) => {
    setClipToDelete(clipId);
    setShowDeleteClipModal(true);
  };

  const handleConfirmDeleteClip = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/admin/clip/${clipToDelete}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        // Remove clip from local state
        setEditingClips(clips => clips.filter(clip => clip.clipId !== clipToDelete));
        setSuccess(`Clip ${clipToDelete} deleted successfully`);
        setShowDeleteClipModal(false);
        setClipToDelete(null);
      } else {
        setError(data.error || 'Failed to delete clip');
      }
    } catch (err) {
      setError('Network error: Unable to delete clip');
      console.error('Error deleting clip:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeleteClip = () => {
    setShowDeleteClipModal(false);
    setClipToDelete(null);
  };

  const handleAddQuestion = () => {
    setShowAddQuestionForm(true);
    setNewQuestion({
      clipId: '',
      hasIntervention: false,
      correctTime: '',
      fireBaseLink: ''
    });
  };

  const handleSaveNewQuestion = async () => {
    if (!newQuestion.clipId.trim()) {
      setError('Clip ID is required');
      return;
    }

    // Check if clip ID already exists in current exam
    const clipExists = editingClips.some(clip => 
      clip.clipId.toLowerCase() === newQuestion.clipId.trim().toLowerCase()
    );

    if (clipExists) {
      setError(`Clip ID "${newQuestion.clipId}" already exists in this exam`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/admin/exam/${editingExam}/clip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clipId: newQuestion.clipId.trim(),
          hasIntervention: newQuestion.hasIntervention,
          correctTime: newQuestion.correctTime,
          fireBaseLink: newQuestion.fireBaseLink
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        // Add new clip to local state
        const newClip = {
          clipId: newQuestion.clipId.trim(),
          hasIntervention: newQuestion.hasIntervention,
          correctTime: parseFloat(newQuestion.correctTime) || null,
          isActive: true,
          fireBaseLink: newQuestion.fireBaseLink
        };
        setEditingClips(clips => [...clips, newClip]);
        setSuccess(`Clip ${newQuestion.clipId} added successfully`);
        setShowAddQuestionForm(false);
        setNewQuestion({
          clipId: '',
          hasIntervention: false,
          correctTime: '',
          fireBaseLink: ''
        });
      } else {
        setError(data.error || 'Failed to add clip');
      }
    } catch (err) {
      setError('Network error: Unable to add clip');
      console.error('Error adding clip:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAddQuestion = () => {
    setShowAddQuestionForm(false);
    setNewQuestion({
      clipId: '',
      hasIntervention: false,
      correctTime: '',
      fireBaseLink: ''
    });
    setError('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingExam(null);
    setEditingClips([]);
    setShowAddQuestionForm(false);
    setError('');
    setSuccess('');
    setClipToDelete(null);
    setShowDeleteClipModal(false);
    setNewQuestion({
      clipId: '',
      hasIntervention: false,
      correctTime: '',
      fireBaseLink: ''
    });
    // Refresh the exam codes list to reflect any changes
    fetchExamCodes();
    // If we're viewing the exam that was edited, refresh its details
    if (selectedExam === editingExam) {
      fetchExamDetails(selectedExam);
    }
  };

  const handleCreateExam = () => {
    setShowCreateModal(true);
    setCreateExamStep('examCode');
    setNewExamCode('');
    setNewExamQuestions([{
      clipId: '',
      hasIntervention: false,
      correctTime: '',
      fireBaseLink: ''
    }]);
    setError('');
    setSuccess('');
  };

  const handleValidateExamCode = () => {
    if (!newExamCode.trim()) {
      setError('Exam code is required');
      return;
    }

    // Check if exam code already exists (case-insensitive)
    const codeExists = examCodes.some(code => 
      code.toLowerCase() === newExamCode.trim().toLowerCase()
    );

    if (codeExists) {
      setError(`Exam code "${newExamCode}" already exists. Please modify the existing exam or choose a different code.`);
      return;
    }

    // Proceed to questions step
    setCreateExamStep('questions');
    setError('');
  };

  const handleAddQuestionToNewExam = () => {
    setNewExamQuestions([...newExamQuestions, {
      clipId: '',
      hasIntervention: false,
      correctTime: '',
      fireBaseLink: ''
    }]);
  };

  const handleRemoveQuestionFromNewExam = (index) => {
    if (newExamQuestions.length > 1) {
      const updatedQuestions = newExamQuestions.filter((_, i) => i !== index);
      setNewExamQuestions(updatedQuestions);
    }
  };

  const handleUpdateNewExamQuestion = (index, field, value) => {
    const updatedQuestions = newExamQuestions.map((question, i) => 
      i === index ? { ...question, [field]: value } : question
    );
    setNewExamQuestions(updatedQuestions);
  };

  const handleCreateNewExam = async () => {
    // Validate all questions
    const invalidQuestions = newExamQuestions.filter(q => !q.clipId.trim());
    if (invalidQuestions.length > 0) {
      setError('All questions must have a Clip ID');
      return;
    }

    // Check for duplicate clip IDs within the new exam
    const clipIds = newExamQuestions.map(q => q.clipId.trim().toLowerCase());
    const duplicateIds = clipIds.filter((id, index) => clipIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      setError(`Duplicate Clip IDs found: ${duplicateIds.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/admin/exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examCode: newExamCode.trim(),
          clips: newExamQuestions.map(q => ({
            clipId: q.clipId.trim(),
            hasIntervention: q.hasIntervention,
            correctTime: q.correctTime,
            fireBaseLink: q.fireBaseLink
          }))
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Exam "${newExamCode}" created successfully with ${newExamQuestions.length} questions`);
        setShowCreateModal(false);
        setCreateExamStep('examCode');
        setNewExamCode('');
        setNewExamQuestions([{
          clipId: '',
          hasIntervention: false,
          correctTime: '',
          fireBaseLink: ''
        }]);
        // Refresh exam codes list
        fetchExamCodes();
      } else {
        setError(data.error || 'Failed to create exam');
      }
    } catch (err) {
      setError('Network error: Unable to create exam');
      console.error('Error creating exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCreateExam = () => {
    setShowCreateModal(false);
    setCreateExamStep('examCode');
    setNewExamCode('');
    setNewExamQuestions([{
      clipId: '',
      hasIntervention: false,
      correctTime: '',
      fireBaseLink: ''
    }]);
    setError('');
    setSuccess('');
  };

  const handleBackToExamCode = () => {
    setCreateExamStep('examCode');
    setError('');
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">QuestionBank Management</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage exam content and monitor active exam codes
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateExam}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Exam
            </button>
            <button
              onClick={handleDeleteExamInput}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Exam
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
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
            <button onClick={clearMessages} className="ml-auto">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="mt-1 text-sm text-green-700">{success}</p>
            </div>
            <button onClick={clearMessages} className="ml-auto">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Exam Codes List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Active Exam Codes</h3>
            <p className="mt-1 text-sm text-gray-600">
              {examCodes.length} active exam codes found
            </p>
          </div>
          <div className="p-6">
            {loading && !examCodes.length ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading exam codes...
              </div>
            ) : examCodes.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-500">No active exam codes found</p>
                <button
                  onClick={fetchExamCodes}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {examCodes.map((examCode) => (
                  <div
                    key={examCode}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedExam === examCode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => fetchExamDetails(examCode)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="font-medium text-gray-900">{examCode}</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exam Details Panel */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedExam ? `Exam Details: ${selectedExam}` : 'Exam Details'}
              </h3>
              {selectedExam && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      clearMessages();
                      handleEditExam(selectedExam);
                    }}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {loading ? 'Loading...' : 'Edit'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            {!selectedExam ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">Select an exam code to view details</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading exam details...
              </div>
            ) : examDetails ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">{examDetails.totalClips}</div>
                    <div className="text-sm text-blue-600">Total Clips</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">{examDetails.activeClips}</div>
                    <div className="text-sm text-green-600">Active Clips</div>
                  </div>
                </div>

                {/* Clips List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Video Clips</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {examDetails.clips.map((clip, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${clip.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">{clip.clipId}</div>
                            <div className="text-xs text-gray-500">
                              {clip.hasIntervention ? 'Has Intervention' : 'No Intervention'} 
                              {clip.correctTime && ` • ${clip.correctTime}s`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {clip.fireBaseLink && (
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            clip.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {clip.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-500">Failed to load exam details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Exam Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {deleteConfirmationStep === 'input' ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mt-5 text-center">Delete Exam</h3>
                  <div className="mt-4">
                    <label htmlFor="deleteExamCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Exam Code to Delete:
                    </label>
                    <input
                      type="text"
                      id="deleteExamCode"
                      value={deleteExamCode}
                      onChange={(e) => setDeleteExamCode(e.target.value.toUpperCase())}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="e.g., PK95, PK23, EX123"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleValidateDeleteExamCode();
                        }
                      }}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Available exam codes: {examCodes.join(', ')}
                    </div>
                  </div>
                  
                  {error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  
                  <div className="mt-5 flex space-x-3">
                    <button
                      onClick={handleValidateDeleteExamCode}
                      disabled={loading || !deleteExamCode.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mt-5 text-center">Confirm Deletion</h3>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Are you sure you want to permanently delete exam:
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                      <p className="text-lg font-bold text-red-800">{deleteExamCode}</p>
                    </div>
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ This action cannot be undone and will remove all associated clips from the QuestionBank.
                    </p>
                  </div>
                  
                  <div className="mt-5 flex space-x-3">
                    <button
                      onClick={handleDeleteExam}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {loading ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmationStep('input')}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Placeholder modals for Create and Edit */}
      {/* Create New Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {createExamStep === 'examCode' ? 'Create New Exam - Step 1' : `Create New Exam: ${newExamCode} - Step 2`}
                </h3>
                <button
                  onClick={handleCancelCreateExam}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {createExamStep === 'examCode' 
                  ? 'Enter a unique exam code to get started'
                  : 'Add questions to your new exam'
                }
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Exam Code */}
            {createExamStep === 'examCode' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="newExamCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Code *
                  </label>
                  <input
                    type="text"
                    id="newExamCode"
                    value={newExamCode}
                    onChange={(e) => setNewExamCode(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., EXAM2024_001"
                    onKeyPress={(e) => e.key === 'Enter' && handleValidateExamCode()}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a unique exam code. This cannot be changed later.
                  </p>
                </div>

                {examCodes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Exam Codes:</h4>
                    <div className="flex flex-wrap gap-2">
                      {examCodes.map(code => (
                        <span key={code} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelCreateExam}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleValidateExamCode}
                    disabled={!newExamCode.trim()}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Next: Add Questions
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Questions */}
            {createExamStep === 'questions' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        Questions ({newExamQuestions.length} total)
                      </h4>
                      <button
                        onClick={handleAddQuestionToNewExam}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Question
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {newExamQuestions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-sm font-medium text-gray-900">Question {index + 1}</h5>
                          {newExamQuestions.length > 1 && (
                            <button
                              onClick={() => handleRemoveQuestionFromNewExam(index)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                              title="Remove this question"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Clip ID *
                            </label>
                            <input
                              type="text"
                              value={question.clipId}
                              onChange={(e) => handleUpdateNewExamQuestion(index, 'clipId', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="e.g., CLIP_001"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Correct Time (seconds)
                            </label>
                            <input
                              type="number"
                              value={question.correctTime}
                              onChange={(e) => handleUpdateNewExamQuestion(index, 'correctTime', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="e.g., 15.5"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Has Intervention
                            </label>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`hasIntervention_${index}`}
                                  checked={question.hasIntervention === true}
                                  onChange={() => handleUpdateNewExamQuestion(index, 'hasIntervention', true)}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">Yes</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`hasIntervention_${index}`}
                                  checked={question.hasIntervention === false}
                                  onChange={() => handleUpdateNewExamQuestion(index, 'hasIntervention', false)}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">No</span>
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Firebase Link
                            </label>
                            <input
                              type="url"
                              value={question.fireBaseLink}
                              onChange={(e) => handleUpdateNewExamQuestion(index, 'fireBaseLink', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="https://firebasestorage.googleapis.com/..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handleBackToExamCode}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Exam Code
                  </button>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelCreateExam}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateNewExam}
                      disabled={loading || newExamQuestions.some(q => !q.clipId.trim())}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Exam'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Edit Exam: {editingExam}</h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Manage clips for this exam. You can delete existing clips or add new ones.
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-green-700">{success}</p>
                  <button
                    onClick={() => setSuccess('')}
                    className="text-green-400 hover:text-green-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Clips Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Exam Clips ({editingClips.length} total)
                  </h4>
                  <button
                    onClick={handleAddQuestion}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Question
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clip ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Intervention
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correct Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Video Link
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editingClips.map((clip, index) => (
                      <tr key={clip.clipId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {clip.clipId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            clip.hasIntervention 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {clip.hasIntervention ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {clip.correctTime ? `${clip.correctTime}s` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            clip.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {clip.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {clip.fireBaseLink ? (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="text-blue-600">Video</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No video</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteClip(clip.clipId)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                            title="Delete this clip"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {editingClips.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No clips found for this exam</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add Question Form */}
            {showAddQuestionForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Add New Question</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="newClipId" className="block text-sm font-medium text-gray-700 mb-1">
                      Clip ID *
                    </label>
                    <input
                      type="text"
                      id="newClipId"
                      value={newQuestion.clipId}
                      onChange={(e) => setNewQuestion({...newQuestion, clipId: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., CLIP_001"
                    />
                  </div>
                  <div>
                    <label htmlFor="newCorrectTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Time (seconds)
                    </label>
                    <input
                      type="number"
                      id="newCorrectTime"
                      value={newQuestion.correctTime}
                      onChange={(e) => setNewQuestion({...newQuestion, correctTime: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., 15.5"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Has Intervention
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="hasIntervention"
                          checked={newQuestion.hasIntervention === true}
                          onChange={() => setNewQuestion({...newQuestion, hasIntervention: true})}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="hasIntervention"
                          checked={newQuestion.hasIntervention === false}
                          onChange={() => setNewQuestion({...newQuestion, hasIntervention: false})}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="newFireBaseLink" className="block text-sm font-medium text-gray-700 mb-1">
                      Firebase Link
                    </label>
                    <input
                      type="url"
                      id="newFireBaseLink"
                      value={newQuestion.fireBaseLink}
                      onChange={(e) => setNewQuestion({...newQuestion, fireBaseLink: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://firebasestorage.googleapis.com/..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={handleCancelAddQuestion}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewQuestion}
                    disabled={loading || !newQuestion.clipId.trim()}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Done'}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end">
              <button
                onClick={handleCloseEditModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Clip Confirmation Modal */}
      {showDeleteClipModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-5">Delete Question</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this question <strong>{clipToDelete}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleConfirmDeleteClip}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Question'}
                </button>
                <button
                  onClick={handleCancelDeleteClip}
                  className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankManagement;
