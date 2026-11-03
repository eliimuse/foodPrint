import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatFriendlyDate } from '../lib/istTime';
import { Leaf, Award, CalendarCheck, Utensils, CheckCircle2, XCircle } from 'lucide-react';

export const HostelerHistory: React.FC = () => {
  const { user } = useAuth();
  const { attendanceRecords } = useData();

  // Filter records belonging to the current user
  const userRecords = attendanceRecords
    .filter((r) => r.user_id === user?.id)
    .sort((a, b) => (a.target_date > b.target_date ? -1 : 1));

  // Calculate environmental and food waste impact metrics
  const totalLogged = userRecords.length;
  const optedOutCount = userRecords.filter((r) => !r.attending).length;
  const attendedCount = userRecords.filter((r) => r.attending).length;

  // Each timely opt-out saves ~450g of cooked food from being thrown away
  const foodSavedKg = Math.round(optedOutCount * 0.45 * 10) / 10;
  // Food waste produces ~1.1 kg CO2e per kg in landfills
  const co2AvoidedKg = Math.round(foodSavedKg * 1.1 * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Impact & Meal History
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tracking your meal confirmations, dietary choices, and personal contribution to reducing hostel food waste.
        </p>
      </div>

      {/* Impact KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Food Waste Prevented</span>
            <Leaf className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {foodSavedKg}
            </span>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              kg saved
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Calculated at 450g average meal weight
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>CO₂e Avoided</span>
            <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {co2AvoidedKg}
            </span>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              kg CO₂e
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Based on municipal landfill decay index
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Advance Opt-Outs</span>
            <CalendarCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {optedOutCount}
            </span>
            <span className="text-xs font-medium text-slate-400">meals</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Responsible skips logged before 8:00 PM cutoff
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Confirmed Attended</span>
            <Utensils className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {attendedCount}
            </span>
            <span className="text-xs font-medium text-slate-400">meals</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total verified meal confirmations
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Personal Attendance Log ({userRecords.length} records)
          </h2>
          <span className="text-xs text-slate-400">
            Sorted by most recent
          </span>
        </div>

        {userRecords.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No attendance records logged yet. Your choices for tomorrow will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Meal Date</th>
                  <th className="px-6 py-3 font-semibold">Meal Session</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Chosen Staple</th>
                  <th className="px-6 py-3 font-semibold">Chosen Side</th>
                  <th className="px-6 py-3 font-semibold">Submission Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {userRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {formatFriendlyDate(rec.target_date)}
                    </td>
                    <td className="px-6 py-3.5 capitalize font-medium whitespace-nowrap">
                      {rec.meal_type}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {rec.attending ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Attending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Skipped
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">
                      {rec.attending ? rec.staple_name || '—' : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">
                      {rec.attending ? rec.side_name || '—' : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(rec.submitted_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
