import { Entry } from './types';

export default function EntryRow({ entry, onView }: { entry: Entry, onView: () => void }) {
  const statusStyles = {
    'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'IN PROGRESS': 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300',
    'OVERDUE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };

  const statusDot = {
    'COMPLETED': 'bg-green-500',
    'IN PROGRESS': 'bg-primary animate-pulse',
    'OVERDUE': 'bg-red-500'
  };

  return (
    <tr className="group transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-300">{entry.id}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900 dark:text-white">{entry.customerName}</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">{entry.phoneNumber}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {entry.startTimeDate} <span className="text-slate-400 text-xs ml-1">{entry.startTime}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {entry.endTimeDate === '--' ? '--' : <>{entry.endTimeDate} <span className="text-slate-400 text-xs ml-1">{entry.endTime}</span></>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{entry.duration}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[entry.status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusDot[entry.status]}`}></span>
          {entry.status}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onView(); // Trigger the modal
            }} 
            className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </td>
    </tr>
  );
}