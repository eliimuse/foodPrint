import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ManagerDashboard } from '../components/ManagerDashboard';
import { ArrowLeft, LayoutDashboard, Utensils, ClipboardCheck, BarChart3 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/menu"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Utensils className="w-3.5 h-3.5 text-orange-600" />
            <span>Manage Weekly Menu</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 font-semibold pl-2">
            <LayoutDashboard className="w-4 h-4" />
            <span>Mess Supervisor Console</span>
          </div>
        </div>
      </div>

      <ManagerDashboard />
    </div>
  );
};
