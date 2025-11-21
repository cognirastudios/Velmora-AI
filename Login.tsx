

import React from 'react';
import { GoogleIcon, MicrosoftIcon, GitHubIcon, VelmoraIcon } from '../Icons';

interface LoginProps {
  onLoginSuccess: () => void;
}

const SocialButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[var(--border-primary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--text-muted)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background-secondary)] focus:ring-white"
    >
        {icon}
        {label}
    </button>
);


const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  return (
    <div className="min-h-screen bg-[var(--background-primary)] flex items-center justify-center p-4 text-[var(--text-primary)]">
      <div className="w-full max-w-md bg-[var(--background-secondary)] rounded-2xl shadow-2xl p-8 border border-[var(--border-primary)]">
        <div className="flex flex-col items-center text-center mb-8">
            <div className="p-3 mb-4 rounded-lg bg-white">
              <VelmoraIcon className="h-12 w-12" />
            </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Welcome to Velmora AI</h1>
          <p className="text-[var(--text-secondary)] mt-2">Sign in to access your intelligent AI suite.</p>
        </div>

        <div className="space-y-4">
            <SocialButton
                icon={<GoogleIcon className="w-6 h-6" />}
                label="Continue with Google"
                onClick={onLoginSuccess}
            />
            <SocialButton
                icon={<MicrosoftIcon className="w-6 h-6" />}
                label="Continue with Microsoft"
                onClick={onLoginSuccess}
            />
            <SocialButton
                icon={<GitHubIcon className="w-6 h-6" />}
                label="Continue with GitHub"
                onClick={onLoginSuccess}
            />
        </div>

        <div className="text-center mt-8">
            <p className="text-xs text-[var(--text-muted)]">
                By continuing, you agree to the Velmora AI <a href="https://sites.google.com/view/velmora-privacy/%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A9-%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--text-primary)]">Privacy Policy</a>.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;