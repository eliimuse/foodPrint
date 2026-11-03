import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ProtectedAction } from '../components/auth/ProtectedAction';
import { formatFriendlyDate, getDayOfWeek, getTodayIST } from '../lib/istTime';
import { MealType } from '../types';
import {
  Utensils,
  CalendarCheck,
  History,
  LayoutDashboard,
  Coffee,
  Sun,
  Moon,
  ArrowRight,
  ShieldAlert,
  LogIn,
  Database,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, profile, role, isAuthenticated, signOut } = useAuth();
  const { menuItems, isLoading, refreshData, supabaseHealth } = useData();
  const navigate = useNavigate();
  const today = getTodayIST();
  const todayDay = getDayOfWeek(today);

  const displayName = profile?.full_name || (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'User';
  const displayRoom = profile?.room_number || profile?.room_no || (user?.user_metadata?.room_no as string) || (role === 'mess_manager' ? 'Mess Office' : 'Room Allocated');

  // Derive today's meals directly from Supabase menu_items
  const mealSessions: { type: MealType; session: string; timing: string; icon: React.ReactNode }[] = [
    {
      type: 'breakfast',
      session: 'Breakfast',
      timing: '7:30 AM – 9:30 AM',
      icon: <Coffee className="w-4 h-4 text-amber-500" />,
    },
    {
      type: 'lunch',
      session: 'Lunch',
      timing: '12:30 PM – 2:30 PM',
      icon: <Sun className="w-4 h-4 text-emerald-500" />,
    },
    {
      type: 'snacks',
      session: 'Snacks & Tea',
      timing: '5:00 PM – 6:30 PM',
      icon: <Utensils className="w-4 h-4 text-blue-500" />,
    },
    {
      type: 'dinner',
      session: 'Dinner',
      timing: '7:45 PM – 9:45 PM',
      icon: <Moon className="w-4 h-4 text-indigo-500" />,
    },
  ];

  const todayMeals = mealSessions.map((m) => {
    // Find items for this meal type matching today's menu_date or today's day of week
    const items = menuItems.filter(
      (item) => item.meal_type === m.type && (item.menu_date === today || item.day_of_week === todayDay)
    );
    const staples = items.filter((i) => i.category === 'staple').map((i) => i.dish_name);
    const sides = items.filter((i) => i.category === 'side').map((i) => i.dish_name);

    return {
      type: m.type,
      session: m.session,
      timing: m.timing,
      icon: m.icon,
      itemsCount: items.length,
      staple: staples.length > 0 ? staples.join(' / ') : 'None scheduled',
      side: sides.length > 0 ? sides.join(' & ') : 'None scheduled',
    };
  });

  const totalDishesToday = todayMeals.reduce((acc, curr) => acc + curr.itemsCount, 0);

  const featureTiles = [
    {
      title: "Mark Tomorrow's Attendance",
      desc: 'Lock in your meal confirmation and pick 1 staple + 1 side before 8:00 PM IST.',
      to: '/attendance',
      badge: 'Daily Action',
      icon: <CalendarCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      allowedRoles: ['hosteler', 'mess_manager'] as any,
    },
    {
      title: 'View Weekly Menu',
      desc: 'Browse the 7-day cyclical breakfast, lunch, snacks, and dinner meal plan.',
      to: '/menu',
      badge: 'Public & Students',
      icon: <Utensils className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      allowedRoles: undefined,
    },
    {
      title: 'My History & Impact',
      desc: 'Track past meal confirmations and see how many kilograms of food waste you prevented.',
      to: '/history',
      badge: 'Personal Stats',
      icon: <History className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      allowedRoles: ['hosteler', 'mess_manager'] as any,
    },
    {
      title: 'Kitchen Dashboard',
      desc: 'Review confirmed counts, ML turnout predictions, and raw kitchen prep quantities.',
      to: '/dashboard',
      badge: 'Manager Only',
      icon: <LayoutDashboard className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      allowedRoles: ['mess_manager'] as any,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Session State Banner */}
      {!isAuthenticated ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Guest Mode:</strong> You are browsing without being logged in. Clicking any feature below will prompt you to sign in.
            </span>
          </div>
          <button
            onClick={() => navigate('/auth', { state: { from: '/home' } })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
              {role === 'mess_manager' ? 'M' : 'H'}
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Welcome back, {displayName}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Logged in as <strong className="capitalize">{role || 'hosteler'}</strong> · {displayRoom}
              </span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="px-3 py-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Feature Tiles Grid (All wrapped in ProtectedAction) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Core Operations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an action to plan meals, audit food impact, or access the supervisor console.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureTiles.map((tile) => (
            <ProtectedAction
              key={tile.to}
              to={tile.to}
              allowedRoles={tile.allowedRoles}
              className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500/60 dark:hover:border-orange-500/60 rounded-2xl shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60 flex items-center justify-center transition-colors group-hover:bg-orange-600 group-hover:text-white">
                    {tile.icon}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    tile.badge === 'Manager Only'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {tile.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {tile.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {tile.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
                <span>Access Feature</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </ProtectedAction>
          ))}
        </div>
      </div>

      {/* Today's Menu Preview (Fetched directly from Supabase project) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              <Utensils className="w-3.5 h-3.5" />
              <span>Mess Daily Board</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                <Database className="w-2.5 h-2.5" />
                <span>Supabase Live</span>
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Today's Menu Preview · {todayDay}, {formatFriendlyDate(today)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors cursor-pointer"
              title="Re-fetch latest menu items from Supabase database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
              <span>Refresh Menu</span>
            </button>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
            >
              <span>Weekly Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {totalDishesToday === 0 ? (
          <div className="my-6 p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
            <Utensils className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Dishes Scheduled for Today in Supabase
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              Dishes are fetched in real-time from your Supabase <code className="font-mono text-orange-600">menu_items</code> table. You can browse the 7-day cyclical calendar or add items in the Menu Editor.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                to="/menu"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors"
              >
                View 7-Day Menu
              </Link>
              {role === 'mess_manager' && (
                <Link
                  to="/admin/menu"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition-colors"
                >
                  Manage Dishes in Menu Editor
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {todayMeals.map((m) => (
              <div
                key={m.session}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {m.icon}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {m.session}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mb-2">
                    {m.timing}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Staple Choice
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 leading-snug block">
                        {m.staple}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Side & Gravy
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 leading-snug block">
                        {m.side}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
                  <span>{m.itemsCount} dishes available</span>
                  <span>100% Fresh</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
