export type UserRole = 'hosteler' | 'mess_manager';

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export type DishCategory = 'staple' | 'side' | 'extra' | 'dessert' | 'beverage';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  room_number?: string;
  room_no?: string;
  hostel_block?: string;
  created_at?: string;
}

export interface MenuItem {
  id: string;
  day_of_week: DayOfWeek;
  meal_type: MealType;
  category: DishCategory;
  dish_name: string;
  menu_date?: string;
  description?: string;
  is_veg: boolean;
  prep_grams_per_person: number;
  calories?: number;
  allergens?: string[];
  created_at?: string;
}

export interface MealAttendance {
  id: string;
  user_id: string;
  target_date: string; // YYYY-MM-DD (Day D)
  not_eating_tomorrow: boolean;
  meal_type: MealType;
  attending: boolean;
  selected_staple_id?: string | null;
  selected_side_id?: string | null;
  staple_name?: string;
  side_name?: string;
  submitted_at: string;
  updated_at?: string;
}

export interface ConsumptionLog {
  id: string;
  log_date: string; // YYYY-MM-DD
  meal_type: MealType;
  confirmed_count: number;
  predicted_turnout: number;
  actual_turnout: number;
  plates_served: number;
  leftover_waste_kg: number;
  cost_loss_inr: number;
  notes?: string;
  logged_by?: string;
  created_at?: string;
}

export interface MealPrepRequirement {
  ingredient: string;
  category: 'grain' | 'vegetable' | 'dairy' | 'pulse' | 'spice';
  unit: 'kg' | 'liters' | 'pieces';
  perPersonAmount: number; // in grams or pieces
  recommendedTotal: number;
}

export interface MLPredictionResult {
  meal_type: MealType;
  confirmed_count: number;
  predicted_turnout: number;
  confidence_interval: [number, number];
  predicted_waste_kg_without_prep_adjustment: number;
  recommended_prep_servings: number;
  is_ml_service_active: boolean;
}
