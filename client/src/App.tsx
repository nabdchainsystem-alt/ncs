import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedApp from './ProtectedApp';
import { AuthProvider } from './context/AuthContext';
import AuthGate from './components/auth/AuthGate';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

function ProtectedRoutes() {
  return (
    <AuthGate>
      <ProtectedApp />
    </AuthGate>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" toastOptions={{ className: 'z-[9999]' }} />
    </AuthProvider>
  );
}
