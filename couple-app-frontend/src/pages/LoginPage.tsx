import React from 'react';
import { motion } from 'framer-motion';
import { EmailLoginForm } from '../components/auth/EmailLoginForm';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { PasskeyLoginButton } from '../components/auth/PasskeyLoginButton';
import FloatingIcons from '../components/auth/FloatingIcons';

const LoginPage: React.FC = () => {
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
        className="w-full max-w-md flex flex-col items-center"
      >
        {/* Header */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: -50 },
            visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
          }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-blue-100">Sign in to your account</p>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.9 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
          }}
          className="bg-white rounded-xl shadow-2xl p-8 w-full"
        >
          {/* Email Login Form */}
          <div className="mb-6">
            <EmailLoginForm />
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">Or continue with</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex flex-col space-y-3">
            <GoogleLoginButton />
            <PasskeyLoginButton />
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign up
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;