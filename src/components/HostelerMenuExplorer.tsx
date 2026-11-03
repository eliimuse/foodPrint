import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DayOfWeek, MealType } from '../types';
import { UtensilsCrossed, Leaf, Coffee, Sun, Moon, Database, RefreshCw, AlertCircle } from 'lucide-react';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const HostelerMenuExplorer: React.FC = () => {
  const { menuItems, isLoading, refreshData } = useData();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');

  const meals: { type: MealType; label: string; timing: string; icon: React.ReactNode }[] = [
    { type: 'breakfast', label: 'Breakfast', timing: '7:30 AM – 9:30 AM', icon: <Coffee className="w-4 h-4 text-amber-500" /> },
    { type: 'lunch', label: 'Lunch', timing: '12:30 PM – 2:30 PM', icon: <Sun className="w-4 h-4 text-emerald-500" /> },
    { type: 'snacks', label: 'Snacks & High Tea', timing: '5:00 PM – 6:30 PM', icon: <UtensilsCrossed className="w-4 h-4 text-blue-500" /> },
    { type: 'dinner', label: 'Dinner', timing: '7:45 PM – 9:45 PM', icon: <Moon className="w-4 h-4 text-indigo-500" /> },
  ];

  const totalDishes = menuItems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              7-Day Cyclical Mess Menu
            </h1>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
              <Database className="w-2.5 h-2.5" />
              <span>{totalDishes} live in Supabase</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse dishes fetched live from your central hostel Supabase database.
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
          <span>Refresh Menu</span>
        </button>
      </div>

      {/* Day of Week Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800">
        {DAYS.map((day) => {
          const isSelected = selectedDay === day;
          const dayCount = menuItems.filter((m) => m.day_of_week === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{day}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-orange-100 dark:bg-orange-950 text-orange-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {dayCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Meal Cards for Selected Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {meals.map((meal) => {
          const items = menuItems.filter(
            (m) => m.day_of_week === selectedDay && m.meal_type === meal.type
          );
          const staples = items.filter((m) => m.category === 'staple');
          const sides = items.filter((m) => m.category === 'side');

          return (
            <div
              key={meal.type}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {meal.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {meal.label}
                    </h2>
                    <span className="text-xs text-slate-400 font-mono text-[11px]">{meal.timing}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 capitalize">
                  {selectedDay}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>No dishes registered in Supabase for this session yet.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {/* Staples */}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Staple Choices (Pick 1)
                    </span>
                    {staples.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No staple registered in Supabase</p>
                    ) : (
                      <div className="space-y-1.5">
                        {staples.map((dish) => (
                          <div
                            key={dish.id}
                            className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Leaf className={`w-3.5 h-3.5 ${dish.is_veg ? 'text-emerald-600' : 'text-amber-600'}`} />
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {dish.dish_name}
                              </span>
                            </div>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ~{dish.prep_grams_per_person}g/serving
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sides */}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Side Dishes & Gravies (Pick 1)
                    </span>
                    {sides.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No side registered in Supabase</p>
                    ) : (
                      <div className="space-y-1.5">
                        {sides.map((dish) => (
                          <div
                            key={dish.id}
                            className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Leaf className={`w-3.5 h-3.5 ${dish.is_veg ? 'text-emerald-600' : 'text-amber-600'}`} />
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {dish.dish_name}
                              </span>
                            </div>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ~{dish.prep_grams_per_person}g/serving
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
