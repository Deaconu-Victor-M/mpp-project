'use client';

import BurgerIcon from './icons/burger-icon.svg';
import TimerIcon from './icons/timer-icon.svg';
import StatusIcon from './icons/status-icon.svg';

type FilterOption = 'all' | 'active' | 'completed';

interface FilterTabsProps {
  activeFilter: FilterOption;
  onChange: (filter: FilterOption) => void;
}

export default function FilterTabs({ activeFilter, onChange }: FilterTabsProps) {
  return (
    <div className="flex flex-row gap-0">
      <button
        className={`flex items-center py-3 px-3 text-sm font-medium ${
          activeFilter === 'all'
            ? 'border-b border-white text-white'
            : 'text-foreground opacity-50 hover:text-gray-200'
        }`}
        onClick={() => onChange('all')}
      >
        <BurgerIcon className="w-4 h-4 mr-2" />
        All Records
      </button>

      <button
        className={`flex items-center py-3 px-3 text-sm font-medium ${
          activeFilter === 'active'
            ? 'border-b border-white text-white'
            : 'text-foreground opacity-50 hover:text-gray-200'
        }`}
        onClick={() => onChange('active')}
      >
        <TimerIcon className="w-4 h-4 mr-2" />
        Due
      </button>

      <button
        className={`flex items-center py-3 px-3 text-sm font-medium ${
          activeFilter === 'completed'
            ? 'border-b border-white text-white'
            : 'text-foreground opacity-50 hover:text-gray-200'
        }`}
        onClick={() => onChange('completed')}
      >
        <StatusIcon className="w-4 h-4 mr-2" />
        Completed
      </button>
    </div>
  );
} 