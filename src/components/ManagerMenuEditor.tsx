import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DayOfWeek, DishCategory, MealType, MenuItem } from '../types';
import { Plus, Trash2, Edit2, Check, X, Leaf, Utensils, Database, RefreshCw, Sparkles, Loader2, AlertCircle } from 'lucide-react';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

export const ManagerMenuEditor: React.FC = () => {
  const {
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    seedWeeklyMenuToSupabase,
    refreshData,
    isLoading
  } = useData();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');

  // New item form state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState<DishCategory>('staple');
  const [formDishName, setFormDishName] = useState<string>('');
  const [formGrams, setFormGrams] = useState<number>(180);
  const [formIsVeg, setFormIsVeg] = useState<boolean>(true);

  const [seeding, setSeeding] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filtered items for selected day & meal
  const filteredItems = menuItems.filter(
    (m) => m.day_of_week === selectedDay && m.meal_type === selectedMeal
  );

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormCategory('staple');
    setFormDishName('');
    setFormGrams(180);
    setFormIsVeg(true);
    setActionMessage(null);
    setActionError(null);
  };

  const handleStartEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setIsAdding(false);
    setFormCategory(item.category);
    setFormDishName(item.dish_name);
    setFormGrams(item.prep_grams_per_person);
    setFormIsVeg(item.is_veg);
    setActionMessage(null);
    setActionError(null);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDishName.trim()) return;

    if (editingId) {
      const existing = menuItems.find((m) => m.id === editingId);
      if (existing) {
        await updateMenuItem({
          ...existing,
          category: formCategory,
          dish_name: formDishName.trim(),
          prep_grams_per_person: Number(formGrams) || 150,
          is_veg: formIsVeg,
        });
        setActionMessage(`Updated "${formDishName.trim()}" in Supabase.`);
      }
    } else {
      await addMenuItem({
        day_of_week: selectedDay,
        meal_type: selectedMeal,
        category: formCategory,
        dish_name: formDishName.trim(),
        prep_grams_per_person: Number(formGrams) || 150,
        is_veg: formIsVeg,
      });
      setActionMessage(`Added "${formDishName.trim()}" to ${selectedDay} ${selectedMeal} in Supabase.`);
    }

    setIsAdding(false);
    setEditingId(null);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove "${name}" from Supabase menu_items?`)) {
      await deleteMenuItem(id);
      setActionMessage(`Deleted "${name}" from Supabase.`);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleSeedMenu = async () => {
    setSeeding(true);
    setActionMessage(null);
    setActionError(null);
    const res = await seedWeeklyMenuToSupabase();
    setSeeding(false);
    if (res.success) {
      setActionMessage(`Successfully seeded ${res.count || 56} weekly menu dishes directly into your Supabase database!`);
    } else {
      setActionError(`Could not seed: ${res.error || 'Please check Supabase RLS policies'}`);
    }
    setTimeout(() => {
      setActionMessage(null);
      setActionError(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Weekly Menu Catalog
            </h1>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
              <Database className="w-2.5 h-2.5" />
              <span>{menuItems.length} items in Supabase</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage dishes live in your Supabase database. Changes reflect instantly for hosteler attendance choices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Re-query Supabase database for latest menu_items"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            <span>Sync Supabase</span>
          </button>

          {menuItems.length === 0 && (
            <button
              onClick={handleSeedMenu}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Populate your Supabase menu_items table with standard 7-day cyclical dishes"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Populating Supabase...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed 7-Day Menu to Supabase</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleStartAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dish to Menu</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Day Selector */}
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

      {/* Meal Session Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
        {MEALS.map((meal) => {
          const isSelected = selectedMeal === meal;
          const mealCount = menuItems.filter(
            (m) => m.day_of_week === selectedDay && m.meal_type === meal
          ).length;
          return (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={`capitalize px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{meal}</span>
              <span className="font-mono text-[10px] text-slate-400">({mealCount})</span>
            </button>
          );
        })}
      </div>

      {/* Form Drawer (Add or Edit Dish) */}
      {(isAdding || editingId) && (
        <form
          onSubmit={handleSaveForm}
          className="p-5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/60 rounded-2xl shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-orange-600" />
              <span>{editingId ? 'Edit Dish in Supabase' : `Add Dish for ${selectedDay} ${selectedMeal}`}</span>
            </h3>
            <button
              type="button"
              onClick={handleCancelForm}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Dish Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paneer Butter Masala"
                value={formDishName}
                onChange={(e) => setFormDishName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as DishCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="staple">Staple (Rice / Bread / Base)</option>
                <option value="side">Side (Curry / Dal / Chutney)</option>
                <option value="extra">Extra / Beverage</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Portion Size (Grams/Person)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={formGrams}
                onChange={(e) => setFormGrams(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Dietary Type
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setFormIsVeg(true)}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    formIsVeg
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  Vegetarian
                </button>
                <button
                  type="button"
                  onClick={() => setFormIsVeg(false)}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    !formIsVeg
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  Non-Veg / Egg
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingId ? 'Save Changes' : 'Confirm & Add to Supabase'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Menu Items Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
            {selectedDay} {selectedMeal} Dishes ({filteredItems.length} active in Supabase)
          </h2>
          <span className="text-xs text-slate-400">
            Students pick 1 staple & 1 side per attended meal
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No dishes configured in Supabase for {selectedDay} {selectedMeal} yet.
            </p>
            <p className="text-[11px] text-slate-400">
              Click "Add Dish to Menu" above to register dishes directly into your Supabase database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Dish Name</th>
                  <th className="px-6 py-3 font-semibold">Prep Grams / Person</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`inline-block text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                        item.category === 'staple'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                      {item.dish_name}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                      ~{item.prep_grams_per_person}g
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {item.is_veg ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Leaf className="w-3.5 h-3.5" />
                          Veg
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          Non-Veg / Egg
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit dish in Supabase"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.dish_name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Delete dish from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
