import { Entry } from './types';

interface Props {
  entry: Entry;
  isSelected: boolean;
  onToggle: () => void;
}

export default function EntryMobileCard({ entry, isSelected, onToggle }: Props) {
  const statusStyles = {
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'In Progress': 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300',
    'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };

  return (
    <div 
        onClick={onToggle}
        className={`p-4 rounded-xl shadow-sm border flex flex-col gap-4 relative cursor-pointer transition-colors
            ${isSelected 
                ? 'bg-blue-50 dark:bg-blue-900/10 border-primary/50' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}
        `}
    >
      {/* Absolute Checkbox */}
      <div className="absolute top-4 right-4">
        <input 
            type="checkbox" 
            checked={isSelected}
            readOnly
            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary pointer-events-none"
        />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start pr-8">
        <div className="flex flex-col">
          <span className="text-sm font-mono text-slate-500">{entry.id}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit mt-1 ${statusStyles[entry.status]}`}>
            {entry.status}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-3 py-2 border-y border-slate-100 dark:border-slate-700/50">
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-white">{entry.customerName}</div>
          <div className="text-xs text-slate-400">{entry.phoneNumber}</div>
        </div>
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500 uppercase">Start</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.startTime}</p>
          <p className="text-xs text-slate-400">{entry.startTimeDate}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase">End</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.endTime}</p>
          <p className="text-xs text-slate-400">{entry.endTimeDate}</p>
        </div>
      </div>
    </div>
  );
}