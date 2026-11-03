import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft, LogOut, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredRole?: UserRole; // backwards compatibility
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredRole,
}) => {
  const { user, role, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Normalize allowed roles
  const effectiveAllowedRoles = allowedRoles || (requiredRole ? [requiredRole] : undefined);

  // 1. Show loading state while session is being verified from local storage / Supabase
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
          Verifying session...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated check -> redirect to /auth with intended destination in router state
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // 3. Role authorization check
  const isAuthorized = !effectiveAllowedRoles || (role && effectiveAllowedRoles.includes(role));

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/40">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/60 inline-block mb-2">
          403 Forbidden
        </span>

        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Access Denied
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          You do not have permission to access this page. This portal is restricted to authorized personnel.
        </p>

        <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Current Role:</span>
            <span className="font-mono font-semibold uppercase px-2 py-0.5 rounded text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              {role || 'None'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Required Role(s):</span>
            <span className="font-mono font-semibold uppercase px-2 py-0.5 rounded text-[11px] bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300">
              {effectiveAllowedRoles?.join(', ')}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
          <button
            onClick={async () => {
              await signOut();
              navigate('/auth', { state: { from: location.pathname } });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
