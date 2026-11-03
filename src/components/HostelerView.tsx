import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { formatFriendlyDate, getCutoffStatus, getDayOfWeek, getTomorrowIST, isCutoffPassed } from '../lib/istTime';
import { MealType } from '../types';
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  UtensilsCrossed,
  Sun,
  Coffee,
  Moon,
  Save,
  Ban,
  Sparkles,
  Info,
  Check
} from 'lucide-react';

export const HostelerView: React.FC = () => {
  const { user } = useAuth();
  const { activeOption } = useTheme();
  const {
    attendanceRecords,
    getMenuItemsForMeal,
    saveHostelerAttendance,
    markNotEatingTomorrow,
    simulatedOffsetMinutes,
  } = useData();

  const tomorrow = getTomorrowIST(simulatedOffsetMinutes);
  const dayOfWeek = getDayOfWeek(tomorrow);
  const cutoffInfo = getCutoffStatus(tomorrow, simulatedOffsetMinutes);
  const isLocked = isCutoffPassed(tomorrow, simulatedOffsetMinutes);

  // Meal selections state
  interface MealSelection {
    attending: boolean;
    stapleId: string | null;
    sideId: string | null;
    stapleName: string;
    sideName: string;
  }

  const [selections, setSelections] = useState<Record<MealType, MealSelection>>({
    breakfast: { attending: true, stapleId: null, sideId: null, stapleName: '', sideName: '' },
    lunch: { attending: true, stapleId: null, sideId: null, stapleName: '', sideName: '' },
    snacks: { attending: true, stapleId: null, sideId: null, stapleName: '', sideName: '' },
    dinner: { attending: true, stapleId: null, sideId: null, stapleName: '', sideName: '' },
  });

  const [isNotEatingTomorrow, setIsNotEatingTomorrow] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load existing selections for tomorrow if already saved by user
  useEffect(() => {
    if (!user) return;

    const userTomorrowRecords = attendanceRecords.filter(
      (r) => r.user_id === user.id && r.target_date === tomorrow
    );

    if (userTomorrowRecords.length > 0) {
      const anyNotEating = userTomorrowRecords.some((r) => r.not_eating_tomorrow);
      setIsNotEatingTomorrow(anyNotEating);

      const nextSelections = { ...selections };
      userTomorrowRecords.forEach((rec) => {
        nextSelections[rec.meal_type] = {
          attending: rec.attending,
          stapleId: rec.selected_staple_id || null,
          sideId: rec.selected_side_id || null,
          stapleName: rec.staple_name || '',
          sideName: rec.side_name || '',
        };
      });
      setSelections(nextSelections);
    } else {
      // Auto-select first default items for each meal
      const defaultSelections: Record<MealType, MealSelection> = {
        breakfast: { attending: true, stapleId: null, sideId: null, stapleName: '', sideName: '' },
        lunch: { attending: true, stapleId: null, sideId: null, stapleName: '', sideName: '' },
        snacks: { attending: true, stapleId: null, sideId: null, stapleName: '', sideName: '' },
        dinner: { attending: true, stapleId: null, sideId: null, stapleName: '', sideName: '' },
      };

      const mealList: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
      mealList.forEach((m) => {
        const { staples, sides } = getMenuItemsForMeal(dayOfWeek, m);
        defaultSelections[m] = {
          attending: true,
          stapleId: staples[0]?.id || null,
          sideId: sides[0]?.id || null,
          stapleName: staples[0]?.dish_name || '',
          sideName: sides[0]?.dish_name || '',
        };
      });
      setSelections(defaultSelections);
    }
  }, [tomorrow, dayOfWeek, user?.id]);

  const handleToggleMeal = (meal: MealType) => {
    if (isLocked) return;
    setSelections((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        attending: !prev[meal].attending,
      },
    }));
  };

  const handleSelectStaple = (meal: MealType, stapleId: string, stapleName: string) => {
    if (isLocked) return;
    setSelections((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        stapleId,
        stapleName,
      },
    }));
  };

  const handleSelectSide = (meal: MealType, sideId: string, sideName: string) => {
    if (isLocked) return;
    setSelections((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        sideId,
        sideName,
      },
    }));
  };

  const handleNotEatingToggle = async () => {
    if (isLocked) return;
    const nextState = !isNotEatingTomorrow;
    setIsNotEatingTomorrow(nextState);

    if (nextState) {
      // Turn off all attending meals
      setSelections((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((k) => {
          updated[k as MealType].attending = false;
        });
        return updated;
      });
    } else {
      // Restore default attending
      setSelections((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((k) => {
          updated[k as MealType].attending = true;
        });
        return updated;
      });
    }
  };

  const handleSaveAll = async () => {
    if (isLocked) {
      setErrorMessage('Submissions are locked. The 8:00 PM IST cutoff has elapsed.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);

    const payload = (['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).map((mealType) => ({
      mealType,
      attending: isNotEatingTomorrow ? false : selections[mealType].attending,
      stapleId: selections[mealType].stapleId,
      sideId: selections[mealType].sideId,
      stapleName: selections[mealType].stapleName,
      sideName: selections[mealType].sideName,
    }));

    const result = await saveHostelerAttendance(tomorrow, payload, isNotEatingTomorrow);
    setIsSaving(false);

    if (result.success) {
      setSaveSuccess(`Attendance confirmed for ${formatFriendlyDate(tomorrow)}! Kitchen forecast updated.`);
      setTimeout(() => setSaveSuccess(null), 4000);
    } else {
      setErrorMessage(result.error || 'Failed to submit attendance.');
    }
  };

  const mealsMeta: {
    type: MealType;
    label: string;
    timing: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: 'breakfast',
      label: 'Breakfast',
      timing: '7:30 AM – 9:30 AM',
      icon: <Coffee className="w-4 h-4 text-amber-500" />,
    },
    {
      type: 'lunch',
      label: 'Lunch',
      timing: '12:30 PM – 2:30 PM',
      icon: <Sun className="w-4 h-4 text-emerald-500" />,
    },
    {
      type: 'snacks',
      label: 'Snacks & High Tea',
      timing: '5:00 PM – 6:30 PM',
      icon: <UtensilsCrossed className="w-4 h-4 text-blue-500" />,
    },
    {
      type: 'dinner',
      label: 'Dinner',
      timing: '7:45 PM – 9:45 PM',
      icon: <Moon className="w-4 h-4 text-indigo-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hostel Mess Daily Planner</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Meals for Tomorrow: {formatFriendlyDate(tomorrow)}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Confirm your attendance and select one staple and one side per meal. The kitchen uses these exact counts to prep fresh ingredients and prevent food waste.
            </p>
          </div>

          {/* Cutoff Status Box */}
          <div className={`p-4 rounded-lg border text-sm max-w-sm shrink-0 ${
            isLocked
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {isLocked ? <ShieldAlert className="w-4 h-4 text-rose-600" /> : <Clock className="w-4 h-4 text-emerald-600" />}
              <span>{isLocked ? 'Submissions Closed' : 'Cutoff Deadline: 8:00 PM IST'}</span>
            </div>
            <div className="text-xs mt-1 text-slate-600 dark:text-slate-400">
              {cutoffInfo.detailText}
            </div>
            {!isLocked && (
              <div className="font-mono tabular-nums text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                Time Remaining: {cutoffInfo.timeRemaining}
              </div>
            )}
          </div>
        </div>

        {/* Global Opt-Out Quick Action (Rule 2) */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              disabled={isLocked}
              onClick={handleNotEatingToggle}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isLocked ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isNotEatingTomorrow
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{isNotEatingTomorrow ? 'Marked: Not Eating Tomorrow' : 'Mark "Not Eating Tomorrow"'}</span>
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Going out or fasting? One click opts out of all 4 meals and avoids ~1.8kg food waste.
            </span>
          </div>

          <button
            disabled={isLocked || isSaving}
            onClick={handleSaveAll}
            style={!isLocked && !isSaving ? { backgroundColor: activeOption.primaryHex } : undefined}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer text-white ${
              isLocked
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'hover:opacity-90'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save & Confirm Tomorrow'}</span>
          </button>
        </div>

        {/* Status Alerts */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-lg text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLocked && (
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Attendance for tomorrow is read-only because the 8:00 PM IST cutoff has elapsed. Contact your Mess Supervisor if you have an urgent medical exception.</span>
          </div>
        )}
      </div>

      {/* 4 Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mealsMeta.map((meal) => {
          const { staples, sides } = getMenuItemsForMeal(dayOfWeek, meal.type);
          const currentSelection = selections[meal.type];
          const isAttending = !isNotEatingTomorrow && currentSelection.attending;

          return (
            <div
              key={meal.type}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 transition-all shadow-xs ${
                isAttending
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200/60 dark:border-slate-800/60 opacity-75 bg-slate-50/50 dark:bg-slate-950/30'
              }`}
            >
              {/* Meal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {meal.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {meal.label}
                    </h2>
                    <span className="text-xs text-slate-400">
                      {meal.timing}
                    </span>
                  </div>
                </div>

                {/* Attending Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {isAttending ? 'Attending' : 'Skipping'}
                  </span>
                  <input
                    type="checkbox"
                    disabled={isLocked || isNotEatingTomorrow}
                    checked={isAttending}
                    onChange={() => handleToggleMeal(meal.type)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
                  />
                </label>
              </div>

              {/* Dish Selections (Rule 2: Pick 1 staple and 1 side) */}
              {isAttending ? (
                <div className="mt-4 space-y-4">
                  {/* Pick 1 Staple */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Pick 1 Staple
                      </span>
                      <span className="text-xs text-slate-400">Required</span>
                    </div>

                    <div className="space-y-1.5">
                      {staples.map((dish) => {
                        const isChosen = currentSelection.stapleId === dish.id || currentSelection.stapleName === dish.dish_name;
                        return (
                          <button
                            type="button"
                            key={dish.id}
                            disabled={isLocked}
                            onClick={() => handleSelectStaple(meal.type, dish.id, dish.dish_name)}
                            style={isChosen ? { borderColor: activeOption.primaryHex, backgroundColor: activeOption.primaryHex + '15' } : undefined}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              isChosen
                                ? 'font-medium text-slate-900 dark:text-white'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                style={isChosen ? { borderColor: activeOption.primaryHex, backgroundColor: activeOption.primaryHex } : undefined}
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isChosen ? 'text-white' : 'border-slate-400'
                                }`}
                              >
                                {isChosen && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className="truncate">{dish.dish_name}</span>
                            </div>
                            <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                              ~{dish.prep_grams_per_person}g
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pick 1 Side */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Pick 1 Side Dish
                      </span>
                      <span className="text-xs text-slate-400">Required</span>
                    </div>

                    <div className="space-y-1.5">
                      {sides.map((dish) => {
                        const isChosen = currentSelection.sideId === dish.id || currentSelection.sideName === dish.dish_name;
                        return (
                          <button
                            type="button"
                            key={dish.id}
                            disabled={isLocked}
                            onClick={() => handleSelectSide(meal.type, dish.id, dish.dish_name)}
                            style={isChosen ? { borderColor: activeOption.primaryHex, backgroundColor: activeOption.primaryHex + '15' } : undefined}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              isChosen
                                ? 'font-medium text-slate-900 dark:text-white'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                style={isChosen ? { borderColor: activeOption.primaryHex, backgroundColor: activeOption.primaryHex } : undefined}
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isChosen ? 'text-white' : 'border-slate-400'
                                }`}
                              >
                                {isChosen && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className="truncate">{dish.dish_name}</span>
                            </div>
                            <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                              ~{dish.prep_grams_per_person}g
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  <Ban className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                  <span>You have opted out of this meal.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
