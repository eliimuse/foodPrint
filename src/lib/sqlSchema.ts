/**
 * FoodPrint Supabase SQL Schema
 * Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lhbjaoergruaohbbague/sql
 * 
 * Enforces:
 * 1. 8:00 PM IST cutoff on Day D-1 via PostgreSQL trigger
 * 2. Role-based RLS policies for 'hosteler' and 'mess_manager'
 * 3. Seed data for 7-day cyclical mess menu
 */

export const FOODPRINT_SUPABASE_SQL = `-- ========================================================
-- FOODPRINT: HOSTEL MESS MANAGEMENT & FOOD WASTE REDUCTION
-- Run this in Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. PROFILES TABLE (Roles: 'hosteler' or 'mess_manager')
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('hosteler', 'mess_manager')) DEFAULT 'hosteler',
  room_number TEXT,
  hostel_block TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- --------------------------------------------------------
-- 2. MENU ITEMS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  category TEXT NOT NULL CHECK (category IN ('staple', 'side', 'extra', 'dessert', 'beverage')),
  dish_name TEXT NOT NULL,
  description TEXT,
  is_veg BOOLEAN DEFAULT true,
  prep_grams_per_person INTEGER DEFAULT 150,
  calories INTEGER,
  allergens TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- --------------------------------------------------------
-- 3. MEAL ATTENDANCE TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meal_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_date DATE NOT NULL, -- The meal day (Day D)
  not_eating_tomorrow BOOLEAN DEFAULT false,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  attending BOOLEAN DEFAULT true,
  selected_staple_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  selected_side_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  staple_name TEXT,
  side_name TEXT,
  submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_user_date_meal UNIQUE (user_id, target_date, meal_type)
);

-- --------------------------------------------------------
-- 4. CONSUMPTION LOGS TABLE (Actual turnout & food waste)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consumption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  confirmed_count INTEGER DEFAULT 0,
  predicted_turnout INTEGER DEFAULT 0,
  actual_turnout INTEGER DEFAULT 0,
  plates_served INTEGER DEFAULT 0,
  leftover_waste_kg NUMERIC(6,2) DEFAULT 0.0,
  cost_loss_inr NUMERIC(8,2) DEFAULT 0.0,
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_date_meal_log UNIQUE (log_date, meal_type)
);

-- --------------------------------------------------------
-- 5. CUTOFF TRIGGER: 8:00 PM IST on Day D-1
-- Core Business Rule: Attendance locked after 8:00 PM IST
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_meal_attendance_cutoff()
RETURNS TRIGGER AS $$
DECLARE
  current_ist TIMESTAMPTZ;
  cutoff_time TIMESTAMPTZ;
  is_manager BOOLEAN;
BEGIN
  -- Check if user is mess_manager (managers have override ability for exceptions)
  SELECT (role = 'mess_manager') INTO is_manager 
  FROM public.profiles 
  WHERE id = auth.uid();

  IF is_manager IS TRUE THEN
    NEW.updated_at := TIMEZONE('utc', NOW());
    RETURN NEW;
  END IF;

  -- Current timestamp in Asia/Kolkata
  current_ist := (NOW() AT TIME ZONE 'Asia/Kolkata');
  
  -- Target date D's cutoff is (D - 1 day) at 20:00:00 (8:00 PM IST)
  -- E.g. for Day D = 2026-11-04, cutoff is 2026-11-03 20:00:00 IST
  cutoff_time := ((NEW.target_date - INTERVAL '1 day')::date + TIME '20:00:00') AT TIME ZONE 'Asia/Kolkata';

  IF current_ist >= cutoff_time THEN
    RAISE EXCEPTION 'Attendance submissions for % are locked. Cutoff deadline was 8:00 PM IST on %',
      NEW.target_date, (NEW.target_date - INTERVAL '1 day')::date;
  END IF;

  NEW.updated_at := TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trg_enforce_attendance_cutoff ON public.meal_attendance;

CREATE TRIGGER trg_enforce_attendance_cutoff
BEFORE INSERT OR UPDATE ON public.meal_attendance
FOR EACH ROW
EXECUTE FUNCTION public.enforce_meal_attendance_cutoff();

-- --------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Mess managers can view all profiles" 
ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mess_manager')
);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- MENU ITEMS RLS
CREATE POLICY "Anyone authenticated can view menu items" 
ON public.menu_items FOR SELECT USING (true);

CREATE POLICY "Only mess_manager can insert menu items" 
ON public.menu_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mess_manager')
);

CREATE POLICY "Only mess_manager can update menu items" 
ON public.menu_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mess_manager')
);

CREATE POLICY "Only mess_manager can delete menu items" 
ON public.menu_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mess_manager')
);

-- MEAL ATTENDANCE RLS
-- Hostelers can only read their own attendance
CREATE POLICY "Hostelers can view own attendance" 
ON public.meal_attendance FOR SELECT USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mess_manager')
);

-- Hostelers can manage (insert/update) their own attendance
CREATE POLICY "Hostelers can insert own attendance" 
ON public.meal_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hostelers can update own attendance" 
ON public.meal_attendance FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Hostelers can delete own attendance" 
ON public.meal_attendance FOR DELETE USING (auth.uid() = user_id);

-- CONSUMPTION LOGS RLS
CREATE POLICY "Authenticated users can view consumption logs" 
ON public.consumption_logs FOR SELECT USING (true);

CREATE POLICY "Only mess_manager can insert consumption logs" 
ON public.consumption_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mess_manager')
);

CREATE POLICY "Only mess_manager can update consumption logs" 
ON public.consumption_logs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mess_manager')
);

-- --------------------------------------------------------
-- 7. INITIAL MENU SEED DATA
-- --------------------------------------------------------
INSERT INTO public.menu_items (day_of_week, meal_type, category, dish_name, description, is_veg, prep_grams_per_person)
VALUES
-- Monday
('Monday', 'breakfast', 'staple', 'Poha with Roasted Peanuts', 'Fluffy flattened rice with mustard seeds, curry leaves & lemon', true, 180),
('Monday', 'breakfast', 'staple', 'Idli with Sambar', 'Steamed rice cakes served with aromatic vegetable sambar', true, 200),
('Monday', 'breakfast', 'side', 'Coconut Chutney & Tomato Chutney', 'Freshly ground south-Indian chutneys', true, 60),
('Monday', 'breakfast', 'side', 'Sprouted Moong Salad', 'Boiled sprouts with chopped onions, coriander & chaat masala', true, 80),

('Monday', 'lunch', 'staple', 'Steamed Basmati Rice', 'Long grain steamed rice', true, 180),
('Monday', 'lunch', 'staple', 'Tawa Phulka / Roti', 'Whole wheat flatbreads with light ghee', true, 120),
('Monday', 'lunch', 'side', 'Dal Tadka (Yellow Lentils)', 'Toor dal tempered with garlic, cumin and dry red chili', true, 150),
('Monday', 'lunch', 'side', 'Aloo Gobi Matar', 'Dry spiced cauliflower, potatoes and green peas', true, 140),

('Monday', 'snacks', 'staple', 'Vegetable Cutlet with Chutney', 'Crispy spiced potato & vegetable patties', true, 120),
('Monday', 'snacks', 'staple', 'Sweet Corn Chaat', 'Steamed sweet corn with butter and spices', true, 100),
('Monday', 'snacks', 'side', 'Masala Chai', 'Cardamom & ginger infused tea', true, 150),
('Monday', 'snacks', 'side', 'Cold Coffee', 'Chilled frothy sweetened coffee', true, 150),

('Monday', 'dinner', 'staple', 'Jeera Rice', 'Fragrant cumin-infused basmati rice', true, 180),
('Monday', 'dinner', 'staple', 'Tandoori Butter Roti', 'Clay-oven baked whole wheat rotis', true, 120),
('Monday', 'dinner', 'side', 'Paneer Butter Masala', 'Rich cottage cheese in creamy tomato gravy', true, 160),
('Monday', 'dinner', 'side', 'Dal Makhani', 'Slow cooked black lentils with mild spices and cream', true, 150),

-- Tuesday
('Tuesday', 'breakfast', 'staple', 'Aloo Paratha with Curd', 'Whole wheat parathas stuffed with spiced potatoes', true, 220),
('Tuesday', 'breakfast', 'staple', 'Rava Upma with Veggies', 'Semolina savory porridge with carrots and peas', true, 180),
('Tuesday', 'breakfast', 'side', 'Fresh Mint Curd', 'Whipped yogurt with roasted cumin and mint', true, 80),
('Tuesday', 'breakfast', 'side', 'Mixed Fruit Bowl', 'Diced seasonal papaya, banana and watermelon', true, 100),

('Tuesday', 'lunch', 'staple', 'Jeera Pulav', 'Basmati rice with whole spices and cumin', true, 180),
('Tuesday', 'lunch', 'staple', 'Whole Wheat Chapati', 'Soft hand-rolled chapatis', true, 120),
('Tuesday', 'lunch', 'side', 'Rajma Masala (Red Kidney Beans)', 'Slow-simmered Punjabi style kidney beans in onion-tomato gravy', true, 170),
('Tuesday', 'lunch', 'side', 'Bhindi Masala (Okra)', 'Sautéed spiced okra with onions', true, 130),

('Tuesday', 'snacks', 'staple', 'Samosa with Mint & Saunth Chutney', 'Crispy flaky crust pastry filled with spiced potatoes', true, 120),
('Tuesday', 'snacks', 'staple', 'Poha Chivda', 'Light roasted savory mixture with curry leaves', true, 80),
('Tuesday', 'snacks', 'side', 'Ginger Chai', 'Fresh crushed ginger spiced tea', true, 150),
('Tuesday', 'snacks', 'side', 'Lemon Iced Tea', 'Refreshing chilled lemon tea', true, 150),

('Tuesday', 'dinner', 'staple', 'Steamed Rice', 'Steamed white rice', true, 180),
('Tuesday', 'dinner', 'staple', 'Tawa Roti', 'Hot puffed whole wheat rotis', true, 120),
('Tuesday', 'dinner', 'side', 'Mix Vegetable Korma', 'Assorted seasonal vegetables in mild coconut-cashew gravy', true, 160),
('Tuesday', 'dinner', 'side', 'Chana Dal Fry', 'Split Bengal gram cooked with onions and tomatoes', true, 150),

-- Wednesday
('Wednesday', 'breakfast', 'staple', 'Masala Dosa with Sambar', 'Crispy fermented rice-lentil crepe with potato masala', true, 220),
('Wednesday', 'breakfast', 'staple', 'Vegetable Semiya Upma', 'Roasted vermicelli with vegetables and mustard seeds', true, 180),
('Wednesday', 'breakfast', 'side', 'Coconut & Onion Chutney', 'Traditional south-Indian coconut dip', true, 70),
('Wednesday', 'breakfast', 'side', 'Boiled Eggs / Banana', 'Choice of 2 boiled eggs or ripe banana', false, 100),

('Wednesday', 'lunch', 'staple', 'Steamed Rice', 'Steamed white rice', true, 180),
('Wednesday', 'lunch', 'staple', 'Phulka', 'Soft dry puffed rotis', true, 120),
('Wednesday', 'lunch', 'side', 'Chole Masala (Chickpeas)', 'Spiced Amritsari style chickpeas in tangy gravy', true, 170),
('Wednesday', 'lunch', 'side', 'Baingan Bharta (Roasted Eggplant)', 'Smoky roasted mashed eggplant cooked with tomatoes and spices', true, 140),

('Wednesday', 'snacks', 'staple', 'Pav Bhaji', 'Spiced mashed vegetable curry with butter-toasted buns', true, 180),
('Wednesday', 'snacks', 'staple', 'Bhel Puri', 'Puffed rice, sev, vegetables and tangy tamarind sauce', true, 120),
('Wednesday', 'snacks', 'side', 'Special Elaichi Chai', 'Cardamom infused milk tea', true, 150),
('Wednesday', 'snacks', 'side', 'Buttermilk / Chaas', 'Cool spiced salted yogurt drink with coriander', true, 180),

('Wednesday', 'dinner', 'staple', 'Vegetable Dum Biryani', 'Layered fragrant basmati rice with marinated vegetables and mint', true, 220),
('Wednesday', 'dinner', 'staple', 'Tandoori Roti', 'Oven baked whole wheat flatbread', true, 120),
('Wednesday', 'dinner', 'side', 'Paneer Do Pyaza', 'Cottage cheese cubes tossed with caramelised shallots and spices', true, 160),
('Wednesday', 'dinner', 'side', 'Boondi Raita', 'Whipped creamy yogurt with crisp chickpea puffs', true, 100),

-- Thursday
('Thursday', 'breakfast', 'staple', 'Methi Thepla with Pickle & Curd', 'Gujarati spiced flatbreads made with fresh fenugreek leaves', true, 200),
('Thursday', 'breakfast', 'staple', 'Bread Omelette / Veg Sandwich', 'Fluffy spiced egg omelette or grilled vegetable sandwich', false, 180),
('Thursday', 'breakfast', 'side', 'Fresh Curd & Mango Pickle', 'Chilled yogurt and traditional pickle', true, 80),
('Thursday', 'breakfast', 'side', 'Papaya Slices', 'Freshly sliced seasonal fruit', true, 100),

('Thursday', 'lunch', 'staple', 'Peas Pulav', 'Basmati rice cooked with sweet green peas and whole aromatics', true, 180),
('Thursday', 'lunch', 'staple', 'Tawa Roti', 'Soft whole wheat flatbreads', true, 120),
('Thursday', 'lunch', 'side', 'Kadai Paneer', 'Paneer cubes and bell peppers tossed in fresh ground coriander and chili', true, 160),
('Thursday', 'lunch', 'side', 'Moong Dal Tadka', 'Light yellow moong dal tempered with ghee, cumin & heeng', true, 150),

('Thursday', 'snacks', 'staple', 'Bread Pakora with Mint Chutney', 'Spiced potato stuffed bread fritters', true, 140),
('Thursday', 'snacks', 'staple', 'Dhokla with Green Chili', 'Steamed spongy gram flour cakes with mustard tempering', true, 120),
('Thursday', 'snacks', 'side', 'Adrak Masala Chai', 'Strong ginger and clove infused tea', true, 150),
('Thursday', 'snacks', 'side', 'Sweet Lassi', 'Chilled thick Punjabi sweet yogurt drink', true, 180),

('Thursday', 'dinner', 'staple', 'Steamed Rice', 'Steamed white rice', true, 180),
('Thursday', 'dinner', 'staple', 'Butter Chapati', 'Soft chapatis with light butter', true, 120),
('Thursday', 'dinner', 'side', 'Malai Kofta', 'Cottage cheese & potato dumplings in velvety cashew-tomato gravy', true, 170),
('Thursday', 'dinner', 'side', 'Panchmel Dal (5 Lentils)', 'Rajasthani blend of five lentils slow-tempered with dry spices', true, 150),

-- Friday
('Friday', 'breakfast', 'staple', 'Medu Vada with Sambhar', 'Crispy golden lentil doughnuts with coconut chutney and hot sambar', true, 200),
('Friday', 'breakfast', 'staple', 'Sabudana Khichdi', 'Tapioca pearls sautéed with roasted peanuts, cumin & green chilies', true, 180),
('Friday', 'breakfast', 'side', 'Coconut & Coriander Chutney', 'Traditional fresh herb chutney', true, 70),
('Friday', 'breakfast', 'side', 'Boiled Sprouts', 'High protein lightly tossed sprouted moong', true, 90),

('Friday', 'lunch', 'staple', 'Steamed Basmati Rice', 'Steamed fluffy basmati rice', true, 180),
('Friday', 'lunch', 'staple', 'Phulka Roti', 'Soft dry puffed wheat rotis', true, 120),
('Friday', 'lunch', 'side', 'Kadhi Pakora', 'Crisp onion-besan fritters simmered in tangy spiced yogurt gravy', true, 180),
('Friday', 'lunch', 'side', 'Jeera Aloo', 'Dry roasted baby potatoes with cumin, turmeric and green chili', true, 130),

('Friday', 'snacks', 'staple', 'Aloo Tikki Chaat', 'Crisp potato patties topped with beaten yogurt, tamarind and green chutney', true, 160),
('Friday', 'snacks', 'staple', 'Roasted Chana & Peanuts', 'Nutritious crunchy protein mix', true, 80),
('Friday', 'snacks', 'side', 'Cutting Masala Chai', 'Hot spiced tea', true, 150),
('Friday', 'snacks', 'side', 'Fruit Juice (Orange/Sweet Lime)', 'Chilled citrus fruit juice', true, 150),

('Friday', 'dinner', 'staple', 'Hyderabadi Veg Biryani / Egg Biryani', 'Richly flavored spiced basmati rice with caramelized onions and saffron', false, 230),
('Friday', 'dinner', 'staple', 'Rumali / Tandoori Roti', 'Soft thin flatbread or clay oven roti', true, 120),
('Friday', 'dinner', 'side', 'Shahi Paneer', 'Royal paneer preparation in creamy almond-onion gravy', true, 170),
('Friday', 'dinner', 'side', 'Cucumber & Mint Raita', 'Refreshing whipped yogurt with diced cucumber and cumin', true, 100),

-- Saturday
('Saturday', 'breakfast', 'staple', 'Poori Bhaji', 'Crisp puffed whole wheat pooris with spiced potato curry', true, 220),
('Saturday', 'breakfast', 'staple', 'Cornflakes / Oats with Hot Milk', 'Breakfast cereal with warm milk, honey and dry fruits', true, 180),
('Saturday', 'breakfast', 'side', 'Halwa (Suji)', 'Warm semolina pudding with ghee and cardamom', true, 80),
('Saturday', 'breakfast', 'side', 'Boiled Eggs / Seasonal Fruit', 'Protein booster eggs or fresh fruit', false, 90),

('Saturday', 'lunch', 'staple', 'Khichdi with Ghee & Papad', 'Comforting rice and moong dal porridge topped with golden ghee', true, 200),
('Saturday', 'lunch', 'staple', 'Tawa Roti', 'Whole wheat flatbread', true, 120),
('Saturday', 'lunch', 'side', 'Paneer Bhurji', 'Scrambled spiced cottage cheese with onions, tomatoes and green peas', true, 150),
('Saturday', 'lunch', 'side', 'Baingan Masala', 'Spiced baby brinjals in tangy gravy', true, 130),

('Saturday', 'snacks', 'staple', 'Veg Grilled Sandwich', 'Toasted triple-decker sandwich with mint spread and cheese', true, 160),
('Saturday', 'snacks', 'staple', 'Masala Murmura', 'Spiced crunchy puffed rice with roasted peanuts', true, 70),
('Saturday', 'snacks', 'side', 'Cardamom Tea', 'Fragrant hot tea', true, 150),
('Saturday', 'snacks', 'side', 'Mango Shake', 'Chilled rich mango milk drink', true, 180),

('Saturday', 'dinner', 'staple', 'Jeera Rice', 'Cumin spiced fragrant basmati rice', true, 180),
('Saturday', 'dinner', 'staple', 'Butter Naan / Roti', 'Soft leavened bread brushed with melted butter', true, 130),
('Saturday', 'dinner', 'side', 'Matar Paneer', 'Classic peas and cottage cheese in aromatic tomato gravy', true, 160),
('Saturday', 'dinner', 'side', 'Dal Tadka', 'Yellow lentils tempered with ghee, garlic and red chili', true, 150),

-- Sunday
('Sunday', 'breakfast', 'staple', 'Chole Bhature', 'Fluffy deep-fried sourdough breads served with spiced chickpea curry', true, 250),
('Sunday', 'breakfast', 'staple', 'Uttapam with Onion & Tomato', 'Thick south-Indian savoury rice pancake topped with fresh vegetables', true, 200),
('Sunday', 'breakfast', 'side', 'Coconut Chutney & Pickle', 'Freshly ground south-Indian chutney', true, 60),
('Sunday', 'breakfast', 'side', 'Masala Buttermilk', 'Spiced cooling yogurt drink with roasted cumin', true, 150),

('Sunday', 'lunch', 'staple', 'Special Sunday Dum Pulav', 'Basmati rice cooked in whole spices with roasted cashews and paneer', true, 200),
('Sunday', 'lunch', 'staple', 'Tandoori Roti', 'Clay oven baked bread', true, 120),
('Sunday', 'lunch', 'side', 'Dum Aloo Kashmiri', 'Baby potatoes slow cooked in fennel and yogurt gravy', true, 160),
('Sunday', 'lunch', 'side', 'Gulab Jamun (Dessert)', 'Soft melt-in-mouth milk dough balls soaked in rose-cardamom syrup', true, 90),

('Sunday', 'snacks', 'staple', 'Maggi Noodles / Veg Pasta', 'Hostel favorite hot spiced noodles or penne in tomato-herb sauce', true, 160),
('Sunday', 'snacks', 'staple', 'Biscuit & Rusk Platter', 'Assortment of bakery cookies and wheat rusks', true, 70),
('Sunday', 'snacks', 'side', 'Special Ginger-Elaichi Chai', 'Double brewed aromatic tea', true, 150),
('Sunday', 'snacks', 'side', 'Cold Bournvita Milk', 'Chilled chocolate malt milk', true, 180),

('Sunday', 'dinner', 'staple', 'Vegetable Pulao', 'Light and flavorful rice with garden vegetables', true, 180),
('Sunday', 'dinner', 'staple', 'Phulka', 'Warm dry puffed rotis', true, 120),
('Sunday', 'dinner', 'side', 'Paneer Tikka Masala', 'Char-grilled cottage cheese cubes in rich spiced gravy', true, 170),
('Sunday', 'dinner', 'side', 'Yellow Moong Dal', 'Simple soothing lentils with cumin and turmeric', true, 140)
ON CONFLICT DO NOTHING;
`;
