'use client';

import { NewsFlag } from '@/lib/db/schema';
import { getFlagColorClasses } from '@/lib/utils/badges';
import { UI_TEXT, getFlagLabel } from '@/lib/utils/constants';

const FLAGS: NewsFlag[] = ['IMPORTANTE', 'ACTUALIZACION', 'URGENTE', 'CAIDA_SISTEMA'];

interface FlagSelectorProps {
  selected: NewsFlag[];
  onChange: (flags: NewsFlag[]) => void;
}

export function FlagSelector({ selected, onChange }: FlagSelectorProps) {
  function toggleFlag(flag: NewsFlag) {
    const newFlags = selected.includes(flag)
      ? selected.filter((f) => f !== flag)
      : [...selected, flag];
    onChange(newFlags);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {UI_TEXT.admin.selectFlags}
      </label>
      <div className="flex flex-wrap gap-2">
        {FLAGS.map((flag) => (
          <label key={flag} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(flag)}
              onChange={() => toggleFlag(flag)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`px-2 py-1 rounded text-xs font-medium ${getFlagColorClasses(flag)}`}>
              {getFlagLabel(flag)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
