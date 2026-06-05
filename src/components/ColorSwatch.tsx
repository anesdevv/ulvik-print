import React from 'react';
import { Check } from 'lucide-react';

interface Color {
  label: string;
  hex: string;
}

interface ColorSwatchProps {
  colors: Color[];
  selectedColor: Color | null;
  onSelectColor: (color: Color) => void;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  colors,
  selectedColor,
  onSelectColor,
}) => {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-brand-gray flex items-center gap-1.5">
        Couleur / Color: <span className="text-white font-medium">{selectedColor?.label || ''}</span>
      </span>
      <div className="flex flex-wrap gap-3 mt-1">
        {colors.map((color, index) => {
          const isSelected = selectedColor?.label === color.label;
          // Determine if color is white/light to adjust checkmark color
          const isLightColor = ['#ffffff', '#fff', '#f3f4f6', '#f9fafb', '#ffff00', '#ffeb3b'].includes(
            color.hex.toLowerCase()
          );

          return (
            <button
              key={`${color.label}-${index}`}
              type="button"
              onClick={() => onSelectColor(color)}
              className={`relative w-9 h-9 rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-105 border-2 ${
                isSelected
                  ? 'border-brand-orange scale-105 ring-2 ring-brand-orange/30'
                  : 'border-brand-border hover:border-brand-gray'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.label}
            >
              {isSelected && (
                <Check
                  className={`w-4 h-4 ${isLightColor ? 'text-black' : 'text-white'} stroke-[3]`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
