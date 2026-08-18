import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-bg-skeuo text-text-main">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 pl-8 h-screen overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-10 pr-6 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};
