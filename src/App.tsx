import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { CutoffSimulatorBanner } from './components/CutoffSimulatorBanner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { WelcomePage } from './pages/WelcomePage';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { MenuPage } from './pages/MenuPage';
import { AttendancePage } from './pages/AttendancePage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminMenuPage } from './pages/AdminMenuPage';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-orange-600 selection:text-white">
      {/* Cutoff Simulation & Live IST Banner */}
      <CutoffSimulatorBanner />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Routes>
          {/* Welcome explainer page */}
          <Route path="/" element={<WelcomePage />} />

          {/* Home page (accessible without login) */}
          <Route path="/home" element={<HomePage />} />

          {/* Authentication page */}
          <Route path="/auth" element={<AuthPage />} />

          {/* 7-day cyclical weekly menu view */}
          <Route path="/menu" element={<MenuPage />} />

          {/* Protected hosteler attendance marking */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['hosteler', 'mess_manager']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          {/* Protected hosteler waste impact & history */}
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={['hosteler', 'mess_manager']}>
                <HistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Protected manager dashboard & ML prep forecast */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['mess_manager']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected manager menu editor */}
          <Route
            path="/admin/menu"
            element={
              <ProtectedRoute allowedRoles={['mess_manager']}>
                <AdminMenuPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback to /home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">FoodPrint</span>
            <span>·</span>
            <span>Zero Food Waste Hostel Mess Management System</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Cutoff Rule: Locked at 8:00 PM IST (Asia/Kolkata) on Day D-1
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
