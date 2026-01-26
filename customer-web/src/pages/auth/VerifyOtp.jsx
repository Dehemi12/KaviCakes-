import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react';

const VerifyOtp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Email Missing</h2>
                    <p className="text-gray-600 mb-4">Please register first.</p>
                    <button onClick={() => navigate('/register')} className="text-pink-600 font-bold hover:underline">Go to Register</button>
                </div>
            </div>
        );
    }

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            await api.post('/auth/verify-otp', { email, otp });
            setMessage('Email verified successfully! Redirecting to login...');
            setTimeout(() => {
                // Determine redirect path (e.g. back to checkout if that was the original intent)
                // But for security, usually login fresh.
                // If we want to support the "from" checkout flow:
                // We need to have passed 'from' state from Register -> VerifyOtp -> Login
                // Let's assume Register passed it.
                navigate('/login', {
                    state: {
                        email,
                        message: 'Email verified! Please login.',
                        from: location.state?.from
                    }
                });
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed. Invalid or expired OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setMessage('');
        try {
            await api.post('/auth/resend-otp', { email });
            setMessage('New OTP sent to your email.');
        } catch (err) {
            setError('Failed to resend OTP.');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-pink-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
                <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="h-8 w-8 text-pink-600" />
                </div>

                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Verify Your Email</h2>
                <p className="text-sm text-gray-600 mb-8">
                    We sent a 6-digit code to <span className="font-bold">{email}</span>
                </p>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">
                        {message}
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            maxLength="6"
                            className="block w-full text-center text-3xl tracking-widest font-bold border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 p-4"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white ${isLoading ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'
                            } transition-colors`}
                    >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div className="mt-6 text-sm">
                    <p className="text-gray-500">
                        Didn't receive the code?{' '}
                        <button
                            onClick={handleResend}
                            className="font-bold text-pink-600 hover:text-pink-500 hover:underline"
                        >
                            Resend Code
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
