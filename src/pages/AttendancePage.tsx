import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HostelerView } from '../components/HostelerView';
import { ArrowLeft, CalendarCheck } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 font-semibold">
          <CalendarCheck className="w-4 h-4" />
          <span>Daily Hosteler Portal</span>
        </div>
      </div>

      <HostelerView />
    </div>
  );
};
