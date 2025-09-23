import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error info in state for display
    this.setState({
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // Store error in Chrome storage for later analysis
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href
    };

    chrome.storage.local.get('errorLogs', (data) => {
      const logs = data.errorLogs || [];
      logs.push(errorLog);
      
      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.shift();
      }
      
      chrome.storage.local.set({ errorLogs: logs });
    });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Check if a custom fallback component is provided
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error} 
            resetError={this.resetError}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback p-6 max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg 
                  className="h-6 w-6 text-red-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Something went wrong
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-mono text-xs">
                    {this.state.error.message}
                  </p>
                </div>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                      Show error details
                    </summary>
                    <pre className="mt-2 text-xs bg-white p-2 rounded border border-red-200 overflow-auto max-h-64">
                      <code>{this.state.error.stack}</code>
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-xs bg-white p-2 rounded border border-red-200 overflow-auto max-h-64">
                        <code>{this.state.errorInfo.componentStack}</code>
                      </pre>
                    )}
                  </details>
                )}
                
                <button
                  onClick={this.resetError}
                  className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom fallback component example
export const CustomErrorFallback: React.FC<{ 
  error: Error; 
  resetError: () => void 
}> = ({ error, resetError }) => {
  return (
    <div className="custom-error-fallback p-4 bg-layer-01 rounded-lg">
      <h2 className="text-lg font-bold text-text-primary mb-2">
        Oops! An error occurred
      </h2>
      <p className="text-text-secondary mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button 
        onClick={resetError}
        className="px-4 py-2 bg-interactive text-white rounded hover:bg-interactive-hover"
      >
        Reset and try again
      </button>
    </div>
  );
};

// HOC for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

// Usage example:
/*
 // In your App.tsx or main component:
 import { ErrorBoundary, CustomErrorFallback } from './components/ErrorBoundary';

 function App() {
   return (
     <ErrorBoundary 
       fallback={CustomErrorFallback}
       onError={(error, info) => {
         // Optional: Send to external logging service
         console.error('App error:', error, info);
       }}
     >
       <YourAppContent />
     </ErrorBoundary>
   );
 }

 // Or use the HOC:
 const SafeComponent = withErrorBoundary(YourComponent, CustomErrorFallback);
 */