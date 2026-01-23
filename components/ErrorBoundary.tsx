import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen flex flex-col items-center justify-center bg-paper p-6 text-center text-ink font-mono">
                    <ShieldAlert className="w-16 h-16 text-brand-500 mb-4 animate-pulse" />
                    <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
                    <p className="text-sm opacity-60 mb-6 max-w-md">
                        The kitchen caught fire. Don't worry, we can reset.
                    </p>
                    <div className="bg-red-50 p-4 rounded text-left w-full max-w-md mb-6 border border-red-200 overflow-auto max-h-40">
                        <code className="text-xs text-red-800">
                            {this.state.error?.message}
                        </code>
                    </div>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onClick={() => window.location.reload()}
                            onTouchEnd={() => window.location.reload()}
                            className="w-full flex items-center justify-center gap-2 bg-ink text-paper px-6 py-3 rounded-lg font-bold shadow-lg active:scale-95 transition-all"
                        >
                            <RefreshCw size={16} />
                            Reload Kitchen
                        </button>

                        <button
                            onClick={() => {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.reload();
                            }}
                            onTouchEnd={() => {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.reload();
                            }}
                            className="w-full text-xs font-mono text-gray-500 hover:text-red-600 underline py-2 uppercase tracking-widest"
                        >
                            Factory Reset (Clear Data)
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
