import React, { useState, useEffect } from 'react';
import QuestionBankManagement from './QuestionBankManagement';
import ExamResultsAnalysis from './ExamResultsAnalysis';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('questionbank');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticatedAdminId, setAuthenticatedAdminId] = useState('');
  
  // Settings modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsStep, setSettingsStep] = useState('menu'); // 'menu', 'verify', 'create', 'success', 'delete-verify', 'delete-confirm', 'delete-success'
  const [settingsAction, setSettingsAction] = useState(''); // 'add', 'delete'
  const [verifyAdminId, setVerifyAdminId] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [deleteAdminId, setDeleteAdminId] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [createdAdminData, setCreatedAdminData] = useState(null);
  const [deletedAdminData, setDeletedAdminData] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  // Google Sheets-based authentication
  const handleAuthentication = async (e) => {
    e.preventDefault();
    
    if (!adminId.trim() || !adminPassword.trim()) {
      setAuthError('Please enter both Admin ID and Password');
      return;
    }

    try {
      setLoading(true);
      setAuthError('');

      const response = await fetch(`${API_BASE_URL}/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: adminId.trim(),
          password: adminPassword.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setAuthenticatedAdminId(data.adminId);
        setAuthError('');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Network error: Unable to authenticate');
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminId('');
    setAdminPassword('');
    setAuthError('');
    setAuthenticatedAdminId('');
  };

  // Settings modal functions
  const openSettings = () => {
    setShowSettingsModal(true);
    setSettingsStep('menu');
    resetSettingsForm();
  };

  const closeSettings = () => {
    setShowSettingsModal(false);
    setSettingsStep('menu');
    resetSettingsForm();
  };

  const resetSettingsForm = () => {
    setSettingsAction('');
    setVerifyAdminId('');
    setVerifyPassword('');
    setNewAdminId('');
    setNewAdminPassword('');
    setDeleteAdminId('');
    setSettingsError('');
    setSettingsLoading(false);
    setCreatedAdminData(null);
    setDeletedAdminData(null);
  };

  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    
    if (!verifyAdminId.trim() || !verifyPassword.trim()) {
      setSettingsError('Please enter both Admin ID and Password');
      return;
    }

    try {
      setSettingsLoading(true);
      setSettingsError('');

      const response = await fetch(`${API_BASE_URL}/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: verifyAdminId.trim(),
          password: verifyPassword.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (settingsAction === 'add') {
          setSettingsStep('create');
        } else if (settingsAction === 'delete') {
          setSettingsStep('delete-confirm');
        }
        setSettingsError('');
      } else {
        setSettingsError('Invalid credentials. Please verify your identity.');
      }
    } catch (err) {
      setSettingsError('Network error: Unable to verify identity');
      console.error('Verification error:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (!newAdminId.trim() || !newAdminPassword.trim()) {
      setSettingsError('Please enter both new Admin ID and Password');
      return;
    }

    if (newAdminPassword.length < 6) {
      setSettingsError('Password must be at least 6 characters long');
      return;
    }

    try {
      setSettingsLoading(true);
      setSettingsError('');

      const response = await fetch(`${API_BASE_URL}/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newAdminId: newAdminId.trim(),
          newPassword: newAdminPassword.trim(),
          createdBy: authenticatedAdminId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreatedAdminData({
          adminId: newAdminId.trim(),
          password: newAdminPassword.trim(),
          createdAt: new Date().toLocaleString(),
          createdBy: authenticatedAdminId
        });
        setSettingsStep('success');
        setSettingsError('');
      } else {
        setSettingsError(data.error || 'Failed to create admin');
      }
    } catch (err) {
      setSettingsError('Network error: Unable to create admin');
      console.error('Create admin error:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAdmin = async (e) => {
    e.preventDefault();
    
    if (!deleteAdminId.trim()) {
      setSettingsError('Please enter the Admin ID to delete');
      return;
    }

    if (deleteAdminId.trim().toLowerCase() === authenticatedAdminId.toLowerCase()) {
      setSettingsError('You cannot delete your own admin account');
      return;
    }

    try {
      setSettingsLoading(true);
      setSettingsError('');

      const response = await fetch(`${API_BASE_URL}/admin/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminIdToDelete: deleteAdminId.trim(),
          deletedBy: authenticatedAdminId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDeletedAdminData({
          adminId: deleteAdminId.trim(),
          deletedAt: new Date().toLocaleString(),
          deletedBy: authenticatedAdminId
        });
        setSettingsStep('delete-success');
        setSettingsError('');
      } else {
        setSettingsError(data.error || 'Failed to delete admin');
      }
    } catch (err) {
      setSettingsError('Network error: Unable to delete admin');
      console.error('Delete admin error:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const downloadAdminCredentials = () => {
    if (!createdAdminData) return;

    const docContent = `
ADMIN CREDENTIALS

Admin ID: ${createdAdminData.adminId}
Password: ${createdAdminData.password}
Created At: ${createdAdminData.createdAt}
Created By: ${createdAdminData.createdBy}

IMPORTANT:
- Keep these credentials secure and confidential
- Do not share these credentials with unauthorized personnel
- Change the password after first login if required
- Contact system administrator if credentials are compromised

Generated by Exam Portal Admin System
    `.trim();

    const blob = new Blob([docContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Admin_Credentials_${createdAdminData.adminId}_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-900">Admin Panel Access</h2>
            <p className="mt-2 text-center text-gray-600">
              Enter your Admin ID and Password to access the admin panel
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAuthentication}>
            <div className="space-y-4">
              <div>
                <label htmlFor="admin-id" className="sr-only">
                  Admin ID
                </label>
                <input
                  id="admin-id"
                  name="adminId"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Admin ID"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="sr-only">
                  Password
                </label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </div>
            {authError && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                {authError}
              </div>
            )}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </div>
                ) : (
                  'Access Admin Panel'
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Credentials are verified from Google Sheets
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {authenticatedAdminId || 'Administrator'}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('questionbank')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'questionbank'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                QuestionBank Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Results (Analysis Dashboard)
              </div>
            </button>
            <button
              onClick={openSettings}
              className={`py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'questionbank' && <QuestionBankManagement />}
          {activeTab === 'results' && <ExamResultsAnalysis />}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {settingsStep === 'menu' && 'Settings'}
                  {settingsStep === 'verify' && 'Verify Identity'}
                  {settingsStep === 'create' && 'Create New Admin'}
                  {settingsStep === 'success' && 'Admin Created Successfully'}
                  {settingsStep === 'delete-verify' && 'Verify Identity'}
                  {settingsStep === 'delete-confirm' && 'Delete Admin'}
                  {settingsStep === 'delete-success' && 'Admin Deleted Successfully'}
                </h3>
                <button
                  onClick={closeSettings}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Settings Menu */}
              {settingsStep === 'menu' && (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setSettingsAction('add');
                      setSettingsStep('verify');
                    }}
                    className="w-full flex items-center px-4 py-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Add Admin</div>
                      <div className="text-sm text-gray-500">Create a new administrator account</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSettingsAction('delete');
                      setSettingsStep('delete-verify');
                    }}
                    className="w-full flex items-center px-4 py-3 text-left border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Delete Admin</div>
                      <div className="text-sm text-gray-500">Remove an administrator account</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Identity Verification Step */}
              {settingsStep === 'verify' && (
                <form onSubmit={handleVerifyIdentity} className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Please verify your identity by re-entering your current credentials.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Admin ID
                    </label>
                    <input
                      type="text"
                      value={verifyAdminId}
                      onChange={(e) => setVerifyAdminId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={verifyPassword}
                      onChange={(e) => setVerifyPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {settingsError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      {settingsError}
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setSettingsStep('menu')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {settingsLoading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </form>
              )}

              {/* Create Admin Step */}
              {settingsStep === 'create' && (
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Create a new administrator account with the following credentials.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Admin ID
                    </label>
                    <input
                      type="text"
                      value={newAdminId}
                      onChange={(e) => setNewAdminId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new admin ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength={6}
                    />
                  </div>
                  {settingsError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      {settingsError}
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setSettingsStep('verify')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {settingsLoading ? 'Creating...' : 'Create Admin'}
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Identity Verification Step */}
              {settingsStep === 'delete-verify' && (
                <form onSubmit={handleVerifyIdentity} className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Please verify your identity by re-entering your current credentials before deleting an admin.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Admin ID
                    </label>
                    <input
                      type="text"
                      value={verifyAdminId}
                      onChange={(e) => setVerifyAdminId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={verifyPassword}
                      onChange={(e) => setVerifyPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {settingsError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      {settingsError}
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setSettingsStep('menu')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {settingsLoading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Confirmation Step */}
              {settingsStep === 'delete-confirm' && (
                <form onSubmit={handleDeleteAdmin} className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-red-800">
                        <strong>Warning:</strong> This action cannot be undone. The admin account will be permanently deleted.
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin ID to Delete
                    </label>
                    <input
                      type="text"
                      value={deleteAdminId}
                      onChange={(e) => setDeleteAdminId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter the Admin ID to delete"
                      required
                    />
                  </div>
                  {settingsError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      {settingsError}
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setSettingsStep('delete-verify')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {settingsLoading ? 'Deleting...' : 'Delete Admin'}
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Success Step */}
              {settingsStep === 'delete-success' && deletedAdminData && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-green-800">
                        <strong>Admin account deleted successfully!</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Deletion Details:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Deleted Admin ID:</strong> {deletedAdminData.adminId}</div>
                      <div><strong>Deleted At:</strong> {deletedAdminData.deletedAt}</div>
                      <div><strong>Deleted By:</strong> {deletedAdminData.deletedBy}</div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={closeSettings}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Success Step */}
              {settingsStep === 'success' && createdAdminData && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-green-800">
                        <strong>Admin account created successfully!</strong>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="text-sm text-yellow-800">
                      <strong>Important:</strong> Please save these admin credentials securely. This information will not be displayed again.
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">New Admin Details:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Admin ID:</strong> {createdAdminData.adminId}</div>
                      <div><strong>Password:</strong> {createdAdminData.password}</div>
                      <div><strong>Created:</strong> {createdAdminData.createdAt}</div>
                      <div><strong>Created By:</strong> {createdAdminData.createdBy}</div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={downloadAdminCredentials}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download .doc File
                    </button>
                    <button
                      onClick={closeSettings}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
