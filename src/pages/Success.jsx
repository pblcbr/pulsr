import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Success = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const id = query.get('session_id');
    if (id) {
      // In a real application, you would send this sessionId to your backend
      // to verify the payment and update the user's subscription status.
      // For this example, we'll just simulate a successful verification.
      setTimeout(() => {
        setMessage('Payment successful! Your subscription is now active.');
        setLoading(false);
      }, 2000);
    } else {
      setMessage('No session ID found. Payment status unknown.');
      setLoading(false);
    }
  }, [location]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 bg-gray-100">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                <p className="text-lg text-gray-700">{message}</p>
              </div>
            ) : (
              <>
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
                <p className="text-gray-700 text-lg mb-6">{message}</p>
                <p className="text-gray-500 text-sm">
                  Your payment was successful. You can now enjoy your new plan features.
                </p>
                <div className="mt-8">
                  <a href="/content-calendar" className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                    Go to Content Calendar
                  </a>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Success;
