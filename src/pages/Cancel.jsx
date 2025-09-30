import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Cancel = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 bg-gray-100">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
            <p className="text-gray-700 text-lg mb-6">
              Your payment was cancelled. You can try again or contact support if you have any issues.
            </p>
            <div className="mt-8">
              <a href="/content-calendar" className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold">
                Back to Content Calendar
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Cancel;
