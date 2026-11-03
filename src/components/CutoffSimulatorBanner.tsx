import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { getCutoffStatus, getISTTimeString, getTomorrowIST } from '../lib/istTime';
import { Clock, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';

export const CutoffSimulatorBanner: React.FC = () => {
  const { simulatedOffsetMinutes, setSimulatedOffsetMinutes, toggleSimulateLockedCutoff } = useData();
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  const tomorrow = getTomorrowIST(simulatedOffsetMinutes);
  const cutoffInfo = getCutoffStatus(tomorrow, simulatedOffsetMinutes);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTimeStr(getISTTimeString(simulatedOffsetMinutes));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [simulatedOffsetMinutes]);

  const isSimulated = simulatedOffsetMinutes !== 0;

  return (
    <div className={`px-4 py-2.5 border-b text-xs transition-colors ${
      isSimulated 
        ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>IST Clock:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
              {currentTimeStr || 'Loading...'}
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5">
            {cutoffInfo.isLocked ? (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                Locked for Tomorrow ({tomorrow})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Submissions Open for Tomorrow ({tomorrow}) · {cutoffInfo.statusText}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 hidden md:inline">
            Rule 1: Cutoff is 8:00 PM IST on Day D-1
          </span>
          
          <button
            onClick={toggleSimulateLockedCutoff}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              cutoffInfo.isLocked
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {cutoffInfo.isLocked ? 'Simulate: Set Before 8 PM (Open)' : 'Simulate: Set Past 8 PM (Locked)'}
          </button>

          {isSimulated && (
            <button
              onClick={() => setSimulatedOffsetMinutes(0)}
              title="Reset to real-world live time"
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
