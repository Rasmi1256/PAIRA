import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {  useAuth } from './context/useAuth';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage'; // Import the actual LoginPage
import SignupPage from './pages/SignupPage'; // Import the actual SignupPage
import DashboardPage from './pages/DashboardPage'; // Import the actual DashboardPage
import ChatPage from './pages/ChatPage'; // Import the actual ChatPage
import PairingPage from './pages/PairingPage'; // Import the actual PairingPage

// A wrapper for routes that should only be accessible to authenticated users.
const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/messages" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/pairing" element={<PrivateRoute><PairingPage /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;