'use client';

import React, { useEffect, useState } from 'react';
import { AmbientGlow, BackLink, ThemeToggleButton } from '../../components/shared';
import { LoginForm } from '../../components/auth/LoginForm';

export default function LoginPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-bg-skeuo text-text-main font-sans overflow-hidden">
      <AmbientGlow variant="auth" />

      {/* Top Bar: Back to Home + Theme Switcher */}
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between relative z-10">
        <BackLink
          href="/"
          className="px-3.5 py-2 rounded-xl skeuo-button text-xs font-bold text-text-muted hover:text-blue-600 dark:hover:text-blue-400 active:scale-95"
        />
        <ThemeToggleButton
          isDark={isDarkMode}
          onToggle={toggleTheme}
          className="w-9 h-9 rounded-xl skeuo-button text-text-muted hover:text-text-main transition-colors"
        />
      </header>

      {/* Main Login Card Center */}
      <main className="w-full flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md p-8 sm:p-10 skeuo rounded-3xl relative shadow-2xl border border-black/[0.06] dark:border-white/[0.08]">
          <LoginForm />
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full py-4 text-center text-[10px] text-text-muted relative z-10">
        © {new Date().getFullYear()} Perdana Printing & POS. Semua hak cipta dilindungi.
      </footer>
    </div>
  );
}
