import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Something went wrong.';
      
      try {
        // Check if it's a Firestore error JSON
        const firestoreError = JSON.parse(this.state.error?.message || '');
        if (firestoreError.error) {
          errorMessage = `Firestore Error: ${firestoreError.error} (${firestoreError.operationType} on ${firestoreError.path})`;
        }
      } catch (e) {
        // Not a JSON error, use the message directly
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0] p-6">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-red-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#141414] text-white py-2 rounded hover:bg-gray-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    const { children } = this.props;
    return children;
  }
}
