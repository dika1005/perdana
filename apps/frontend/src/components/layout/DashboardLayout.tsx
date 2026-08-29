import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full bg-[#f1f5f9] dark:bg-[#0b0f19] text-text-main transition-colors">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 pb-10 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};
