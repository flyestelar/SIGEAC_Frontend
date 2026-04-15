'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, Plane, RefreshCw } from 'lucide-react';
import React from 'react';
import { FallbackProps, ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
}

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4 relative overflow-hidden">
    {/* Animated background elements */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-sky-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-orange-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-2/3 left-1/2 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
    </div>

    {/* Subtle geometric pattern */}
    <div className="absolute inset-0 opacity-5">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern id="aviation-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0 L24 16 L20 20 L16 16 Z" fill="currentColor" />
            <circle cx="20" cy="20" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#aviation-pattern)" />
      </svg>
    </div>

    <div className="relative z-10 max-w-md w-full text-center space-y-6">
      {/* Animated airplane icon */}
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full opacity-20 animate-ping"></div>
        <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full shadow-lg">
          <Plane className="w-12 h-12 text-white transform rotate-45" />
        </div>
      </div>

      {/* Error message */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Flight Path Error</h1>
        <p className="text-slate-300 text-lg">Something unexpected happened during takeoff.</p>
        <p className="text-slate-400 text-sm">Our maintenance team has been notified.</p>
      </div>

      {/* Error details (collapsible) */}
      <details className="text-left bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <summary className="text-slate-300 cursor-pointer hover:text-white transition-colors">
          Technical Details
        </summary>
        <pre className="text-xs text-slate-400 mt-2 overflow-auto max-h-32 font-mono">{(error as any).message}</pre>
      </details>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={resetErrorBoundary}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Flight
        </Button>
        <Button
          onClick={() => (window.location.href = '/')}
          className="bg-slate-600 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white px-6 py-2 rounded-lg transition-all duration-200"
        >
          Return to Base
        </Button>
      </div>

      {/* Additional help */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>If the problem persists, contact your operations team.</p>
        <p className="font-mono">Error ID: {Date.now().toString(36)}</p>
      </div>
    </div>

    {/* Floating alert icon */}
    <div className="absolute top-8 right-8 opacity-50">
      <AlertTriangle className="w-8 h-8 text-amber-400 animate-bounce" />
    </div>
  </div>
);

const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  const FallbackComponent = fallback || ErrorFallback;

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={(error, errorInfo) => {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
