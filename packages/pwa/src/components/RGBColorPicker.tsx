import { useState, useEffect } from 'react';

interface RGBColorPickerProps {
  value: { r: number; g: number; b: number };
  onChange: (color: { r: number; g: number; b: number }) => void;
}

export function RGBColorPicker({ value, onChange }: RGBColorPickerProps) {
  const [rgb, setRgb] = useState(value);

  useEffect(() => {
    setRgb(value);
  }, [value]);

  const handleChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const newRgb = { ...rgb, [channel]: val };
    setRgb(newRgb);
    onChange(newRgb);
  };

  const handleHexChange = (hex: string) => {
    // Remove # if present
    hex = hex.replace('#', '');

    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        setRgb({ r, g, b });
        onChange({ r, g, b });
      }
    }
  };

  const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const presetColors = [
    { name: 'Red', r: 255, g: 0, b: 0 },
    { name: 'Green', r: 0, g: 255, b: 0 },
    { name: 'Blue', r: 0, g: 0, b: 255 },
    { name: 'Yellow', r: 255, g: 255, b: 0 },
    { name: 'Cyan', r: 0, g: 255, b: 255 },
    { name: 'Magenta', r: 255, g: 0, b: 255 },
    { name: 'White', r: 255, g: 255, b: 255 },
    { name: 'Off', r: 0, g: 0, b: 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Color preview */}
      <div className="flex items-center space-x-3">
        <div
          className="w-16 h-16 rounded-lg border-2 border-slate-600"
          style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
        />
        <div className="flex-1">
          <input
            type="text"
            value={rgbToHex(rgb)}
            onChange={(e) => handleHexChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="#RRGGBB"
          />
        </div>
      </div>

      {/* RGB Faders */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-red-400 font-medium">Red</label>
            <span className="text-white text-sm">{Math.round(rgb.r)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.r}
            onChange={(e) => handleChange('r', parseInt(e.target.value))}
            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-green-400 font-medium">Green</label>
            <span className="text-white text-sm">{Math.round(rgb.g)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.g}
            onChange={(e) => handleChange('g', parseInt(e.target.value))}
            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-blue-400 font-medium">Blue</label>
            <span className="text-white text-sm">{Math.round(rgb.b)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.b}
            onChange={(e) => handleChange('b', parseInt(e.target.value))}
            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Preset colors */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Presets</label>
        <div className="grid grid-cols-4 gap-2">
          {presetColors.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                setRgb(color);
                onChange(color);
              }}
              className="aspect-square rounded-lg border-2 border-slate-600 hover:border-primary-500 transition-colors"
              style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
