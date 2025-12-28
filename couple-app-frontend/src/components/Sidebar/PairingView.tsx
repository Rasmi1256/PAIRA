import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { isAxiosError } from 'axios';
import { api } from '../../lib/api';
import { FaHeart, FaCopy, FaCheck } from 'react-icons/fa';

const PairingView: React.FC = () => {
    const { updateUser } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState<'generate' | 'enter'>('generate');
    const [code, setCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerateCode = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/pairing/initiate');
            setGeneratedCode(response.data.secretCode);
            setExpiresAt(response.data.expiresAt);
            setSuccess('Code generated successfully! Share it with your partner.');
        } catch (error) {
            let errorMessage = 'Failed to generate pairing code. Please try again.';
            if (isAxiosError(error) && error.response) {
                errorMessage = error.response.data.detail || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCompletePairing = async () => {
        if (!code.trim()) {
            setError('Please enter a pairing code');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/pairing/complete', {
                secretCode: code.trim().toUpperCase()
            });

            setSuccess(response.data.message);

            if (updateUser) {
                const userResponse = await api.get('/users/me');
                updateUser(userResponse.data);
            }

            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (error) {
            let errorMessage = 'Failed to complete pairing. Please check the code and try again.';
            if (isAxiosError(error) && error.response) {
                errorMessage = error.response.data.detail || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/30">
            {/* Mode Toggle */}
            <div className="bg-black/10 rounded-2xl p-1 mb-8 max-w-sm mx-auto">
                <div className="flex">
                    <button
                        onClick={() => setMode('generate')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                            mode === 'generate'
                                ? 'bg-white text-purple-600 shadow-lg'
                                : 'text-gray-700 hover:bg-white/50'
                        }`}
                    >
                        Generate Code
                    </button>
                    <button
                        onClick={() => setMode('enter')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                            mode === 'enter'
                                ? 'bg-white text-purple-600 shadow-lg'
                                : 'text-gray-700 hover:bg-white/50'
                        }`}
                    >
                        Enter Code
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-md mx-auto">
                {mode === 'generate' ? (
                    <div className="text-center">
                        <FaHeart className="h-16 w-16 text-pink-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Generate Pairing Code</h2>
                        <p className="text-gray-600 mb-6">
                            Create a secret code to share with your partner. The code expires in 15 minutes.
                        </p>

                        {!generatedCode ? (
                            <button
                                onClick={handleGenerateCode}
                                disabled={loading}
                                className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Generating...' : 'Generate Code'}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-gray-100 rounded-lg p-4">
                                    <p className="text-gray-600 text-sm mb-2">Your pairing code:</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-mono font-bold text-purple-600">
                                            {generatedCode}
                                        </span>
                                        <button
                                            onClick={copyToClipboard}
                                            className="text-purple-600 hover:text-purple-800 transition-colors"
                                        >
                                            {copied ? <FaCheck className="h-5 w-5" /> : <FaCopy className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <p className="text-gray-500 text-xs mt-2">
                                        Expires: {new Date(expiresAt).toLocaleString()}
                                    </p>
                                </div>
                                <p className="text-gray-700 text-sm">
                                    Share this code with your partner so they can enter it to connect with you.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <FaHeart className="h-16 w-16 text-pink-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Pairing Code</h2>
                        <p className="text-gray-600 mb-6">
                            Enter the code your partner shared with you to connect your accounts.
                        </p>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Enter 6-character code"
                                className="w-full bg-white text-center text-2xl font-mono font-bold text-purple-600 py-4 px-6 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                                maxLength={6}
                            />
                            <button
                                onClick={handleCompletePairing}
                                disabled={loading || code.length !== 6}
                                className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Connecting...' : 'Connect with Partner'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Messages */}
                {error && (
                    <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                        {success}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PairingView;