import { BirthdayCustomer } from "./types";

interface Props {
    customer: BirthdayCustomer;
    onSendMessage: () => void;
}

export default function BirthdayMobileCard({ customer, onSendMessage }: Props) {
  return (
    <div className="p-4 rounded-xl shadow-sm border flex flex-col gap-4 relative transition-colors bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      
      {/* Header with Date */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-md">
            <span className="material-symbols-outlined text-rose-500 text-[18px]">cake</span>
            <span className="text-sm font-medium text-rose-700 dark:text-rose-300">{customer.formattedBirthDate}</span>
        </div>
        <span className="text-xs font-mono text-slate-400">ID: {customer.id}</span>
      </div>

      {/* Customer Info */}
      <div className="flex flex-col gap-1">
          <div className="text-base font-semibold text-slate-900 dark:text-white">{customer.name}</div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
             <span className="material-symbols-outlined text-[16px]">call</span>
             {customer.phoneNumber}
          </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <button 
            onClick={onSendMessage}
            className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-green-500/20 active:scale-[0.98]"
        >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Send Message
        </button>
      </div>
    </div>
  );
}