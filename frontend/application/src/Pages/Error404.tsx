import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

const Error404: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const errorMessage = location.state?.errorMessage || 'An unexpected error occurred.';

  const handleGoBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  const handleGoHome = () => {
    navigate('/'); // Navigate to the home page
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
            
        <Card className="w-full bg-gray-800 border border-red-800 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Oops! Something went wrong.
            </CardTitle>
            <CardDescription className="text-gray-300 mt-2">
              We encountered an error while trying to load the page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="my-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-white font-medium">Error Details:</h3>
              </div>
              <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
                <p className="text-red-400 font-mono text-sm">{errorMessage}</p>
              </div>
            </div>
            
            <div className="flex flex-row justify-center gap-4 mt-6">
              <button
                onClick={handleGoBack}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
              <button
                onClick={handleGoHome}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Dashboard
              </button>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-gray-500 flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>If this problem persists, please contact support or check the system status.</span>
        </div>
      </div>
    </div>
  );
};

export default Error404;
