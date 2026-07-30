import type { ProjectionType } from './useD3Projection'

interface MapProjectionToggleProps {
  value: ProjectionType
  onChange: (value: ProjectionType) => void
}

const OPTIONS: { value: ProjectionType; label: string }[] = [
  { value: 'equirectangular', label: 'Flat map' },
  { value: 'orthographic', label: 'Globe' },
]

export function MapProjectionToggle({
  value,
  onChange,
}: MapProjectionToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Map projection"
      className="inline-flex rounded-md border border-slate-700 bg-slate-900/80 p-1"
    >
      {OPTIONS.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-sky-500 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
