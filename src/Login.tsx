// Login.tsx
import React, { useState } from 'react';
import { PiPaperPlaneTiltFill } from "react-icons/pi";

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true');
      onLoginSuccess();
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center mb-8">
          <img
            src="https://media.licdn.com/dms/image/v2/D560BAQGd9CNgsgxDGg/company-logo_200_200/company-logo_200_200/0/1727775506558/dataplatrinc_logo?e=1738800000&v=beta&t=M0FwxfZoe-YsswSG5cL9rbwznIxxm2Jbmf6_UFUdlXM"
            alt="Data Platr Logo"
            className="w-12 h-12 mr-3"
          />
          <h2 className="text-3xl font-bold text-gray-800">Data Platr</h2>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <span>Login</span>
            <PiPaperPlaneTiltFill className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;