import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Leaf, Moon, Sun, LogIn, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, role, isAuthenticated, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode, activeOption } = useTheme();
  const location = useLocation();

  const isManager = role === 'mess_manager';
  const displayName = profile?.full_name || (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'User';

  // Navigation items based on role
  const navItems = [
    { to: '/home', label: 'Home' },
    { to: '/menu', label: 'Weekly Menu' },
    { to: '/attendance', label: "Tomorrow's Attendance" },
    { to: '/history', label: 'My Impact' },
    ...(isManager ? [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/admin/menu', label: 'Menu Editor' },
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* Brand Wordmark */}
        <Link to="/home" className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group">
          <div
            className="w-8 h-8 rounded-lg text-white flex items-center justify-center shadow-xs transition-colors group-hover:opacity-90"
            style={{ backgroundColor: activeOption.primaryHex }}
          >
            <Leaf className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                FoodPrint
              </span>
              <span
                className="hidden lg:inline text-[10px] font-semibold px-2 py-0.5 rounded transition-colors uppercase tracking-wider"
                style={{
                  backgroundColor: activeOption.primaryHex + '18',
                  color: activeOption.primaryHex,
                }}
              >
                Zero Waste Mess
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions Zone */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User Status / Login / Logout */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                  style={{ backgroundColor: activeOption.primaryHex }}
                >
                  {isManager ? 'M' : 'H'}
                </div>
                <span className="font-medium max-w-[120px] truncate">{displayName.split(' ')[0]}</span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase"
                  style={{
                    backgroundColor: activeOption.primaryHex + '18',
                    color: activeOption.primaryHex,
                  }}
                >
                  {role || 'hosteler'}
                </span>
              </div>
              <button
                onClick={signOut}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                title="Sign out of current account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              state={{ from: location.pathname }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 overflow-x-auto text-xs font-medium text-slate-600 dark:text-slate-300">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-2.5 py-1 rounded-md whitespace-nowrap ${
                isActive
                  ? 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
};
