import React, { useState } from 'react';
import OperatorIDModal from './components/OperatorIDModal';
import RulesSection from './components/RulesSection';
import ExamPortal from './components/ExamPortal';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operatorId, setOperatorId] = useState('');
  const [currentStep, setCurrentStep] = useState('welcome'); // welcome, rules, exam

  const handleBeginTest = () => {
    setIsModalOpen(true);
  };

  const handleVerificationComplete = (verifiedId) => {
    setOperatorId(verifiedId);
    setIsModalOpen(false);
    setCurrentStep('rules');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleProceedToExam = () => {
    setCurrentStep('exam');
  };

  const handleExamComplete = () => {
    // Handle exam completion - to be implemented
    console.log('Exam completed for operator:', operatorId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Exam Portal</h1>
            </div>
            {operatorId && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Operator ID: {operatorId}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {currentStep === 'welcome' && (
          <div className="text-center">
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to the Online Exam System
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Before you begin your examination, you'll need to verify your identity by entering your unique operator ID. 
                This ensures the security and integrity of the examination process.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 mb-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Before You Start:</h3>
              <ul className="text-left text-gray-600 space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Ensure you have your unique operator ID ready
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Make sure you have a stable internet connection
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Close all unnecessary applications and browser tabs
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  You will need to verify your operator ID twice for security
                </li>
              </ul>
            </div>

            <button
              onClick={handleBeginTest}
              className="inline-flex items-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Begin Test
            </button>
          </div>
        )}

        {currentStep === 'rules' && (
          <RulesSection 
            operatorId={operatorId}
            onProceedToExam={handleProceedToExam}
          />
        )}

        {currentStep === 'exam' && (
          <ExamPortal 
            operatorId={operatorId}
            onExamComplete={handleExamComplete}
          />
        )}
      </main>

      {/* Operator ID Modal */}
      <OperatorIDModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
}

export default App;
