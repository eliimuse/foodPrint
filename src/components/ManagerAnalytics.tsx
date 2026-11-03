import React from 'react';
import { useData } from '../context/DataContext';
import { formatFriendlyDate } from '../lib/istTime';
import {
  TrendingUp,
  Leaf,
  DollarSign,
  Award,
  BarChart2,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export const ManagerAnalytics: React.FC = () => {
  const { consumptionLogs } = useData();

  // Aggregate logs by date for overall daily trends
  const dateMap = new Map<string, {
    date: string;
    displayDate: string;
    confirmed: number;
    predicted: number;
    actual: number;
    wasteKg: number;
    wasteAvoidedKg: number;
    rupeesSaved: number;
  }>();

  consumptionLogs.forEach((log) => {
    const prev = dateMap.get(log.log_date) || {
      date: log.log_date,
      displayDate: log.log_date.slice(5),
      confirmed: 0,
      predicted: 0,
      actual: 0,
      wasteKg: 0,
      wasteAvoidedKg: 0,
      rupeesSaved: 0,
    };

    const avoidedKg = Math.max(0, (log.confirmed_count - log.predicted_turnout) * 0.45);

    dateMap.set(log.log_date, {
      ...prev,
      confirmed: prev.confirmed + log.confirmed_count,
      predicted: prev.predicted + log.predicted_turnout,
      actual: prev.actual + log.actual_turnout,
      wasteKg: Math.round((prev.wasteKg + Number(log.leftover_waste_kg)) * 10) / 10,
      wasteAvoidedKg: Math.round((prev.wasteAvoidedKg + avoidedKg) * 10) / 10,
      rupeesSaved: Math.round(prev.rupeesSaved + avoidedKg * 95),
    });
  });

  const chartData = Array.from(dateMap.values())
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(-10);

  // Overall statistics
  const totalFoodWasteAvoidedKg = chartData.reduce((acc, curr) => acc + curr.wasteAvoidedKg, 0);
  const totalRupeesSaved = chartData.reduce((acc, curr) => acc + curr.rupeesSaved, 0);
  const totalActualLeftoverKg = chartData.reduce((acc, curr) => acc + curr.wasteKg, 0);

  // ML Accuracy metric
  const totalActual = chartData.reduce((acc, curr) => acc + curr.actual, 0);
  const totalPredicted = chartData.reduce((acc, curr) => acc + curr.predicted, 0);
  const accuracy = Math.min(100, Math.round((1 - Math.abs(totalPredicted - totalActual) / (totalActual || 1)) * 100));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Food Waste & Turnout Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Measurable impact of advance attendance confirmations and ML-attenuated kitchen preparation.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cumulative Food Saved</span>
            <Leaf className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {Math.round(totalFoodWasteAvoidedKg)}
            </span>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              kg prevented
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Food that would have been cooked as surplus
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Mess Budget Savings</span>
            <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              ₹{totalRupeesSaved.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">INR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Saved on raw grain, oil, veggies & gas
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>ML Prediction Accuracy</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {accuracy}%
            </span>
            <span className="text-xs font-medium text-amber-500">conformance</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Model variance vs actual plate swipes
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Average Meal Leftover</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {Math.round((totalActualLeftoverKg / (chartData.length || 1)) * 10) / 10}
            </span>
            <span className="text-xs font-medium text-slate-400">kg / day</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Down from 35kg/day prior to FoodPrint
          </div>
        </div>
      </div>

      {/* Main Turnout Accuracy Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Turnout Tracking: Confirmed vs ML Predicted vs Actual Served</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Notice how the terracotta ML predicted line closely matches the purple actual turnout line, avoiding the excess confirmed buffer.
            </p>
          </div>
        </div>

        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={45} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="confirmed" name="Raw Confirmed Headcount" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
              <Line type="monotone" dataKey="predicted" name="ML Predicted Turnout" stroke="#c2410c" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="actual" name="Actual Plates Served" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Food Waste Prevented Area Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Leaf className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Daily Food Waste Avoided (kg)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daily mass of food saved from kitchen surplus dumping by adhering to ML recommendations.
            </p>
          </div>
        </div>

        <div className="mt-6 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="terracottaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c2410c" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#c2410c" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={45} />
              <Tooltip
                formatter={(val: any) => [`${val} kg food`, 'Prevented']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#f8fafc',
                }}
              />
              <Area type="monotone" dataKey="wasteAvoidedKg" stroke="#c2410c" strokeWidth={2} fillOpacity={1} fill="url(#terracottaGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
