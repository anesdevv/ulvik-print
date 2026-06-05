import React from 'react';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onSelectSize,
}) => {
  if (!sizes || sizes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-brand-gray flex items-center gap-1.5">
        Taille / Size: <span className="text-white font-medium">{selectedSize || ''}</span>
      </span>
      <div className="flex flex-wrap gap-2.5 mt-1">
        {sizes.map((size) => {
          const isSelected = selectedSize === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => onSelectSize(size)}
              className={`min-w-[42px] h-10 px-3 rounded-lg font-heading font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center border ${
                isSelected
                  ? 'bg-brand-orange border-brand-orange text-white scale-105 shadow-md shadow-brand-orange/15'
                  : 'bg-brand-card border-brand-border text-gray-300 hover:border-brand-gray hover:text-white'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
};
