import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function BackendTest() {
  const [status, setStatus] = useState('Testing...');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [debugInfo, setDebugInfo] = useState({});
  const [detailedLogs, setDetailedLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setDetailedLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };

  useEffect(() => {
    const testBackend = async () => {
      const results = {};
      const debug = {};
      
      // Log environment variables
      debug.envVars = {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        VITE_DEPLOYMENT: import.meta.env.VITE_DEPLOYMENT,
        VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION
      };
      
      console.log("🔧 Environment Variables:", debug.envVars);
      setDebugInfo(debug);
      addLog("Environment variables loaded", "info");
      
      try {
        // Test 1: Unified API client health check
        addLog("Testing unified API client health check...", "info");
        try {
          const healthResponse = await api.health();
          results.unifiedHealth = { success: true, data: healthResponse };
          addLog("✅ Unified API client health check successful", "success");
          console.log("✅ Unified API health check passed:", healthResponse);
        } catch (error) {
          results.unifiedHealth = { success: false, error: error.message };
          addLog(`❌ Unified API client health check failed: ${error.message}`, "error");
          console.error("❌ Unified API health check failed:", error);
        }

        // Test 2: Unified API client query
        addLog("Testing unified API client query...", "info");
        try {
          const queryResponse = await api.query({
            query: 'test query',
            course_id: 'decision',
            user_id: 'test'
          });
          results.unifiedQuery = { success: true, data: queryResponse };
          addLog("✅ Unified API client query successful", "success");
          console.log("✅ Unified API query test passed:", queryResponse);
        } catch (error) {
          results.unifiedQuery = { success: false, error: error.message };
          addLog(`❌ Unified API client query failed: ${error.message}`, "error");
          console.error("❌ Unified API query test failed:", error);
        }

        // Test 3: Course metadata
        addLog("Testing course metadata...", "info");
        try {
          const courseResponse = await api.courseMeta('decision');
          results.courseMeta = { success: true, data: courseResponse };
          addLog("✅ Course metadata successful", "success");
          console.log("✅ Course metadata test passed:", courseResponse);
        } catch (error) {
          results.courseMeta = { success: false, error: error.message };
          addLog(`❌ Course metadata failed: ${error.message}`, "error");
          console.error("❌ Course metadata test failed:", error);
        }
        
        setStatus('✅ Backend Tests Completed!');
        setTestResults(results);
        setError(null);
        
      } catch (error) {
        console.error("❌ Backend test failed:", error);
        setStatus('❌ Backend Test Failed');
        setError(error.message);
        setTestResults(results);
        addLog(`❌ Overall test failed: ${error.message}`, "error");
      }
    };

    testBackend();
  }, []);

  const runQueryTest = async () => {
    try {
      setStatus('Testing query endpoint...');
      addLog("Manual query test started...", "info");
      const queryResponse = await api.query({
        query: 'What is decision making?',
        course_id: 'decision',
        user_id: 'test'
      });
      setData({ query: queryResponse });
      setStatus('✅ Query Test Passed!');
      setError(null);
      addLog("✅ Manual query test successful", "success");
    } catch (error) {
      setStatus('❌ Query Test Failed');
      setError(error.message);
      addLog(`❌ Manual query test failed: ${error.message}`, "error");
    }
  };

  const testDirectFetch = async () => {
    try {
      setStatus('Testing direct fetch...');
      addLog("Manual direct fetch test started...", "info");
      const response = await api.health();
      const data = response;
      setData({ directFetch: data });
      setStatus('✅ Direct Fetch Test Passed!');
      setError(null);
      addLog("✅ Manual direct fetch test successful", "success");
    } catch (error) {
      setStatus('❌ Direct Fetch Test Failed');
      setError(error.message);
      addLog(`❌ Manual direct fetch test failed: ${error.message}`, "error");
    }
  };

  const testCorsHeaders = async () => {
    try {
      setStatus('Testing CORS headers...');
      addLog("Testing CORS headers with OPTIONS request...", "info");
      
      const response = await api.query({
        query: 'test query',
        course_id: 'decision',
        user_id: 'test',
        method: 'OPTIONS'
      });
      
      const corsData = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      };
      
      setData({ corsTest: corsData });
      setStatus('✅ CORS Test Completed!');
      setError(null);
      addLog("✅ CORS headers test completed", "success");
    } catch (error) {
      setStatus('❌ CORS Test Failed');
      setError(error.message);
      addLog(`❌ CORS test failed: ${error.message}`, "error");
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Backend Connection Test</h3>
      
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
        {error && (
          <p className="text-red-600 mt-2">
            <strong>Error:</strong> {error}
          </p>
        )}
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Environment Variables:</h4>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo.envVars, null, 2)}
        </pre>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Test Results:</h4>
          <div className="space-y-2">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="flex items-center">
                <span className={`mr-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? '✅' : '❌'}
                </span>
                <span className="capitalize">{testName}</span>
                {!result.success && (
                  <span className="ml-2 text-xs text-red-500">
                    ({result.error})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-x-2 mb-4">
        <button
          onClick={runQueryTest}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Test Query Endpoint
        </button>
        
        <button
          onClick={testDirectFetch}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Test Direct Fetch
        </button>

        <button
          onClick={testCorsHeaders}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Test CORS Headers
        </button>
      </div>

      {data && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Response Data:</h4>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-64">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {detailedLogs.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Detailed Logs:</h4>
          <div className="bg-gray-100 p-3 rounded max-h-48 overflow-auto">
            {detailedLogs.map((log, index) => (
              <div key={index} className={`text-xs mb-1 ${
                log.type === 'error' ? 'text-red-600' : 
                log.type === 'success' ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_URL || 'Not set'}</p>
        <p><strong>Deployment:</strong> {import.meta.env.VITE_DEPLOYMENT || 'Not set'}</p>
        <p><strong>Version:</strong> {import.meta.env.VITE_APP_VERSION || 'Not set'}</p>
        <p><strong>Current Origin:</strong> {window.location.origin}</p>
      </div>
    </div>
  );
}
