import React from 'react';

interface RatioboxProps {
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
}

const ratios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const Ratiobox: React.FC<RatioboxProps> = ({ selectedRatio, onRatioChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Aspect Ratio</label>
      <div className="grid grid-cols-5 gap-2">
        {ratios.map(ratio => (
          <button
            key={ratio}
            onClick={() => onRatioChange(ratio)}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors duration-200 ${
              selectedRatio === ratio
                ? 'bg-[var(--accent-primary)] text-white ring-2 ring-white'
                : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
            }`}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Ratiobox;