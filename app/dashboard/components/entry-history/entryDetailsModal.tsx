import { Entry } from './types';

interface Props {
  entry: Entry;
  onClose: () => void;
}

export default function EntryDetailsModal({ entry, onClose }: Props) {
  
  const statusStyles = {
    'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    'IN PROGRESS': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'OVERDUE': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
          <div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white">Entry Details</h3>
             <p className="text-sm text-slate-500 font-mono">{entry.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
            
            {/* Status Banner */}
            <div className={`p-3 rounded-lg border flex items-center justify-between ${statusStyles[entry.status]}`}>
                <span className="text-sm font-semibold">Current Status</span>
                <span className="text-sm font-bold tracking-wide">{entry.status}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Section: Customer */}
                <div className="col-span-full md:col-span-1 flex flex-col gap-4">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">Customer Info</h4>
                    <div className="flex flex-col gap-3">
                         <DetailRow label="Name" value={entry.customerName} />
                         <DetailRow label="Mobile" value={entry.phoneNumber} />
                    </div>
                </div>

                 {/* Section: Pax */}
                 <div className="col-span-full md:col-span-1 flex flex-col gap-4">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">Guest Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                         <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                            <span className="block text-2xl font-bold text-slate-700 dark:text-white">{entry.adults}</span>
                            <span className="text-xs text-slate-500 uppercase">Adults</span>
                         </div>
                         <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                            <span className="block text-2xl font-bold text-slate-700 dark:text-white">{entry.children}</span>
                            <span className="text-xs text-slate-500 uppercase">Children</span>
                         </div>
                    </div>
                </div>

                {/* Section: Timing */}
                <div className="col-span-full flex flex-col gap-4">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">Timing</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <TimeBox label="Start Time" time={entry.startTime} date={entry.startTimeDate} />
                        <TimeBox label="Expected End" time={entry.expectedEndTime || '--'} date={entry.endTimeDate} />
                        <TimeBox label="Actual End" time={entry.endTime} date={entry.endTimeDate === '--' ? '' : entry.endTimeDate} highlight={entry.endTime !== '--'} />
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500">Duration</span>
                            <span className="font-semibold text-slate-900 dark:text-white text-lg">{entry.duration}</span>
                        </div>
                    </div>
                </div>

                {/* Section: Billing */}
                <div className="col-span-full flex flex-col gap-4">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">Billing Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500">Actual Cost</span>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">₹{entry.actualCost}</span>
                         </div>
                         
                         {entry.discountPercentage > 0 && (
                             <>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500">Discount Applied</span>
                                    <span className="text-xl font-bold text-green-600">{entry.discountPercentage}%</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500">Discount Reason</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{entry.discountReason}</span>
                                </div>
                             </>
                         )}
                         
                         {entry.discountPercentage === 0 && (
                            <div className="col-span-2 flex items-center text-slate-400 text-sm italic">
                                No discount applied
                            </div>
                         )}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components for the Modal
function DetailRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2 last:border-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">{value}</span>
        </div>
    )
}

function TimeBox({ label, time, date, highlight = false }: { label: string, time: string, date: string, highlight?: boolean }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-slate-500 mb-1">{label}</span>
            <span className={`font-semibold text-lg ${highlight ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{time}</span>
            <span className="text-xs text-slate-400">{date}</span>
        </div>
    )
}