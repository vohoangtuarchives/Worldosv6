"use client";

interface SliderFieldProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}

export function SliderField({ label, description, value, min, max, step = 1, unit = "", onChange }: SliderFieldProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="field-row">
      <div className="field-label-group">
        <label className="field-label">{label}</label>
        {description && <p className="field-desc">{description}</p>}
      </div>
      <div className="slider-group">
        <div className="slider-wrap">
          <div className="slider-fill" style={{ width: `${pct}%` }} />
          <input
            type="range"
            className="slider-input"
            min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
        <span className="slider-value">{value}{unit}</span>
      </div>
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function ToggleField({ label, description, value, onChange }: ToggleFieldProps) {
  return (
    <div className="field-row">
      <div className="field-label-group">
        <label className="field-label">{label}</label>
        {description && <p className="field-desc">{description}</p>}
      </div>
      <button
        className={`toggle-btn${value ? " on" : ""}`}
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (v: number) => void;
}

export function NumberField({ label, description, value, min, max, unit, onChange }: NumberFieldProps) {
  return (
    <div className="field-row">
      <div className="field-label-group">
        <label className="field-label">{label}</label>
        {description && <p className="field-desc">{description}</p>}
      </div>
      <div className="number-group">
        <input
          type="number"
          className="number-input"
          value={value} min={min} max={max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {unit && <span className="number-unit">{unit}</span>}
      </div>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

export function SelectField({ label, description, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="field-row">
      <div className="field-label-group">
        <label className="field-label">{label}</label>
        {description && <p className="field-desc">{description}</p>}
      </div>
      <select
        className="select-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
