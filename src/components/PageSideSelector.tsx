import type { PageSide } from '../types';

interface PageSideSelectorProps {
  value: PageSide;
  onChange: (value: PageSide) => void;
}

export const PageSideSelector = ({ value, onChange }: PageSideSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Page Side</label>
      <div className="flex gap-2">
        <button
          onClick={() => onChange('left')}
          className={`
            flex-1 px-4 py-3 rounded-lg border transition-all
            ${
              value === 'left'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="1" strokeWidth="1.5" />
              <line x1="19" y1="6" x2="19" y2="18" strokeWidth="2" />
              <circle cx="19" cy="8" r="1" fill="currentColor" />
              <circle cx="19" cy="12" r="1" fill="currentColor" />
              <circle cx="19" cy="16" r="1" fill="currentColor" />
            </svg>
            <span className="font-medium text-gray-900">Left Page</span>
          </div>
          <div className="text-sm text-gray-500">Holes on right edge</div>
        </button>
        <button
          onClick={() => onChange('right')}
          className={`
            flex-1 px-4 py-3 rounded-lg border transition-all
            ${
              value === 'right'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="1" strokeWidth="1.5" />
              <line x1="5" y1="6" x2="5" y2="18" strokeWidth="2" />
              <circle cx="5" cy="8" r="1" fill="currentColor" />
              <circle cx="5" cy="12" r="1" fill="currentColor" />
              <circle cx="5" cy="16" r="1" fill="currentColor" />
            </svg>
            <span className="font-medium text-gray-900">Right Page</span>
          </div>
          <div className="text-sm text-gray-500">Holes on left edge</div>
        </button>
      </div>
    </div>
  );
};
