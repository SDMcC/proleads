import React from 'react';
import { useAuth } from '../../App';

function LoginButton() {
  const { user } = useAuth();

  if (user) {
    return (
      <button 
        onClick={() => window.location.href = '/dashboard'}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
      >
        Go to Dashboard
      </button>
    );
  }

  return (
    <a 
      href="/"
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 inline-block"
    >
      Login
    </a>
  );
}

export default LoginButton;
