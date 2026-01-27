interface MarginToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const MarginToggle = ({ value, onChange }: MarginToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
      <div>
        <div className="font-medium text-gray-900">Content Padding</div>
        <div className="text-sm text-gray-500">Add 5mm padding from hole area</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`
          relative w-12 h-6 rounded-full transition-colors
          ${value ? 'bg-blue-500' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
            ${value ? 'translate-x-6' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};
