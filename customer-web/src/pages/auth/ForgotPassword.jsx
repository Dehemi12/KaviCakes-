import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setStatus({ type: 'success', message: 'If an account exists with this email, you will receive a password reset link shortly.' });
            setEmail('');
        } catch (err) {
            console.error('Forgot Password Error:', err);
            // Security best practice: Don't reveal if email exists or not, but for helpful UX we might handle specific errors if needed.
            // However, the backend returns 404 if not found (based on my read).
            // Ideally we should show the same success message or a generic error, but let's show the error if it's something valid like "Invalid email format".
            // Since backend returns 404 for User Not Found, showing that error reveals user existence. 
            // The backend code I saw: `return res.status(404).json({ error: 'User not found' });`
            // So I will handle 404 gracefully or show valid error.
            if (err.response && err.response.status === 404) {
                setStatus({ type: 'error', message: 'No account found with this email address.' });
            } else {
                setStatus({ type: 'error', message: 'Failed to send reset link. Please try again later.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-pink-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Forgot Password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {status.message && (
                    <div className={`p-4 rounded-md flex items-center ${status.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500'}`}>
                        <AlertCircle className={`h-5 w-5 mr-2 ${status.type === 'error' ? 'text-red-500' : 'text-green-500'}`} />
                        <p className={`text-sm ${status.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>{status.message}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors"
                                    placeholder="user@demo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${isLoading ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors shadow-md hover:shadow-lg`}
                        >
                            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                        </button>
                    </div>

                    <div className="flex items-center justify-center mt-6">
                        <Link
                            to="/login"
                            className="flex items-center text-sm font-medium text-pink-600 hover:text-pink-500"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
