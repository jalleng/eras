import { formatDisplayDate } from '../../utils/dateUtils'

interface DateDisplayProps {
  isoDate: string
  label: string
}

export function DateDisplay({ isoDate, label }: DateDisplayProps) {
  return (
    <div>
      <p className="text-xl font-semibold text-white sm:text-2xl">
        {formatDisplayDate(isoDate)}
      </p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  )
}
