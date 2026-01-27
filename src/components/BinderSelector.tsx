import type { BinderType } from '../types';

interface BinderSelectorProps {
  value: BinderType;
  onChange: (value: BinderType) => void;
}

const binderOptions: { value: BinderType; label: string; description: string }[] = [
  { value: 'a5-20-hole', label: 'A5 20-Hole', description: 'Japanese standard' },
  { value: 'a5-2-hole', label: 'A5 2-Hole', description: 'ISO 838' },
  { value: 'a5-6-hole-filofax', label: 'A5 6-Hole Filofax', description: '50.8mm gap' },
  { value: 'a5-6-hole-standard', label: 'A5 6-Hole Standard', description: '70mm gap' },
  { value: 'a4-4-hole', label: 'A4 4-Hole', description: 'European' },
];

export const BinderSelector = ({ value, onChange }: BinderSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Binder Type</label>
      <div className="grid grid-cols-1 gap-2">
        {binderOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              px-4 py-3 rounded-lg border text-left transition-all
              ${
                value === option.value
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="font-medium text-gray-900">{option.label}</div>
            <div className="text-sm text-gray-500">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
