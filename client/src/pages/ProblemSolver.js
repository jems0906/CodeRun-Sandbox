import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Play, ArrowLeft, Clock, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { problemsAPI, executionAPI } from '../services/api';
import toast from 'react-hot-toast';

const LANGUAGE_CONFIGS = {
  python: {
    label: 'Python',
    monacoLanguage: 'python',
    defaultCode: `def solution():
    # Write your code here
    pass

# Test your solution
if __name__ == "__main__":
    result = solution()
    print(result)`,
  },
  javascript: {
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    defaultCode: `function solution() {
    // Write your code here
    return null;
}

// Test your solution
// console.log(solution());`,
  },
};

const ProblemSolver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  // Fetch problem details
  const { data: problem, isLoading: problemLoading, error: problemError } = useQuery(
    ['problem', id],
    () => problemsAPI.getById(id),
    {
      onError: (error) => {
        toast.error('Failed to load problem');
      }
    }
  );

  // Initialize code when problem loads or language changes
  useEffect(() => {
    if (problem?.data) {
      const signature = selectedLanguage === 'python' 
        ? problem.data.function_signature_python 
        : problem.data.function_signature_javascript;
      
      if (signature) {
        if (selectedLanguage === 'python') {
          setCode(`${signature}
    # Write your implementation here
    pass

# Test cases will be run automatically`);
        } else {
          setCode(`${signature}
    // Write your implementation here
    return null;
}

// Test cases will be run automatically`);
        }
      } else {
        setCode(LANGUAGE_CONFIGS[selectedLanguage].defaultCode);
      }
    }
  }, [problem, selectedLanguage]);

  // Submit code mutation
  const submitMutation = useMutation(executionAPI.submit, {
    onSuccess: (response) => {
      const { submissionId, jobId } = response.data;
      toast.success('Code submitted successfully!');
      setSubmissionResult({ 
        status: 'pending', 
        submissionId, 
        jobId,
        message: 'Your code is being executed...' 
      });
      startPolling(submissionId);
    },
    onError: (error) => {
      toast.error('Failed to submit code');
      console.error('Submission error:', error);
    }
  });

  // Polling for results
  const startPolling = useCallback((submissionId) => {
    setIsPolling(true);
    setPollingAttempts(0);
    pollForResults(submissionId);
  }, [pollForResults]);

  const pollForResults = useCallback(async (submissionId) => {
    try {
      const response = await executionAPI.getStatus(submissionId);
      const result = response.data;
      
      if (result.status === 'completed' || result.status === 'failed') {
        setSubmissionResult(result);
        setIsPolling(false);
        setPollingAttempts(0);
        
        if (result.status === 'completed') {
          if (result.result === 'Accepted') {
            toast.success('All test cases passed!');
          } else {
            toast.error(`${result.result} - Check the test results below`);
          }
        } else {
          toast.error('Execution failed');
        }
      } else if (pollingAttempts < 30) { // Poll for max 30 attempts (60 seconds)
        setPollingAttempts(prev => prev + 1);
        setTimeout(() => pollForResults(submissionId), 2000);
      } else {
        setSubmissionResult(prev => ({
          ...prev,
          status: 'timeout',
          message: 'Execution timed out'
        }));
        setIsPolling(false);
        toast.error('Execution timed out');
      }
    } catch (error) {
      console.error('Polling error:', error);
      setIsPolling(false);
      toast.error('Failed to get execution status');
    }
  }, [pollingAttempts]);

  // Handle code submission
  const handleSubmit = () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }

    if (!problem?.data) {
      toast.error('Problem not loaded');
      return;
    }

    submitMutation.mutate({
      problemId: parseInt(id),
      language: selectedLanguage,
      code: code.trim(),
      userId: 'anonymous_user' // In a real app, this would come from auth
    });
  };

  // Handle language change
  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setSubmissionResult(null); // Clear previous results
  };

  const renderTestResults = () => {
    if (!submissionResult?.testResults) return null;

    return (
      <div className="test-cases">
        <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Test Case Results:</h4>
        {submissionResult.testResults.map((testCase, index) => (
          <div key={index} className={`test-case ${testCase.passed ? 'passed' : 'failed'}`}>
            <div className="test-case-header">
              {testCase.passed ? (
                <CheckCircle size={16} style={{ color: '#22c55e' }} />
              ) : (
                <XCircle size={16} style={{ color: '#ef4444' }} />
              )}
              Test Case {index + 1}: {testCase.passed ? 'Passed' : 'Failed'}
              {testCase.runtime && (
                <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.875rem' }}>
                  {testCase.runtime}ms
                </span>
              )}
            </div>
            <div className="test-case-details">
              <div><strong>Input:</strong> {JSON.stringify(testCase.input)}</div>
              <div><strong>Expected:</strong> {JSON.stringify(testCase.expected)}</div>
              <div><strong>Actual:</strong> {JSON.stringify(testCase.actual)}</div>
              {testCase.error && (
                <div style={{ color: '#ef4444' }}><strong>Error:</strong> {testCase.error}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSampleTestCases = () => {
    if (!problem?.data?.sample_test_cases) return null;

    return (
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Sample Test Cases</h3>
        {problem.data.sample_test_cases.map((testCase, index) => (
          <div key={index} style={{ 
            background: '#f8fafc', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            marginBottom: '1rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
              Example {index + 1}:
            </div>
            <div style={{ fontFamily: 'Monaco, monospace', fontSize: '0.875rem' }}>
              <div><strong>Input:</strong> {JSON.stringify(testCase.input)}</div>
              <div><strong>Output:</strong> {JSON.stringify(testCase.expected)}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (problemLoading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner">
            <Clock size={24} />
          </div>
          <span style={{ marginLeft: '0.5rem' }}>Loading problem...</span>
        </div>
      </div>
    );
  }

  if (problemError || !problem?.data) {
    return (
      <div className="container">
        <div className="error">
          <h3>Problem Not Found</h3>
          <p>The requested problem could not be loaded.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/problems')}
            style={{ marginTop: '1rem' }}
          >
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      {/* Header */}
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/problems')}
            className="btn btn-secondary"
            style={{ padding: '0.5rem', minWidth: 'auto' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="editor-title">{problem.data.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span className={`difficulty ${problem.data.difficulty.toLowerCase()}`}>
                {problem.data.difficulty}
              </span>
              <span>{problem.data.category}</span>
              {problem.data.time_complexity && (
                <span>Time: {problem.data.time_complexity}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Language Selector */}
        <div className="language-selector">
          {Object.entries(LANGUAGE_CONFIGS).map(([lang, config]) => (
            <button
              key={lang}
              className={`language-btn ${selectedLanguage === lang ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang)}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="editor-layout">
        {/* Problem Panel */}
        <div className="problem-panel">
          <div style={{ lineHeight: '1.6' }}>
            <div style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
              {problem.data.description}
            </div>
            
            {renderSampleTestCases()}
            
            {problem.data.time_complexity && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                  Complexity Analysis:
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  <div><strong>Time Complexity:</strong> {problem.data.time_complexity}</div>
                  <div><strong>Space Complexity:</strong> {problem.data.space_complexity}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Panel */}
        <div className="code-panel">
          {/* Editor Actions */}
          <div className="editor-actions">
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitMutation.isLoading || isPolling}
            >
              {submitMutation.isLoading || isPolling ? (
                <>
                  <div className="spinner"><Clock size={16} /></div>
                  {isPolling ? 'Running Tests...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run Code
                </>
              )}
            </button>
            
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {selectedLanguage === 'python' ? 'Python 3.9' : 'Node.js 18'}
            </span>
          </div>

          {/* Monaco Editor */}
          <div className="monaco-editor-container">
            <Editor
              height="100%"
              language={LANGUAGE_CONFIGS[selectedLanguage].monacoLanguage}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: selectedLanguage === 'python' ? 4 : 2,
                insertSpaces: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {/* Results Panel */}
          {submissionResult && (
            <div className="results-panel">
              <div className="result-header">
                <h3>Execution Results</h3>
                <span className={`result-status ${submissionResult.result?.toLowerCase().replace(' ', '-') || submissionResult.status}`}>
                  {submissionResult.result || submissionResult.status.toUpperCase()}
                </span>
              </div>

              {submissionResult.runtime !== undefined && submissionResult.memory !== undefined && (
                <div className="result-stats">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} />
                    <span>Runtime: {submissionResult.runtime}ms</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={16} />
                    <span>Memory: {submissionResult.memory}KB</span>
                  </div>
                </div>
              )}

              {submissionResult.errorMessage && (
                <div style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertCircle size={16} style={{ color: '#ef4444' }} />
                    <strong style={{ color: '#ef4444' }}>Error</strong>
                  </div>
                  <pre style={{ color: '#991b1b', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                    {submissionResult.errorMessage}
                  </pre>
                </div>
              )}

              {renderTestResults()}

              {submissionResult.status === 'pending' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  color: '#64748b',
                  marginTop: '1rem'
                }}>
                  <div className="spinner">
                    <Clock size={16} />
                  </div>
                  <span>Executing your code... (Attempt {pollingAttempts + 1}/30)</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemSolver;