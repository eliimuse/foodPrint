import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, Clock, Brain, ChefHat } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      step: '01',
      title: 'Hostelers Confirm Ahead',
      desc: 'Students confirm next-day meals and choose 1 staple + 1 side before 8:00 PM IST. Single-click opt-out when eating outside.',
      icon: <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
    },
    {
      step: '02',
      title: 'ML Predicts Real Turnout',
      desc: 'Machine learning accounts for hostel drop-out patterns and weather to predict the actual headcount (confirmed count × 0.90).',
      icon: <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
    },
    {
      step: '03',
      title: 'Zero Surplus Kitchen Prep',
      desc: 'Mess managers receive exact raw ingredient kilograms (rice, atta, dal, veggies) to cook precisely what will be eaten.',
      icon: <ChefHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
    },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center">
      {/* Wordmark Logo */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md">
          <Leaf className="w-6 h-6" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          FoodPrint
        </h1>
      </div>

      {/* Tagline */}
      <p className="text-2xl sm:text-3xl font-bold tracking-tight text-orange-600 dark:text-orange-400 mb-3">
        Know how much to cook.
      </p>

      {/* Subtitle */}
      <p className="max-w-xl text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-10 leading-relaxed text-balance">
        Preventing tons of good food from dumpsters through student meal choices, an airtight 8:00 PM IST cutoff, and intelligent kitchen prep sheets.
      </p>

      {/* Primary Action Button */}
      <button
        onClick={() => navigate('/home')}
        className="inline-flex items-center gap-2.5 px-8 py-3.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer mb-16"
      >
        <span>Get Started</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* 3-Step Explainer */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {steps.map((item) => (
          <div
            key={item.step}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60 flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                STEP {item.step}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {item.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
