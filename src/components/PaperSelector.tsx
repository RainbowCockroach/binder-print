import type { PaperSize } from '../types';

interface PaperSelectorProps {
  value: PaperSize;
  onChange: (value: PaperSize) => void;
}

export const PaperSelector = ({ value, onChange }: PaperSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Paper Size</label>
      <div className="flex gap-2">
        <button
          onClick={() => onChange('A4')}
          className={`
            flex-1 px-4 py-3 rounded-lg border transition-all
            ${
              value === 'A4'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="font-medium text-gray-900">A4</div>
          <div className="text-sm text-gray-500">210 x 297 mm</div>
        </button>
        <button
          onClick={() => onChange('A5')}
          className={`
            flex-1 px-4 py-3 rounded-lg border transition-all
            ${
              value === 'A5'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="font-medium text-gray-900">A5</div>
          <div className="text-sm text-gray-500">148 x 210 mm</div>
        </button>
      </div>
    </div>
  );
};
