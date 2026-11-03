import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDayOfWeek, getTodayIST, getTomorrowIST, isCutoffPassed } from '../lib/istTime';
import { checkSupabaseHealth, supabase, SupabaseHealth } from '../lib/supabase';
import { ConsumptionLog, DayOfWeek, MealAttendance, MealType, MenuItem } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  menuItems: MenuItem[];
  attendanceRecords: MealAttendance[];
  consumptionLogs: ConsumptionLog[];
  supabaseHealth: SupabaseHealth;
  simulatedOffsetMinutes: number;
  setSimulatedOffsetMinutes: (offset: number) => void;
  toggleSimulateLockedCutoff: () => void;
  isLoading: boolean;
  supabaseMenuCount: number;
  
  // Actions
  saveHostelerAttendance: (
    targetDate: string,
    selections: {
      mealType: MealType;
      attending: boolean;
      stapleId?: string | null;
      sideId?: string | null;
      stapleName?: string;
      sideName?: string;
    }[],
    notEatingTomorrow: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  
  saveSingleMealChoice: (
    targetDate: string,
    mealType: MealType,
    attending: boolean,
    stapleId?: string | null,
    sideId?: string | null,
    stapleName?: string,
    sideName?: string
  ) => Promise<{ success: boolean; error?: string }>;

  markNotEatingTomorrow: (targetDate: string) => Promise<{ success: boolean; error?: string }>;

  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateMenuItem: (item: MenuItem) => Promise<{ success: boolean; error?: string }>;
  deleteMenuItem: (id: string) => Promise<{ success: boolean; error?: string }>;

  logConsumption: (entry: Omit<ConsumptionLog, 'id'>) => Promise<{ success: boolean; error?: string }>;

  getMenuItemsForMeal: (day: DayOfWeek, mealType: MealType) => {
    staples: MenuItem[];
    sides: MenuItem[];
    extras: MenuItem[];
  };

  seedWeeklyMenuToSupabase: () => Promise<{ success: boolean; count?: number; error?: string }>;
  refreshData: () => Promise<void>;
}

// 7-Day cyclical template dishes for quick manager seeding if Supabase table is empty
const SEED_TEMPLATE_DISHES: Omit<MenuItem, 'id'>[] = [
  // Monday
  { day_of_week: 'Monday', meal_type: 'breakfast', category: 'staple', dish_name: 'Poha with Roasted Peanuts', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Monday', meal_type: 'breakfast', category: 'staple', dish_name: 'Idli with Sambar', is_veg: true, prep_grams_per_person: 200 },
  { day_of_week: 'Monday', meal_type: 'breakfast', category: 'side', dish_name: 'Coconut & Tomato Chutney', is_veg: true, prep_grams_per_person: 60 },
  { day_of_week: 'Monday', meal_type: 'breakfast', category: 'side', dish_name: 'Sprouted Moong Salad', is_veg: true, prep_grams_per_person: 80 },

  { day_of_week: 'Monday', meal_type: 'lunch', category: 'staple', dish_name: 'Steamed Basmati Rice', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Monday', meal_type: 'lunch', category: 'staple', dish_name: 'Tawa Phulka / Roti', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Monday', meal_type: 'lunch', category: 'side', dish_name: 'Dal Tadka (Yellow Lentils)', is_veg: true, prep_grams_per_person: 150 },
  { day_of_week: 'Monday', meal_type: 'lunch', category: 'side', dish_name: 'Aloo Gobi Matar', is_veg: true, prep_grams_per_person: 140 },

  { day_of_week: 'Monday', meal_type: 'snacks', category: 'staple', dish_name: 'Vegetable Cutlet with Chutney', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Monday', meal_type: 'snacks', category: 'staple', dish_name: 'Sweet Corn Chaat', is_veg: true, prep_grams_per_person: 100 },
  { day_of_week: 'Monday', meal_type: 'snacks', category: 'side', dish_name: 'Cardamom Masala Chai', is_veg: true, prep_grams_per_person: 150 },
  { day_of_week: 'Monday', meal_type: 'snacks', category: 'side', dish_name: 'Cold Coffee', is_veg: true, prep_grams_per_person: 150 },

  { day_of_week: 'Monday', meal_type: 'dinner', category: 'staple', dish_name: 'Jeera Rice', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Monday', meal_type: 'dinner', category: 'staple', dish_name: 'Tandoori Butter Roti', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Monday', meal_type: 'dinner', category: 'side', dish_name: 'Paneer Butter Masala', is_veg: true, prep_grams_per_person: 160 },
  { day_of_week: 'Monday', meal_type: 'dinner', category: 'side', dish_name: 'Dal Makhani', is_veg: true, prep_grams_per_person: 150 },

  // Tuesday
  { day_of_week: 'Tuesday', meal_type: 'breakfast', category: 'staple', dish_name: 'Aloo Paratha with Curd', is_veg: true, prep_grams_per_person: 220 },
  { day_of_week: 'Tuesday', meal_type: 'breakfast', category: 'staple', dish_name: 'Rava Upma with Veggies', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Tuesday', meal_type: 'breakfast', category: 'side', dish_name: 'Fresh Mint Curd', is_veg: true, prep_grams_per_person: 80 },
  { day_of_week: 'Tuesday', meal_type: 'breakfast', category: 'side', dish_name: 'Mixed Fruit Bowl', is_veg: true, prep_grams_per_person: 100 },

  { day_of_week: 'Tuesday', meal_type: 'lunch', category: 'staple', dish_name: 'Jeera Pulav', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Tuesday', meal_type: 'lunch', category: 'staple', dish_name: 'Whole Wheat Chapati', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Tuesday', meal_type: 'lunch', category: 'side', dish_name: 'Rajma Masala (Red Kidney Beans)', is_veg: true, prep_grams_per_person: 170 },
  { day_of_week: 'Tuesday', meal_type: 'lunch', category: 'side', dish_name: 'Bhindi Masala (Okra)', is_veg: true, prep_grams_per_person: 130 },

  { day_of_week: 'Tuesday', meal_type: 'snacks', category: 'staple', dish_name: 'Samosa with Mint Chutney', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Tuesday', meal_type: 'snacks', category: 'staple', dish_name: 'Poha Chivda', is_veg: true, prep_grams_per_person: 80 },
  { day_of_week: 'Tuesday', meal_type: 'snacks', category: 'side', dish_name: 'Ginger Chai', is_veg: true, prep_grams_per_person: 150 },
  { day_of_week: 'Tuesday', meal_type: 'snacks', category: 'side', dish_name: 'Lemon Iced Tea', is_veg: true, prep_grams_per_person: 150 },

  { day_of_week: 'Tuesday', meal_type: 'dinner', category: 'staple', dish_name: 'Steamed Rice', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Tuesday', meal_type: 'dinner', category: 'staple', dish_name: 'Tawa Roti', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Tuesday', meal_type: 'dinner', category: 'side', dish_name: 'Mix Vegetable Korma', is_veg: true, prep_grams_per_person: 160 },
  { day_of_week: 'Tuesday', meal_type: 'dinner', category: 'side', dish_name: 'Chana Dal Fry', is_veg: true, prep_grams_per_person: 150 },

  // Wednesday
  { day_of_week: 'Wednesday', meal_type: 'breakfast', category: 'staple', dish_name: 'Masala Dosa with Sambar', is_veg: true, prep_grams_per_person: 220 },
  { day_of_week: 'Wednesday', meal_type: 'breakfast', category: 'staple', dish_name: 'Vegetable Semiya Upma', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Wednesday', meal_type: 'breakfast', category: 'side', dish_name: 'Coconut & Onion Chutney', is_veg: true, prep_grams_per_person: 70 },
  { day_of_week: 'Wednesday', meal_type: 'breakfast', category: 'side', dish_name: 'Boiled Eggs / Banana', is_veg: false, prep_grams_per_person: 100 },

  { day_of_week: 'Wednesday', meal_type: 'lunch', category: 'staple', dish_name: 'Steamed Rice', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Wednesday', meal_type: 'lunch', category: 'staple', dish_name: 'Phulka', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Wednesday', meal_type: 'lunch', category: 'side', dish_name: 'Chole Masala (Chickpeas)', is_veg: true, prep_grams_per_person: 170 },
  { day_of_week: 'Wednesday', meal_type: 'lunch', category: 'side', dish_name: 'Baingan Bharta', is_veg: true, prep_grams_per_person: 140 },

  { day_of_week: 'Wednesday', meal_type: 'snacks', category: 'staple', dish_name: 'Pav Bhaji', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Wednesday', meal_type: 'snacks', category: 'staple', dish_name: 'Bhel Puri', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Wednesday', meal_type: 'snacks', category: 'side', dish_name: 'Special Elaichi Chai', is_veg: true, prep_grams_per_person: 150 },
  { day_of_week: 'Wednesday', meal_type: 'snacks', category: 'side', dish_name: 'Masala Chaas (Buttermilk)', is_veg: true, prep_grams_per_person: 180 },

  { day_of_week: 'Wednesday', meal_type: 'dinner', category: 'staple', dish_name: 'Vegetable Dum Biryani', is_veg: true, prep_grams_per_person: 220 },
  { day_of_week: 'Wednesday', meal_type: 'dinner', category: 'staple', dish_name: 'Tandoori Roti', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Wednesday', meal_type: 'dinner', category: 'side', dish_name: 'Paneer Do Pyaza', is_veg: true, prep_grams_per_person: 160 },
  { day_of_week: 'Wednesday', meal_type: 'dinner', category: 'side', dish_name: 'Boondi Raita', is_veg: true, prep_grams_per_person: 100 },

  // Thursday
  { day_of_week: 'Thursday', meal_type: 'breakfast', category: 'staple', dish_name: 'Methi Thepla with Pickle', is_veg: true, prep_grams_per_person: 200 },
  { day_of_week: 'Thursday', meal_type: 'breakfast', category: 'staple', dish_name: 'Veg Sandwich / Omelette', is_veg: false, prep_grams_per_person: 180 },
  { day_of_week: 'Thursday', meal_type: 'breakfast', category: 'side', dish_name: 'Fresh Curd & Mango Pickle', is_veg: true, prep_grams_per_person: 80 },
  { day_of_week: 'Thursday', meal_type: 'breakfast', category: 'side', dish_name: 'Papaya Slices', is_veg: true, prep_grams_per_person: 100 },

  { day_of_week: 'Thursday', meal_type: 'lunch', category: 'staple', dish_name: 'Peas Pulav', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Thursday', meal_type: 'lunch', category: 'staple', dish_name: 'Tawa Roti', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Thursday', meal_type: 'lunch', category: 'side', dish_name: 'Kadai Paneer', is_veg: true, prep_grams_per_person: 160 },
  { day_of_week: 'Thursday', meal_type: 'lunch', category: 'side', dish_name: 'Moong Dal Tadka', is_veg: true, prep_grams_per_person: 150 },

  { day_of_week: 'Thursday', meal_type: 'snacks', category: 'staple', dish_name: 'Bread Pakora with Chutney', is_veg: true, prep_grams_per_person: 140 },
  { day_of_week: 'Thursday', meal_type: 'snacks', category: 'staple', dish_name: 'Dhokla with Green Chili', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Thursday', meal_type: 'snacks', category: 'side', dish_name: 'Adrak Masala Chai', is_veg: true, prep_grams_per_person: 150 },
  { day_of_week: 'Thursday', meal_type: 'snacks', category: 'side', dish_name: 'Sweet Lassi', is_veg: true, prep_grams_per_person: 180 },

  { day_of_week: 'Thursday', meal_type: 'dinner', category: 'staple', dish_name: 'Steamed Rice', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Thursday', meal_type: 'dinner', category: 'staple', dish_name: 'Butter Chapati', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Thursday', meal_type: 'dinner', category: 'side', dish_name: 'Malai Kofta', is_veg: true, prep_grams_per_person: 170 },
  { day_of_week: 'Thursday', meal_type: 'dinner', category: 'side', dish_name: 'Panchmel Dal (5 Lentils)', is_veg: true, prep_grams_per_person: 150 },

  // Friday
  { day_of_week: 'Friday', meal_type: 'breakfast', category: 'staple', dish_name: 'Medu Vada with Sambhar', is_veg: true, prep_grams_per_person: 200 },
  { day_of_week: 'Friday', meal_type: 'breakfast', category: 'staple', dish_name: 'Sabudana Khichdi', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Friday', meal_type: 'breakfast', category: 'side', dish_name: 'Coconut Chutney', is_veg: true, prep_grams_per_person: 70 },
  { day_of_week: 'Friday', meal_type: 'breakfast', category: 'side', dish_name: 'Boiled Sprouts', is_veg: true, prep_grams_per_person: 90 },

  { day_of_week: 'Friday', meal_type: 'lunch', category: 'staple', dish_name: 'Steamed Basmati Rice', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Friday', meal_type: 'lunch', category: 'staple', dish_name: 'Phulka Roti', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Friday', meal_type: 'lunch', category: 'side', dish_name: 'Kadhi Pakora', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Friday', meal_type: 'lunch', category: 'side', dish_name: 'Jeera Aloo', is_veg: true, prep_grams_per_person: 130 },

  { day_of_week: 'Friday', meal_type: 'snacks', category: 'staple', dish_name: 'Aloo Tikki Chaat', is_veg: true, prep_grams_per_person: 160 },
  { day_of_week: 'Friday', meal_type: 'snacks', category: 'staple', dish_name: 'Roasted Chana & Peanuts', is_veg: true, prep_grams_per_person: 80 },
  { day_of_week: 'Friday', meal_type: 'snacks', category: 'side', dish_name: 'Cutting Chai', is_veg: true, prep_grams_per_person: 150 },
  { day_of_week: 'Friday', meal_type: 'snacks', category: 'side', dish_name: 'Citrus Fruit Juice', is_veg: true, prep_grams_per_person: 150 },

  { day_of_week: 'Friday', meal_type: 'dinner', category: 'staple', dish_name: 'Hyderabadi Veg Biryani', is_veg: true, prep_grams_per_person: 230 },
  { day_of_week: 'Friday', meal_type: 'dinner', category: 'staple', dish_name: 'Tandoori Roti', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Friday', meal_type: 'dinner', category: 'side', dish_name: 'Shahi Paneer', is_veg: true, prep_grams_per_person: 170 },
  { day_of_week: 'Friday', meal_type: 'dinner', category: 'side', dish_name: 'Cucumber & Mint Raita', is_veg: true, prep_grams_per_person: 100 },

  // Saturday
  { day_of_week: 'Saturday', meal_type: 'breakfast', category: 'staple', dish_name: 'Poori Bhaji', is_veg: true, prep_grams_per_person: 220 },
  { day_of_week: 'Saturday', meal_type: 'breakfast', category: 'staple', dish_name: 'Cornflakes with Hot Milk', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Saturday', meal_type: 'breakfast', category: 'side', dish_name: 'Suji Halwa', is_veg: true, prep_grams_per_person: 80 },
  { day_of_week: 'Saturday', meal_type: 'breakfast', category: 'side', dish_name: 'Boiled Eggs / Fruit', is_veg: false, prep_grams_per_person: 90 },

  { day_of_week: 'Saturday', meal_type: 'lunch', category: 'staple', dish_name: 'Khichdi with Golden Ghee', is_veg: true, prep_grams_per_person: 200 },
  { day_of_week: 'Saturday', meal_type: 'lunch', category: 'staple', dish_name: 'Tawa Roti', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Saturday', meal_type: 'lunch', category: 'side', dish_name: 'Paneer Bhurji', is_veg: true, prep_grams_per_person: 150 },
  { day_of_week: 'Saturday', meal_type: 'lunch', category: 'side', dish_name: 'Baingan Masala', is_veg: true, prep_grams_per_person: 130 },

  { day_of_week: 'Saturday', meal_type: 'snacks', category: 'staple', dish_name: 'Veg Grilled Sandwich', is_veg: true, prep_grams_per_person: 160 },
  { day_of_week: 'Saturday', meal_type: 'snacks', category: 'staple', dish_name: 'Masala Murmura', is_veg: true, prep_grams_per_person: 70 },
  { day_of_week: 'Saturday', meal_type: 'snacks', category: 'side', dish_name: 'Cardamom Tea', is_veg: true, prep_grams_per_person: 150 },
  { day_of_week: 'Saturday', meal_type: 'snacks', category: 'side', dish_name: 'Mango Milkshake', is_veg: true, prep_grams_per_person: 180 },

  { day_of_week: 'Saturday', meal_type: 'dinner', category: 'staple', dish_name: 'Jeera Rice', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Saturday', meal_type: 'dinner', category: 'staple', dish_name: 'Butter Naan / Roti', is_veg: true, prep_grams_per_person: 130 },
  { day_of_week: 'Saturday', meal_type: 'dinner', category: 'side', dish_name: 'Matar Paneer', is_veg: true, prep_grams_per_person: 160 },
  { day_of_week: 'Saturday', meal_type: 'dinner', category: 'side', dish_name: 'Dal Tadka', is_veg: true, prep_grams_per_person: 150 },

  // Sunday
  { day_of_week: 'Sunday', meal_type: 'breakfast', category: 'staple', dish_name: 'Chole Bhature', is_veg: true, prep_grams_per_person: 250 },
  { day_of_week: 'Sunday', meal_type: 'breakfast', category: 'staple', dish_name: 'Uttapam with Chutney', is_veg: true, prep_grams_per_person: 200 },
  { day_of_week: 'Sunday', meal_type: 'breakfast', category: 'side', dish_name: 'Coconut Chutney & Pickle', is_veg: true, prep_grams_per_person: 60 },
  { day_of_week: 'Sunday', meal_type: 'breakfast', category: 'side', dish_name: 'Masala Buttermilk', is_veg: true, prep_grams_per_person: 150 },

  { day_of_week: 'Sunday', meal_type: 'lunch', category: 'staple', dish_name: 'Special Sunday Dum Pulav', is_veg: true, prep_grams_per_person: 200 },
  { day_of_week: 'Sunday', meal_type: 'lunch', category: 'staple', dish_name: 'Tandoori Roti', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Sunday', meal_type: 'lunch', category: 'side', dish_name: 'Dum Aloo Kashmiri', is_veg: true, prep_grams_per_person: 160 },
  { day_of_week: 'Sunday', meal_type: 'lunch', category: 'side', dish_name: 'Gulab Jamun (Dessert)', is_veg: true, prep_grams_per_person: 90 },

  { day_of_week: 'Sunday', meal_type: 'snacks', category: 'staple', dish_name: 'Maggi Noodles / Veg Pasta', is_veg: true, prep_grams_per_person: 160 },
  { day_of_week: 'Sunday', meal_type: 'snacks', category: 'staple', dish_name: 'Biscuit & Rusk Platter', is_veg: true, prep_grams_per_person: 70 },
  { day_of_week: 'Sunday', meal_type: 'snacks', category: 'side', dish_name: 'Special Ginger Chai', is_veg: true, prep_grams_per_person: 150 },
  { day_of_week: 'Sunday', meal_type: 'snacks', category: 'side', dish_name: 'Cold Bournvita Milk', is_veg: true, prep_grams_per_person: 180 },

  { day_of_week: 'Sunday', meal_type: 'dinner', category: 'staple', dish_name: 'Vegetable Pulao', is_veg: true, prep_grams_per_person: 180 },
  { day_of_week: 'Sunday', meal_type: 'dinner', category: 'staple', dish_name: 'Phulka', is_veg: true, prep_grams_per_person: 120 },
  { day_of_week: 'Sunday', meal_type: 'dinner', category: 'side', dish_name: 'Paneer Tikka Masala', is_veg: true, prep_grams_per_person: 170 },
  { day_of_week: 'Sunday', meal_type: 'dinner', category: 'side', dish_name: 'Yellow Moong Dal', is_veg: true, prep_grams_per_person: 140 },
];

// Helper to calculate upcoming date for a day of week
function getDateForWeekday(targetWeekday: DayOfWeek): string {
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = getTodayIST();
  const currentWeekday = getDayOfWeek(today);
  const currentIdx = days.indexOf(currentWeekday);
  const targetIdx = days.indexOf(targetWeekday);
  let diff = targetIdx - currentIdx;
  if (diff < 0) diff += 7;
  const d = new Date(today);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();

  // Load from Supabase cache if previously fetched, otherwise start empty and fetch live
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const cached = localStorage.getItem('foodprint_supabase_menu_items');
    return cached ? JSON.parse(cached) : [];
  });

  const [attendanceRecords, setAttendanceRecords] = useState<MealAttendance[]>([]);
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionLog[]>([]);

  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealth>({
    isConfigured: true,
    isConnected: true,
    tablesExist: true,
    lastChecked: new Date().toISOString(),
  });

  const [simulatedOffsetMinutes, setSimulatedOffsetMinutes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Directly fetch menu items and attendance from Supabase project
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch menu items directly from Supabase
      const { data: remoteMenu, error: menuError } = await supabase
        .from('menu_items')
        .select('*');

      if (menuError) {
        console.warn('Supabase fetch menu_items error:', menuError.message);
        setSupabaseHealth((prev) => ({
          ...prev,
          isConnected: false,
          errorMessage: menuError.message,
        }));
      } else if (remoteMenu) {
        // Map rows from Supabase, resolving both menu_date and day_of_week schemas
        const mapped: MenuItem[] = remoteMenu.map((row: any) => {
          const derivedDay = row.day_of_week || (row.menu_date ? getDayOfWeek(row.menu_date) : 'Monday');
          return {
            id: String(row.id),
            dish_name: row.dish_name || row.name || 'Dish',
            meal_type: (row.meal_type as MealType) || 'lunch',
            category: (row.category as any) || 'staple',
            is_veg: row.is_veg !== false,
            menu_date: row.menu_date,
            day_of_week: derivedDay as DayOfWeek,
            prep_grams_per_person: Number(row.prep_grams_per_person) || (row.category === 'staple' ? 180 : 140),
            description: row.description || '',
            calories: row.calories,
            allergens: row.allergens || [],
            created_at: row.created_at,
          };
        });

        setMenuItems(mapped);
        localStorage.setItem('foodprint_supabase_menu_items', JSON.stringify(mapped));
        setSupabaseHealth((prev) => ({
          ...prev,
          isConnected: true,
          tablesExist: true,
          errorMessage: undefined,
          lastChecked: new Date().toISOString(),
        }));
      }

      // 2. Fetch attendance from Supabase (checking 'attendance' first, then 'meal_attendance')
      let attData: any[] | null = null;
      const { data: att1, error: err1 } = await supabase.from('attendance').select('*');
      if (!err1 && att1) {
        attData = att1;
      } else {
        const { data: att2 } = await supabase.from('meal_attendance').select('*');
        if (att2) attData = att2;
      }

      if (attData) {
        const mappedAttendance: MealAttendance[] = attData.map((r: any) => ({
          id: String(r.id),
          user_id: r.user_id,
          target_date: r.meal_date || r.target_date,
          not_eating_tomorrow: r.not_eating_tomorrow || (r.is_attending === false),
          meal_type: r.meal_type as MealType,
          attending: r.is_attending !== undefined ? Boolean(r.is_attending) : Boolean(r.attending),
          selected_staple_id: r.staple_item_id || r.selected_staple_id || null,
          selected_side_id: r.side_item_id || r.selected_side_id || null,
          staple_name: r.staple_name || '',
          side_name: r.side_name || '',
          submitted_at: r.submitted_at || new Date().toISOString(),
          updated_at: r.updated_at,
        }));
        setAttendanceRecords(mappedAttendance);
      }

      // 3. Fetch consumption logs
      const { data: remoteLogs } = await supabase.from('consumption_logs').select('*');
      if (remoteLogs && remoteLogs.length > 0) {
        setConsumptionLogs(remoteLogs);
      }
    } catch (err: any) {
      console.warn('refreshData caught exception:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and re-fetch when authentication changes
  useEffect(() => {
    refreshData();
  }, [user?.id, role]);

  // Toggle cutoff simulation: jump past 8:00 PM IST or back to normal
  const toggleSimulateLockedCutoff = () => {
    if (simulatedOffsetMinutes === 0) {
      // Advance by +8 hours so it passes 8:00 PM IST
      setSimulatedOffsetMinutes(480);
    } else {
      setSimulatedOffsetMinutes(0);
    }
  };

  /**
   * Seed the 7-day cyclical weekly menu into the Supabase project
   */
  const seedWeeklyMenuToSupabase = async () => {
    try {
      const today = getTodayIST();
      const currentDayName = getDayOfWeek(today);
      const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const todayIdx = days.indexOf(currentDayName);

      const itemsToInsert = SEED_TEMPLATE_DISHES.map((item) => {
        const itemDayIdx = days.indexOf(item.day_of_week);
        let diffDays = itemDayIdx - todayIdx;
        if (diffDays < 0) diffDays += 7;
        const d = new Date(today);
        d.setDate(d.getDate() + diffDays);
        const dateStr = d.toISOString().split('T')[0];

        return {
          dish_name: item.dish_name,
          meal_type: item.meal_type,
          category: item.category,
          is_veg: item.is_veg,
          menu_date: dateStr,
        };
      });

      const { data, error } = await supabase.from('menu_items').insert(itemsToInsert).select();
      if (error) {
        return { success: false, error: error.message };
      }

      await refreshData();
      return { success: true, count: data?.length || itemsToInsert.length };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  };

  /**
   * Save hosteler's choices for targetDate (Day D)
   * Enforces 8:00 PM IST on Day D-1 cutoff rule!
   */
  const saveHostelerAttendance = async (
    targetDate: string,
    selections: {
      mealType: MealType;
      attending: boolean;
      stapleId?: string | null;
      sideId?: string | null;
      stapleName?: string;
      sideName?: string;
    }[],
    notEatingTomorrow: boolean
  ) => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    // Enforce Cutoff Rule: Only mess_manager can override past cutoff
    const isLocked = isCutoffPassed(targetDate, simulatedOffsetMinutes);
    if (isLocked && role !== 'mess_manager') {
      return {
        success: false,
        error: `Attendance submissions for ${targetDate} are locked. The cutoff deadline was 8:00 PM IST on the day before.`,
      };
    }

    const newRecords: MealAttendance[] = selections.map((sel) => ({
      id: `att-${user.id}-${targetDate}-${sel.mealType}`,
      user_id: user.id,
      target_date: targetDate,
      not_eating_tomorrow: notEatingTomorrow,
      meal_type: sel.mealType,
      attending: notEatingTomorrow ? false : sel.attending,
      selected_staple_id: sel.stapleId || null,
      selected_side_id: sel.sideId || null,
      staple_name: sel.stapleName,
      side_name: sel.sideName,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Update optimistic local state
    setAttendanceRecords((prev) => {
      const filtered = prev.filter(
        (r) => !(r.user_id === user.id && r.target_date === targetDate)
      );
      return [...filtered, ...newRecords];
    });

    // Write to Supabase 'attendance' table
    try {
      const attendancePayload = newRecords.map((r) => ({
        user_id: r.user_id,
        meal_date: r.target_date,
        meal_type: r.meal_type,
        is_attending: r.attending,
        staple_item_id: r.selected_staple_id,
        side_item_id: r.selected_side_id,
        submitted_at: new Date().toISOString(),
      }));

      const { error: attError } = await supabase
        .from('attendance')
        .upsert(attendancePayload, { onConflict: 'user_id,meal_date,meal_type' });

      if (attError) {
        // Fallback try meal_attendance
        await supabase
          .from('meal_attendance')
          .upsert(
            newRecords.map((r) => ({
              user_id: r.user_id,
              target_date: r.target_date,
              not_eating_tomorrow: r.not_eating_tomorrow,
              meal_type: r.meal_type,
              attending: r.attending,
              selected_staple_id: r.selected_staple_id,
              selected_side_id: r.selected_side_id,
              staple_name: r.staple_name,
              side_name: r.side_name,
            })),
            { onConflict: 'user_id,target_date,meal_type' }
          );
      }
    } catch (err: any) {
      console.warn('Attendance sync notice:', err?.message);
    }

    return { success: true };
  };

  const saveSingleMealChoice = async (
    targetDate: string,
    mealType: MealType,
    attending: boolean,
    stapleId?: string | null,
    sideId?: string | null,
    stapleName?: string,
    sideName?: string
  ) => {
    return saveHostelerAttendance(
      targetDate,
      [
        {
          mealType,
          attending,
          stapleId,
          sideId,
          stapleName,
          sideName,
        },
      ],
      false
    );
  };

  const markNotEatingTomorrow = async (targetDate: string) => {
    const meals: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
    const selections = meals.map((m) => ({
      mealType: m,
      attending: false,
    }));
    return saveHostelerAttendance(targetDate, selections, true);
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const targetDate = item.menu_date || getDateForWeekday(item.day_of_week);
    
    // Prepare payload matching Supabase columns: dish_name, meal_type, category, is_veg, menu_date
    const payload: Record<string, any> = {
      dish_name: item.dish_name,
      meal_type: item.meal_type,
      category: item.category,
      is_veg: item.is_veg,
      menu_date: targetDate,
    };

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([payload])
        .select()
        .maybeSingle();

      if (error) {
        console.warn('Supabase insert menu error:', error.message);
      }

      if (data) {
        const newItem: MenuItem = {
          id: String(data.id),
          dish_name: data.dish_name,
          meal_type: data.meal_type as MealType,
          category: data.category as any,
          is_veg: data.is_veg,
          menu_date: data.menu_date,
          day_of_week: item.day_of_week || (data.menu_date ? getDayOfWeek(data.menu_date) : 'Monday'),
          prep_grams_per_person: item.prep_grams_per_person || 150,
          description: item.description,
          created_at: data.created_at,
        };
        setMenuItems((prev) => [...prev, newItem]);
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Supabase addMenuItem exception:', err?.message);
    }

    // Local optimistic update
    const fallbackItem: MenuItem = {
      ...item,
      id: `menu-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setMenuItems((prev) => [...prev, fallbackItem]);
    return { success: true };
  };

  const updateMenuItem = async (item: MenuItem) => {
    setMenuItems((prev) => prev.map((m) => (m.id === item.id ? item : m)));

    try {
      await supabase
        .from('menu_items')
        .update({
          dish_name: item.dish_name,
          meal_type: item.meal_type,
          category: item.category,
          is_veg: item.is_veg,
          ...(item.menu_date ? { menu_date: item.menu_date } : {}),
        })
        .eq('id', item.id);
    } catch (err: any) {
      console.warn('Supabase update menu notice:', err?.message);
    }
    return { success: true };
  };

  const deleteMenuItem = async (id: string) => {
    setMenuItems((prev) => prev.filter((m) => m.id !== id));

    try {
      await supabase.from('menu_items').delete().eq('id', id);
    } catch (err: any) {
      console.warn('Supabase delete menu notice:', err?.message);
    }
    return { success: true };
  };

  const logConsumption = async (entry: Omit<ConsumptionLog, 'id'>) => {
    const newLog: ConsumptionLog = {
      ...entry,
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString(),
      logged_by: user?.id,
    };

    setConsumptionLogs((prev) => {
      const filtered = prev.filter(
        (l) => !(l.log_date === entry.log_date && l.meal_type === entry.meal_type)
      );
      return [newLog, ...filtered];
    });

    try {
      await supabase.from('consumption_logs').upsert([
        {
          log_date: entry.log_date,
          meal_type: entry.meal_type,
          confirmed_count: entry.confirmed_count,
          predicted_turnout: entry.predicted_turnout,
          actual_turnout: entry.actual_turnout,
          plates_served: entry.plates_served,
          leftover_waste_kg: entry.leftover_waste_kg,
          cost_loss_inr: entry.cost_loss_inr,
          notes: entry.notes,
          logged_by: user?.id,
        },
      ]);
    } catch (err: any) {
      console.warn('Supabase consumption log notice:', err?.message);
    }
    return { success: true };
  };

  const getMenuItemsForMeal = (day: DayOfWeek, mealType: MealType) => {
    const matching = menuItems.filter(
      (m) => m.day_of_week === day && m.meal_type === mealType
    );
    return {
      staples: matching.filter((m) => m.category === 'staple'),
      sides: matching.filter((m) => m.category === 'side'),
      extras: matching.filter(
        (m) => m.category !== 'staple' && m.category !== 'side'
      ),
    };
  };

  return (
    <DataContext.Provider
      value={{
        menuItems,
        attendanceRecords,
        consumptionLogs,
        supabaseHealth,
        simulatedOffsetMinutes,
        setSimulatedOffsetMinutes,
        toggleSimulateLockedCutoff,
        isLoading,
        supabaseMenuCount: menuItems.length,
        saveHostelerAttendance,
        saveSingleMealChoice,
        markNotEatingTomorrow,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        logConsumption,
        getMenuItemsForMeal,
        seedWeeklyMenuToSupabase,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
