import React, { useState } from 'react';

const OperatorIDModal = ({ isOpen, onClose, onVerificationComplete }) => {
  const [step, setStep] = useState(1); // 1: First ID Entry, 2: ID Verification, 3: Exam Code Entry
  const [firstId, setFirstId] = useState('');
  const [secondId, setSecondId] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examCodeAttempts, setExamCodeAttempts] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFirstContinue = () => {
    if (!firstId.trim()) {
      setError('Please enter your operator ID');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleVerification = async () => {
    if (!secondId.trim()) {
      setError('Please re-enter your operator ID');
      return;
    }

    setIsLoading(true);
    
    try {
      if (firstId.trim() === secondId.trim()) {
        // Case A: IDs Match - Proceed to Exam Code entry
        setError('');
        setStep(3); // Move to Exam Code step
      } else {
        // Case B: IDs Do Not Match
        setError('The IDs do not match. Please try again from the beginning.');
        // Reset to step 1 and clear entries
        setTimeout(() => {
          setStep(1);
          setFirstId('');
          setSecondId('');
          setError('');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error during verification process:', error);
      // Don't block user flow - continue with verification
      if (firstId.trim() === secondId.trim()) {
        setStep(3); // Move to Exam Code step
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExamCodeSubmit = async () => {
    if (!examCode.trim()) {
      setError('Please enter the exam code');
      return;
    }

    setIsLoading(true);
    
    try {
      // Validate exam code with backend
      const response = await fetch('/api/validate-exam-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          examCode: examCode.trim(),
          operatorId: firstId.trim()
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Exam code is valid - proceed to rules page
        setError('');
        onVerificationComplete(firstId.trim(), examCode.trim());
        handleClose();
      } else {
        // Exam code is invalid
        setExamCodeAttempts(prev => prev + 1);
        
        if (examCodeAttempts >= 1) {
          // Second attempt failed - redirect to login page
          setError('Invalid exam code. Redirecting to login page...');
          setTimeout(() => {
            handleClose();
            // This will effectively redirect to login page by closing modal
          }, 2000);
        } else {
          // First attempt failed - give another chance
          setError('Invalid exam code. Please try again.');
          setExamCode('');
        }
      }
    } catch (error) {
      console.error('❌ Error validating exam code:', error);
      setError('Error validating exam code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFirstId('');
    setSecondId('');
    setExamCode('');
    setExamCodeAttempts(0);
    setError('');
    setIsLoading(false);
    onClose();
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {step === 1 ? (
          // Step 1: First ID Entry
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Please Enter Your Operator ID
              </h2>
            </div>
            
            <div className="mb-6">
              <input
                type="text"
                value={firstId}
                onChange={(e) => setFirstId(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleFirstContinue)}
                placeholder="Enter your unique operator ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-gray-600 text-sm text-center">
                You will be asked to verify this ID on the next screen.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleFirstContinue}
                disabled={isLoading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        ) : step === 2 ? (
          // Step 2: ID Verification
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Verify Your Operator ID
              </h2>
              <p className="text-gray-600">
                Please re-enter your operator ID to confirm
              </p>
            </div>
            
            <div className="mb-6">
              <input
                type="text"
                value={secondId}
                onChange={(e) => setSecondId(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleVerification)}
                placeholder="Re-enter your operator ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setStep(1);
                  setSecondId('');
                  setError('');
                }}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleVerification}
                disabled={isLoading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </>
        ) : (
          // Step 3: Exam Code Entry
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Enter Exam Code
              </h2>
              <p className="text-gray-600">
                Please enter the exam code provided by your supervisor
              </p>
            </div>
            
            <div className="mb-6">
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => handleKeyPress(e, handleExamCodeSubmit)}
                placeholder="Enter exam code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg text-center font-mono tracking-wider"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {examCodeAttempts > 0 && examCodeAttempts < 2 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-600 text-sm">
                  Attempt {examCodeAttempts + 1} of 2. Please double-check the exam code.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setStep(2);
                  setExamCode('');
                  setExamCodeAttempts(0);
                  setError('');
                }}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleExamCodeSubmit}
                disabled={isLoading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OperatorIDModal;
