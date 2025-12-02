import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 max-w-lg w-full">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Something went wrong</h2>
                        <p className="text-gray-500 text-center mb-6 text-sm">
                            The application encountered an unexpected error.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6 overflow-auto max-h-48 border border-gray-200">
                            <p className="text-red-600 font-mono text-xs break-words">
                                {this.state.error?.toString()}
                            </p>
                            {this.state.errorInfo && (
                                <details className="mt-2">
                                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Stack Trace</summary>
                                    <pre className="text-[10px] text-gray-500 mt-2 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                            >
                                <RefreshCw size={16} />
                                <span>Reload Application</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
