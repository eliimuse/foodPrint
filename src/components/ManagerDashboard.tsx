import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { formatFriendlyDate, getDayOfWeek, getTomorrowIST } from '../lib/istTime';
import { calculateKitchenPrepRequirements, predictMealTurnout } from '../lib/mlService';
import { MealPrepRequirement, MealType, MLPredictionResult } from '../types';
import {
  Users,
  Brain,
  ChefHat,
  TrendingDown,
  Printer,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  PieChart as PieIcon
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const ManagerDashboard: React.FC = () => {
  const { attendanceRecords, menuItems, simulatedOffsetMinutes } = useData();
  const { activeOption } = useTheme();

  const tomorrow = getTomorrowIST(simulatedOffsetMinutes);
  const dayOfWeek = getDayOfWeek(tomorrow);

  const [activeMeal, setActiveMeal] = useState<MealType>('lunch');
  const [predictions, setPredictions] = useState<Record<MealType, MLPredictionResult>>({
    breakfast: { meal_type: 'breakfast', confirmed_count: 0, predicted_turnout: 0, confidence_interval: [0, 0], predicted_waste_kg_without_prep_adjustment: 0, recommended_prep_servings: 0, is_ml_service_active: false },
    lunch: { meal_type: 'lunch', confirmed_count: 0, predicted_turnout: 0, confidence_interval: [0, 0], predicted_waste_kg_without_prep_adjustment: 0, recommended_prep_servings: 0, is_ml_service_active: false },
    snacks: { meal_type: 'snacks', confirmed_count: 0, predicted_turnout: 0, confidence_interval: [0, 0], predicted_waste_kg_without_prep_adjustment: 0, recommended_prep_servings: 0, is_ml_service_active: false },
    dinner: { meal_type: 'dinner', confirmed_count: 0, predicted_turnout: 0, confidence_interval: [0, 0], predicted_waste_kg_without_prep_adjustment: 0, recommended_prep_servings: 0, is_ml_service_active: false },
  });

  const [prepRequirements, setPrepRequirements] = useState<MealPrepRequirement[]>([]);

  // Calculate confirmed counts for tomorrow from attendance records
  useEffect(() => {
    async function computeForecasts() {
      const tomorrowRecords = attendanceRecords.filter((r) => r.target_date === tomorrow);
      const meals: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
      const nextPredictions = { ...predictions };

      for (const m of meals) {
        const confirmed = tomorrowRecords.filter((r) => r.meal_type === m && r.attending).length;
        const res = await predictMealTurnout(m, confirmed, dayOfWeek);
        nextPredictions[m] = res;
      }

      setPredictions(nextPredictions);
    }

    computeForecasts();
  }, [attendanceRecords, tomorrow, dayOfWeek]);

  // Recalculate raw prep sheet when active meal changes
  useEffect(() => {
    const currentPred = predictions[activeMeal];
    const reqs = calculateKitchenPrepRequirements(activeMeal, currentPred.recommended_prep_servings);
    setPrepRequirements(reqs);
  }, [activeMeal, predictions]);

  // Dish preference tally for active meal
  const activeMealRecords = attendanceRecords.filter(
    (r) => r.target_date === tomorrow && r.meal_type === activeMeal && r.attending
  );

  const stapleCounts: Record<string, number> = {};
  const sideCounts: Record<string, number> = {};

  activeMealRecords.forEach((r) => {
    if (r.staple_name) stapleCounts[r.staple_name] = (stapleCounts[r.staple_name] || 0) + 1;
    if (r.side_name) sideCounts[r.side_name] = (sideCounts[r.side_name] || 0) + 1;
  });

  const stapleChartData = Object.entries(stapleCounts).map(([name, count]) => ({
    name,
    count,
    share: Math.round((count / (activeMealRecords.length || 1)) * 100),
  }));

  const sideChartData = Object.entries(sideCounts).map(([name, count]) => ({
    name,
    count,
    share: Math.round((count / (activeMealRecords.length || 1)) * 100),
  }));

  const BAR_COLORS = [activeOption.primaryHex, '#3b82f6', '#f59e0b', '#8b5cf6'];

  const handlePrintPrepSheet = () => {
    window.print();
  };

  const mealTabs: { type: MealType; label: string }[] = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'snacks', label: 'Snacks' },
    { type: 'dinner', label: 'Dinner' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: activeOption.primaryHex }}
            >
              <ChefHat className="w-4 h-4" />
              <span>Mess Supervisor Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Next-Day Headcount & Raw Prep Forecast
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              For {formatFriendlyDate(tomorrow)} ({dayOfWeek}) · ML model applies turnout attenuation factor (confirmed × 0.90) to eliminate kitchen surplus waste.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintPrepSheet}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Chef Prep Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Meals KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mealTabs.map((meal) => {
          const p = predictions[meal.type];
          const isSelected = activeMeal === meal.type;

          return (
            <div
              key={meal.type}
              onClick={() => setActiveMeal(meal.type)}
              style={isSelected ? { borderColor: activeOption.primaryHex, boxShadow: `0 0 0 2px ${activeOption.primaryHex}33` } : undefined}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 cursor-pointer transition-all shadow-xs ${
                isSelected
                  ? 'border-transparent'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {meal.label}
                </span>
                {isSelected && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: activeOption.primaryHex + '18',
                      color: activeOption.primaryHex,
                    }}
                  >
                    Selected
                  </span>
                )}
              </div>

              {/* Confirmed count */}
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Confirmed</span>
                  <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {p.confirmed_count}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className="text-xs block font-medium"
                    style={{ color: activeOption.primaryHex }}
                  >
                    ML Turnout
                  </span>
                  <span
                    className="text-2xl font-bold font-mono tabular-nums"
                    style={{ color: activeOption.primaryHex }}
                  >
                    {p.predicted_turnout}
                  </span>
                </div>
              </div>

              {/* Prep recommendation footer */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Cook For:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                  {p.recommended_prep_servings} servings
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Dive for Selected Meal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kitchen Raw Ingredient Prep Sheet (2 Columns on Desktop) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-emerald-600" />
                <span>Kitchen Raw Prep Sheet: {mealTabs.find((m) => m.type === activeMeal)?.label}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated for {predictions[activeMeal].recommended_prep_servings} recommended servings (ML turnout + 3% contingency margin).
              </p>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400 block">Waste Avoided</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                ~{predictions[activeMeal].predicted_waste_kg_without_prep_adjustment} kg
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Raw Ingredient</th>
                  <th className="py-2.5 px-4 font-semibold">Portion / Person</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total Kitchen Measure</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {prepRequirements.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {item.ingredient}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                      {item.perPersonAmount}g
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums text-sm">
                      {item.recommendedTotal} {item.unit}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready to issue
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Store room manager must issue these exact dry and fresh stores by 6:00 AM / 11:00 AM. Avoid scaling above the ML recommendation.</span>
          </div>
        </div>

        {/* Dish Choice Distribution Charts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <span>Dish Selection Breakdown</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {activeMealRecords.length} choices
              </span>
            </div>

            {/* Staple Breakdown */}
            <div className="mt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Staples Chosen
              </span>
              <div className="h-32 w-full">
                {stapleChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stapleChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip
                        formatter={(val: any) => [`${val} students`, 'Selected']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stapleChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No staple selections logged yet
                  </div>
                )}
              </div>
            </div>

            {/* Side Breakdown */}
            <div className="mt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Sides Chosen
              </span>
              <div className="h-32 w-full">
                {sideChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sideChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip
                        formatter={(val: any) => [`${val} students`, 'Selected']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {sideChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[(index + 1) % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No side selections logged yet
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Cooks adjust pot sizes proportionally so popular gravies do not run out before late diners arrive.
          </div>
        </div>
      </div>
    </div>
  );
};
