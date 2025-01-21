
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');
  const [requestCount, setRequestCount] = useState(0);
  const [rateLimit, setRateLimit] = useState({
    limit: null,
    remaining: null,
    reset: null,
    retryAfter: null
  });
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let timer;
    if (rateLimit.retryAfter > 0) {
      setCountdown(rateLimit.retryAfter);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [rateLimit.retryAfter]);

  const handleRequest = async () => {
    setRequestCount((prevCount) => prevCount + 1);

    try {
      const response = await axios.get('http://localhost:5000/api/request', {
        headers: {
          Accept: 'application/json'
        }
      });

      const rateLimitInfo = {
        limit: parseInt(response.headers['x-ratelimit-limit']),
        remaining: parseInt(response.headers['x-ratelimit-remaining'] - 1),
        reset: parseInt(response.headers['x-ratelimit-reset']),
        retryAfter: null
      };

      setRateLimit(rateLimitInfo);
      setMessage(`Request #${requestCount + 1}: ${response.data.message}`);
    } catch (error) {
      if (error.response) {
        const rateLimitInfo = {
          limit: parseInt(error.response.headers['x-ratelimit-limit']),
          remaining: parseInt(error.response.headers['x-ratelimit-remaining']),
          reset: parseInt(error.response.headers['x-ratelimit-reset']),
          retryAfter: parseInt(error.response.data.retryAfter)
        };

        setRateLimit(rateLimitInfo);
        setMessage(`Request #${requestCount + 1}: Error - ${error.response.data.message}`);
      } else {
        setMessage(`Request #${requestCount + 1}: Error - Unable to connect to server.`);
      }
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-300 flex flex-col justify-center items-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-blue-600 mb-6 text-center">
          Rate Limiter Demo
        </h1>
        <button
          onClick={handleRequest}
          className={`w-full py-3 text-lg font-semibold rounded-lg mb-4 ${
            countdown > 0
              ? 'bg-gray-400 cursor-not-allowed text-gray-800'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          disabled={countdown > 0}
        >
          {countdown > 0 ? `Wait ${countdown}s` : 'Make Request'}
        </button>

        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-700 text-center">{message}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Rate Limit Information
          </h2>
          <ul className="space-y-2 text-center text-gray-700">
            <li>
              <span className="font-semibold">Limit:</span> {rateLimit.limit || 'N/A'}
            </li>
            <li>
              <span className="font-semibold">Remaining:</span> {rateLimit.remaining || 'N/A'}
            </li>
            <li>
              <span className="font-semibold">Reset Time:</span> {formatTime(rateLimit.reset)}
            </li>
            {rateLimit.retryAfter > 0 && (
              <li>
                <span className="font-semibold">Retry After:</span> {countdown || rateLimit.retryAfter}{' '}
                seconds
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
