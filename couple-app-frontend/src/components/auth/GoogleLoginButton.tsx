const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <title>Google Icon</title>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.94C34.311 4.994 28.683 2 24 2C11.822 2 2 11.822 2 24s9.822 22 22 22s22-9.822 22-22c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691c-1.346 2.544-2.106 5.49-2.106 8.651c0 3.161.76 6.107 2.106 8.651l-5.34-4.138C.953 25.522 0 21.251 0 24c0-3.251.953-7.522 2.966-10.449l5.34 4.138z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238c-2.008 1.521-4.504 2.43-7.219 2.43c-5.216 0-9.72-3.331-11.311-7.942l-6.379 4.879C9.602 39.044 16.258 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.16-4.087 5.571l6.19 5.238C42.012 35.193 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);
import axios from 'axios';
import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';

interface GoogleLoginButtonProps {
  text?: string;
  onClick?: () => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ text = "Sign in with Google", onClick }) => {
  // Define the base URL of your backend.
  // This ensures that API calls are directed to the correct server.
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const handleGoogleLogin =useGoogleLogin({
    // This is the function that will be called on successful login
    onSuccess: async (codeResponse) => {
      console.log('Received auth code:', codeResponse.code);

      // Now, send this authorization code to your backend API
      try {
        // Use the full backend URL for the API request
        const response = await axios.post(`${BACKEND_URL}/api/auth/google/login`, {
          code: codeResponse.code,
        });

        const { access_token } = response.data;
        
        // TODO: Store the access token (e.g., in localStorage) and redirect the user
        console.log('Backend login successful. Access Token:', access_token);
        // window.location.href = '/dashboard';

      } catch (error) {
        console.error('Backend login failed:', error);
      }
    },
    // This specifies that you want to get an authorization code
    flow: 'auth-code',
    onError: (error) => {
      console.error('Google Login Failed:', error);
    }
  });
  return (
    <button
      onClick={handleGoogleLogin}
      type="button"
      className="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <GoogleIcon />
      <span className="ml-3">{text}</span>
    </button>
  );
};
