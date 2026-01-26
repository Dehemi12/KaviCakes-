import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleClearCartAndReload = () => {
        try {
            localStorage.removeItem('kavicakes_cart');
            console.log('Cart cleared from localStorage');
        } catch (e) {
            console.error('Failed to clear cart', e);
        }
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center border border-red-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                        <p className="text-gray-500 mb-6">
                            We're sorry, an unexpected error occurred. It might be a temporary glitch or an issue with your saved data.
                        </p>

                        <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40 text-xs font-mono text-gray-700">
                            {this.state.error && this.state.error.toString()}
                            {/* {this.state.errorInfo && this.state.errorInfo.componentStack} */}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                            </button>

                            <button
                                onClick={this.handleClearCartAndReload}
                                className="w-full bg-white border border-red-200 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Clear Cart & Reload
                            </button>
                        </div>

                        <p className="mt-6 text-xs text-gray-400">
                            If this persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
