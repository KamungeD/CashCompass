import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// Placeholder components (will be created in later phases)
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200">
        {/* Header */}
        <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">$</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  CashCompass
                </h1>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                v1.0.0 - Duncan Kamunge
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Welcome to CashCompass
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Your personal finance management application is being built. 
                This is the foundation setup for Phase 1.4.
              </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-card border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-success-600 dark:text-success-400 text-xl">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Backend Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Server configuration and database connection ready
                </p>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-card border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-success-600 dark:text-success-400 text-xl">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Frontend Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  React + Vite + Tailwind CSS configured and running
                </p>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-card border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-warning-600 dark:text-warning-400 text-xl">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Development Ready
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Foundation complete, ready for feature development
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-2">
                Next Development Phase
              </h3>
              <p className="text-primary-700 dark:text-primary-300 text-sm">
                Phase 2: Backend Development - Authentication, Database Models, and API Endpoints
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>© 2025 CashCompass. Built by Duncan Kamunge (@KamungeD)</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
