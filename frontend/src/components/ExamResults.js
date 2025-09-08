import React from 'react';

const ExamResults = ({ results, onRestart }) => {
  const { responses, totalScore, percentage, totalVideos, operatorId, sessionId } = results;

  const interventionClips = responses.filter(r => r.hasIntervention);
  const nonInterventionClips = responses.filter(r => !r.hasIntervention);
  
  const interventionScore = interventionClips.reduce((sum, r) => sum + r.score, 0);
  const nonInterventionScore = nonInterventionClips.reduce((sum, r) => sum + r.score, 0);

  // Debug logging for intervention classification
  console.log('📊 ExamResults Debug:', {
    totalResponses: responses.length,
    interventionClips: interventionClips.length,
    nonInterventionClips: nonInterventionClips.length,
    interventionScore,
    nonInterventionScore,
    responses: responses.map(r => ({ clipId: r.clipId, hasIntervention: r.hasIntervention, score: r.score }))
  });

  const averageReactionTime = interventionClips
    .filter(r => r.reactionTime !== null)
    .reduce((sum, r, _, arr) => sum + Math.abs(r.reactionTime) / arr.length, 0);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Examination Complete!
        </h1>
        <p className="text-lg text-gray-600">
          Operator: <span className="font-semibold text-primary-600">{operatorId}</span>
        </p>
        <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
      </div>

      {/* Overall Score */}
      <div className={`bg-white rounded-xl shadow-sm border-2 p-8 mb-8 ${getScoreBgColor(percentage)}`}>
        <div className="text-center">
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(percentage)}`}>
            {percentage}%
          </div>
          <div className="text-2xl font-semibold text-gray-800 mb-4">
            Overall Score
          </div>
          <div className="text-lg text-gray-600">
            {totalScore} out of {totalVideos || responses.length} clips answered correctly
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Intervention Clips */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Intervention Clips</h3>
          </div>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {interventionScore}/{interventionClips.length}
          </div>
          <div className="text-sm text-gray-600">
            {interventionClips.length > 0 ? 
              `${((interventionScore / interventionClips.length) * 100).toFixed(1)}% accuracy` :
              'No intervention clips'
            }
          </div>
        </div>

        {/* Non-Intervention Clips */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Non-Intervention Clips</h3>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {nonInterventionScore}/{nonInterventionClips.length}
          </div>
          <div className="text-sm text-gray-600">
            {nonInterventionClips.length > 0 ?
              `${((nonInterventionScore / nonInterventionClips.length) * 100).toFixed(1)}% accuracy` :
              'No non-intervention clips'
            }
          </div>
        </div>

        {/* Reaction Time */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Avg Reaction Time</h3>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {averageReactionTime ? `${averageReactionTime.toFixed(2)}s` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">
            Average deviation from correct time
          </div>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Detailed Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correct Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reaction Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {responses.map((response, index) => (
                <tr key={index} className={response.score === 1 ? 'bg-green-50' : 'bg-red-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{response.clipId}</div>
                    <div className="text-sm text-gray-500">{response.videoTitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      response.hasIntervention 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {response.hasIntervention ? 'Intervention' : 'No Intervention'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {response.correctTime !== null ? `${response.correctTime.toFixed(2)}s` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {response.userPressTime !== null ? `${response.userPressTime.toFixed(2)}s` : 'No response'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {response.reactionTime !== null ? (
                      <span className={response.reactionTime > 0 ? 'text-red-600' : 'text-blue-600'}>
                        {response.reactionTime > 0 ? '+' : ''}{response.reactionTime.toFixed(2)}s
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {response.score === 1 ? (
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-600">{response.feedback}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="text-center">
        <button
          onClick={onRestart}
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start New Examination
        </button>
      </div>
    </div>
  );
};

export default ExamResults;
