'use client';

import { Component, ReactNode } from 'react';
import { toast } from 'react-toastify';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    toast.error(`Application Error: ${error.message}`, {
      autoClose: 10000,
      toastId: 'error-boundary',
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900">
          <div className="glass rounded-2xl p-8 max-w-md mx-4 border border-red-500/30 shadow-neon-pink">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
              <p className="text-gray-400 mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-500/10 rounded-lg text-left">
                  <p className="text-xs text-red-400 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-lg transition-all duration-300 font-bold"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
