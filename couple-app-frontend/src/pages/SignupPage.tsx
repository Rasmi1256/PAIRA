import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FloatingIcons from '../components/auth/FloatingIcons';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { FaEnvelope, FaLock, FaUserFriends } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { useAuth } from '../context/useAuth';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [full_name, setFull_name] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(email, password, full_name || undefined);
      toast.success('Registration successful! Redirecting...');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-pink-700 flex items-center justify-center p-4 overflow-hidden relative">
      <FloatingIcons />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        className="w-full max-w-md flex flex-col items-center z-10"
      >
        {/* Header */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: -50 },
            visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
          }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-blue-100">Join our community of love-birds</p>
        </motion.div>

        {/* Signup Card */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.9 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
          }}
          className="bg-white rounded-xl shadow-2xl p-8 w-full"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Full Name Input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaUserFriends className="text-gray-400" />
                </span>
                <input
                  id="full_name"
                  type="text"
                  placeholder="Your Full Name (optional)"
                  value={full_name}
                  onChange={(e) => setFull_name(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Email Input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaEnvelope className="text-gray-400" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>



              {/* Password Input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaLock className="text-gray-400" />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-pink-600 text-white font-bold py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 mt-6 disabled:bg-pink-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">Or continue with</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Social Signup Buttons */}
          <div className="flex flex-col space-y-3">
            <GoogleLoginButton
              text="Sign up with Google"
              onClick={() => console.log('Redirecting to Google signup...')}
            />
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Log In
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignupPage;