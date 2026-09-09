'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';

export interface ThemeToggleButtonProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

/** Tombol alih tema terang / gelap (deduplikasi antar halaman publik). */
export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  isDark,
  onToggle,
  className = '',
}) => (
  <button
    onClick={onToggle}
    type="button"
    title="Ganti Tema (Dark / Light)"
    className={`flex items-center justify-center text-text-muted hover:text-text-main transition-colors cursor-pointer ${className}`}
  >
    {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
  </button>
);