import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatFriendlyDate, getTodayIST } from '../lib/istTime';
import { MealType } from '../types';
import { Scale, Save, CheckCircle2, History, AlertTriangle, TrendingDown } from 'lucide-react';

export const ManagerConsumptionLogger: React.FC = () => {
  const { consumptionLogs, attendanceRecords, logConsumption } = useData();

  const today = getTodayIST();
  const [logDate, setLogDate] = useState<string>(today);
  const [mealType, setMealType] = useState<MealType>('lunch');

  // Pull confirmed count for this date and meal
  const matchingAttendance = attendanceRecords.filter(
    (r) => r.target_date === logDate && r.meal_type === mealType && r.attending
  );
  const confirmedCount = matchingAttendance.length || 240;
  const predictedTurnout = Math.round(confirmedCount * 0.9);

  const [actualTurnout, setActualTurnout] = useState<number>(predictedTurnout);
  const [leftoverWasteKg, setLeftoverWasteKg] = useState<number>(3.5);
  const [notes, setNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Compute variance & cost loss
  const variance = actualTurnout - predictedTurnout;
  const accuracyPercent = Math.max(0, 100 - Math.round((Math.abs(variance) / (actualTurnout || 1)) * 100));
  const estimatedCostLossInr = Math.round(leftoverWasteKg * 95); // ~ ₹95 / kg cooked meal preparation cost

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    await logConsumption({
      log_date: logDate,
      meal_type: mealType,
      confirmed_count: confirmedCount,
      predicted_turnout: predictedTurnout,
      actual_turnout: Number(actualTurnout),
      plates_served: Number(actualTurnout),
      leftover_waste_kg: Number(leftoverWasteKg),
      cost_loss_inr: estimatedCostLossInr,
      notes: notes.trim() || undefined,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const mealOptions: { type: MealType; label: string }[] = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'snacks', label: 'Snacks' },
    { type: 'dinner', label: 'Dinner' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Post-Meal Consumption & Food Waste Logger
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Record actual plates served and audit post-meal leftovers to train and calibrate the ML turnout prediction model.
        </p>
      </div>

      {/* Entry Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
            <Scale className="w-4 h-4 text-orange-600" />
            <span>Log Meal Audit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Date */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Meal Date
              </label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            {/* Meal Session */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Meal Session
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white capitalize"
              >
                {mealOptions.map((m) => (
                  <option key={m.type} value={m.type}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Confirmed & Predicted Info */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block">Forecast Reference</span>
              <div className="mt-1 flex items-baseline justify-between text-xs">
                <span>Confirmed: <strong className="font-mono">{confirmedCount}</strong></span>
                <span className="text-orange-600 dark:text-orange-400">ML: <strong className="font-mono">{predictedTurnout}</strong></span>
              </div>
            </div>

            {/* Actual Turnout */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Actual Plates Served
              </label>
              <input
                type="number"
                min="0"
                max="2000"
                required
                value={actualTurnout}
                onChange={(e) => setActualTurnout(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {/* Leftover Waste in Kg */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Leftover Waste Weighed (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="500"
                required
                value={leftoverWasteKg}
                onChange={(e) => setLeftoverWasteKg(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Total weighed from serving vessel leftovers
              </span>
            </div>

            {/* Variance & Accuracy Stat Box */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">ML Prediction Accuracy</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400 font-mono tabular-nums">
                  {accuracyPercent}%
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Variance: {variance > 0 ? `+${variance}` : variance} eaters
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Estimated Cost Loss</span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                  ₹{estimatedCostLossInr}
                </span>
                <span className="text-[11px] text-slate-400 block">@ ₹95/kg</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Observations & Notes
              </label>
              <input
                type="text"
                placeholder="e.g., Heavy rain, university holiday"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {saveSuccess ? (
              <span className="text-xs font-semibold text-orange-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Consumption log committed to database!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Data instantly feeds into ML training weights and historical reports.
              </span>
            )}

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Consumption Log</span>
            </button>
          </div>
        </form>
      </div>

      {/* Historical Consumption Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-orange-600" />
            <span>Audit Trail & Historical Consumption Logs ({consumptionLogs.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Latest 14 days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Log Date</th>
                <th className="px-6 py-3 font-semibold">Meal Session</th>
                <th className="px-6 py-3 font-semibold">Confirmed</th>
                <th className="px-6 py-3 font-semibold">ML Predicted</th>
                <th className="px-6 py-3 font-semibold">Actual Served</th>
                <th className="px-6 py-3 font-semibold">Leftover Waste</th>
                <th className="px-6 py-3 font-semibold">Cost Loss</th>
                <th className="px-6 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {consumptionLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {formatFriendlyDate(log.log_date)}
                  </td>
                  <td className="px-6 py-3.5 capitalize font-medium whitespace-nowrap">
                    {log.meal_type}
                  </td>
                  <td className="px-6 py-3.5 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {log.confirmed_count}
                  </td>
                  <td className="px-6 py-3.5 font-mono tabular-nums text-orange-600 dark:text-orange-400 font-semibold">
                    {log.predicted_turnout}
                  </td>
                  <td className="px-6 py-3.5 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {log.actual_turnout}
                  </td>
                  <td className="px-6 py-3.5 font-mono tabular-nums text-rose-600 dark:text-rose-400">
                    {log.leftover_waste_kg} kg
                  </td>
                  <td className="px-6 py-3.5 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    ₹{log.cost_loss_inr}
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-[11px] truncate max-w-xs">
                    {log.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
